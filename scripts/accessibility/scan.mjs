// scan.mjs — Scanner d'accessibilité multi-pages (axe-core + Puppeteer) + stockage Supabase
//
// Étend le prototype de départ : scanne plusieurs gabarits d'un même site
// (accueil, contact, panier, fiche produit...), agrège un score global pondéré
// par nombre de nœuds, et enregistre le résultat dans accessibility_scans.
//
// Installation : npm install puppeteer @axe-core/puppeteer
//
// Usage :
//   node scripts/accessibility/scan.mjs --domain=exemple.fr \
//     --url=https://exemple.fr/ \
//     --url=https://exemple.fr/contact \
//     --url=https://exemple.fr/panier \
//     [--company="Exemple SARL"] [--siren=123456789] [--effectif="10-19"] [--email=contact@exemple.fr]
//
// Sans --url, scanne uniquement la racine du domaine.

import "dotenv/config"
import puppeteer from "puppeteer"
import { AxePuppeteer } from "@axe-core/puppeteer"
import { createClient } from "@supabase/supabase-js"

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null

const IMPACT_WEIGHTS = { critical: 10, serious: 5, moderate: 2, minor: 1 }

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (prefix) => args.filter(a => a.startsWith(prefix)).map(a => a.slice(prefix.length))
  const one = (prefix) => args.find(a => a.startsWith(prefix))?.slice(prefix.length)
  return {
    domain:   one("--domain="),
    urls:     get("--url="),
    company:  one("--company=") ?? null,
    siren:    one("--siren=") ?? null,
    effectif: one("--effectif=") ?? null,
    email:    one("--email=") ?? null,
  }
}

async function detectAccessibilityStatement(page) {
  // Recherche basique de mots-clés typiques d'une déclaration d'accessibilité
  // dans le corps de page ou les liens. Heuristique, pas une preuve juridique —
  // un faux négatif est possible si la déclaration est sur une page non scannée
  // ou nommée différemment.
  const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase())
  const footerLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a")).map((a) => (a.href + " " + a.textContent).toLowerCase())
  )
  const keywords = ["accessibilité", "accessibilite", "rgaa", "accessibility statement"]
  return keywords.some((kw) => bodyText.includes(kw)) ||
    footerLinks.some((link) => keywords.some((kw) => link.includes(kw)))
}

function computeScore(violations) {
  const totalPenalty = violations.reduce((sum, v) => {
    const weight = IMPACT_WEIGHTS[v.impact] || 1
    return sum + weight * v.nodes.length
  }, 0)
  // Score arbitraire 0-100 — à calibrer avec des données réelles après quelques
  // dizaines de scans, pas une échelle normée RGAA.
  return Math.round(Math.max(0, 100 - totalPenalty))
}

function summarizeViolations(violations) {
  return violations
    .map((v) => ({
      id: v.id, impact: v.impact, description: v.description,
      help: v.help, helpUrl: v.helpUrl, occurrences: v.nodes.length,
    }))
    .sort((a, b) => (IMPACT_WEIGHTS[b.impact] || 0) - (IMPACT_WEIGHTS[a.impact] || 0))
}

async function scanPage(browser, url) {
  const page = await browser.newPage()
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 })
    const hasAccessibilityStatement = await detectAccessibilityStatement(page)
    const results = await new AxePuppeteer(page).analyze()
    const violations = summarizeViolations(results.violations)
    const totalNodes = results.violations.reduce((sum, v) => sum + v.nodes.length, 0)
    return {
      url,
      score: computeScore(results.violations),
      hasAccessibilityStatement,
      totalViolations: results.violations.length,
      totalNodes,
      violations,
      error: null,
    }
  } catch (err) {
    return { url, score: null, hasAccessibilityStatement: false, totalViolations: 0, totalNodes: 0, violations: [], error: err.message }
  } finally {
    await page.close()
  }
}

async function scanSite(urls) {
  // Sandbox Chrome complet activé (nécessite kernel.apparmor_restrict_unprivileged_userns=0
  // sur Ubuntu 23.10+ — voir /etc/sysctl.d/60-chrome-sandbox.conf sur le serveur).
  // Ce scanner visite des sites tiers non fiables : ne jamais désactiver le
  // sandbox via --no-sandbox pour contourner ce prérequis.
  const browser = await puppeteer.launch({ headless: "new" })
  try {
    const pages = []
    for (const url of urls) {
      console.log(`  🔍 ${url}`)
      const result = await scanPage(browser, url)
      pages.push(result)
      console.log(result.error
        ? `     ❌ ${result.error}`
        : `     score=${result.score} violations=${result.totalViolations} déclaration=${result.hasAccessibilityStatement ? "oui" : "non"}`)
    }
    return pages
  } finally {
    await browser.close()
  }
}

function aggregate(pages) {
  const valid = pages.filter(p => !p.error)
  if (valid.length === 0) return { score: null, hasAccessibilityStatement: false, totalViolations: 0, totalNodes: 0 }

  // Score global = moyenne pondérée par nombre de nœuds fautifs (une page très
  // problématique pèse plus qu'une page propre), pas une simple moyenne arithmétique.
  const totalNodes = valid.reduce((sum, p) => sum + p.totalNodes, 0)
  const score = totalNodes === 0
    ? Math.round(valid.reduce((sum, p) => sum + p.score, 0) / valid.length)
    : Math.round(valid.reduce((sum, p) => sum + p.score * Math.max(1, p.totalNodes), 0) / valid.reduce((sum, p) => sum + Math.max(1, p.totalNodes), 0))

  return {
    score,
    // Une déclaration trouvée sur UNE SEULE page scannée suffit (souvent en pied de page,
    // pas la peine qu'elle apparaisse partout).
    hasAccessibilityStatement: valid.some(p => p.hasAccessibilityStatement),
    totalViolations: valid.reduce((sum, p) => sum + p.totalViolations, 0),
    totalNodes,
  }
}

async function saveToSupabase(record) {
  if (!supabase) {
    console.warn("⚠️  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants — résultat affiché mais NON enregistré")
    return null
  }
  const { data, error } = await supabase.from("accessibility_scans").insert(record).select("id").single()
  if (error) { console.error("❌ Échec d'enregistrement Supabase:", error.message); return null }
  return data.id
}

async function run() {
  const { domain, urls, company, siren, effectif, email } = parseArgs()
  if (!domain) {
    console.error('Usage: node scan.mjs --domain=exemple.fr [--url=https://exemple.fr/ --url=... ] [--company=] [--siren=] [--effectif=] [--email=]')
    process.exit(1)
  }
  const targets = urls.length > 0 ? urls : [`https://${domain}/`]

  console.log(`\n🔎 Scan accessibilité — ${company ?? domain} (${targets.length} page${targets.length > 1 ? "s" : ""})\n`)

  const pages = await scanSite(targets)
  const agg = aggregate(pages)

  const record = {
    company_name: company,
    domain,
    siren,
    employee_bracket: effectif,
    contact_email: email,
    score: agg.score,
    has_accessibility_statement: agg.hasAccessibilityStatement,
    declaration_risk_flag: !agg.hasAccessibilityStatement,
    total_violations: agg.totalViolations,
    total_nodes: agg.totalNodes,
    pages,
  }

  console.log(`\n📊 Score global : ${agg.score ?? "N/A"} — ${agg.totalViolations} violations sur ${pages.filter(p => !p.error).length}/${pages.length} pages`)
  console.log(`📄 Déclaration d'accessibilité : ${agg.hasAccessibilityStatement ? "trouvée" : "ABSENTE (risque amende 25 000€ — RGAA décret 2019-768 art.8)"}`)

  const id = await saveToSupabase(record)
  if (id) console.log(`💾 Enregistré — accessibility_scans.id = ${id}`)

  console.log("\n" + JSON.stringify(record, null, 2))
}

run().catch(e => { console.error("❌", e.message); process.exit(1) })
