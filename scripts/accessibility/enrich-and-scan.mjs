// enrich-and-scan.mjs — Pont entre find-targets-sirene.mjs (données officielles,
// sans site web) et scan.mjs (scan accessibilité, a besoin d'un domaine).
//
// Pour chaque établissement d'un fichier sirene_targets_*.csv : cherche son site
// web via l'API Google Places (textsearch + details, même pattern que
// lib/keywordPositioning.ts et app/api/analyse-public/route.ts), puis vérifie
// la présence d'un vrai tunnel d'achat (panier/commander/checkout ou
// plateforme e-commerce connue) — un effectif ≥10 salariés ne suffit pas à
// garantir un périmètre EAA réel (qui dépend du service B2C rendu, pas de
// l'effectif seul).
//
// Remplace l'ancienne découverte via DuckDuckGo/Bing scrapé (Playwright) :
// testée en direct le 2026-07-13, en local ET depuis OVH, elle échouait
// systématiquement (0/30 sites trouvés sur des sociétés pourtant connues —
// DuckDuckGo renvoie un statut 202 anti-bot, Bing un captcha). Google Places
// API est un appel HTTP direct avec clé, pas de navigateur ni de risque de
// blocage anti-scraping de moteur de recherche.
//
// Par défaut, ce script s'arrête après la détection (mode "dry run") : il ne
// scanne PAS l'accessibilité, il ne fait que discovery + classification, pour
// permettre une revue manuelle avant de lancer les scans axe-core (coûteux en
// temps). Passer --scan pour enchaîner automatiquement sur scan.mjs pour les
// cibles "confirmé" uniquement (les "incertain" sont exclues du scan auto,
// à vérifier manuellement).
//
// Usage :
//   node scripts/accessibility/enrich-and-scan.mjs <sirene_targets_*.csv> [--limit=20] [--scan]

import "dotenv/config"
import { chromium } from "playwright"
import { execFileSync } from "child_process"
import { readFileSync, writeFileSync, existsSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const sleep = ms => new Promise(r => setTimeout(r, ms))
const TODAY = new Date().toISOString().slice(0, 10)

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY

// Indices textuels d'un vrai tunnel d'achat (pas juste un site vitrine)
const ECOMMERCE_TEXT_HINTS = /\b(panier|cart|commander|passer commande|checkout|ajouter au panier|mon compte|réserver|réservation|booking)\b/i
// Signatures de plateformes e-commerce connues dans le HTML/headers
const ECOMMERCE_PLATFORM_HINTS = /shopify|prestashop|woocommerce|magento|cdn\.shopify|wp-content\/plugins\/woocommerce/i

function parseCSV(file) {
  const content = readFileSync(file, "utf-8").replace(/^﻿/, "").trim()
  const lines = content.split("\n")
  const headers = lines[0].match(/"([^"]*)"/g).map(v => v.slice(1, -1))
  return lines.slice(1).map(line => {
    const cols = line.match(/"([^"]*)"/g)?.map(v => v.slice(1, -1)) ?? []
    return Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? ""]))
  })
}

// Découverte de site via Google Places (textsearch → place_id → details avec
// fields=website). Le textsearch seul ne renvoie pas toujours le site web de
// façon fiable, d'où l'appel details séparé — même pattern déjà vérifié dans
// app/api/analyse-public/route.ts.
async function findWebsite(denomination, commune) {
  if (!GOOGLE_API_KEY) throw new Error("GOOGLE_PLACES_API_KEY manquant dans .env")
  try {
    const q = encodeURIComponent(`${denomination} ${commune}`)
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&language=fr&region=fr&key=${GOOGLE_API_KEY}`
    const searchRes = await fetch(searchUrl).then(r => r.json())
    const place = (searchRes.results ?? [])[0]
    if (!place?.place_id) return null

    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website&language=fr&key=${GOOGLE_API_KEY}`
    const detailsRes = await fetch(detailsUrl).then(r => r.json())
    const website = detailsRes.result?.website
    return website ? new URL(website).origin : null
  } catch { return null }
}

// Vérifie la présence d'un vrai tunnel d'achat sur la page d'accueil. Heuristique
// best-effort : un faux négatif est possible (site marchand mal détecté) — d'où
// le statut "incertain" plutôt qu'une exclusion silencieuse en cas de doute.
async function detectEcommerce(page, website) {
  try {
    await page.goto(website, { waitUntil: "domcontentloaded", timeout: 15000 })
    const html = await page.content()
    const bodyText = await page.evaluate(() => document.body.innerText).catch(() => "")
    if (ECOMMERCE_PLATFORM_HINTS.test(html)) return { status: "confirmé", reason: "plateforme e-commerce détectée" }
    if (ECOMMERCE_TEXT_HINTS.test(bodyText) || ECOMMERCE_TEXT_HINTS.test(html)) return { status: "confirmé", reason: "tunnel d'achat détecté (texte/lien)" }
    return { status: "incertain", reason: "aucun indice trouvé sur la page d'accueil" }
  } catch (err) {
    return { status: "incertain", reason: `erreur de détection : ${err.message}` }
  }
}

function scanOne(row, website) {
  const domain = new URL(website).hostname
  execFileSync("node", [
    join(__dirname, "scan.mjs"),
    `--domain=${domain}`,
    `--url=${website}/`,
    `--url=${website}/contact`,
    `--url=${website}/mentions-legales`,
    `--company=${row.Denomination}`,
    `--siren=${row.Siren}`,
    `--effectif=${row.TrancheEffectif}`,
  ], { cwd: join(__dirname, "../.."), stdio: "inherit", timeout: 180_000 })
}

async function run() {
  const startedAt = Date.now()
  const file = process.argv[2]
  const limit = parseInt(process.argv.find(a => a.startsWith("--limit="))?.split("=")[1] ?? "20", 10)
  const doScan = process.argv.includes("--scan")
  if (!file || !existsSync(file)) {
    console.error("Usage: node enrich-and-scan.mjs <sirene_targets_*.csv> [--limit=20] [--scan]")
    process.exit(1)
  }

  const rows = parseCSV(file).slice(0, limit)
  console.log(`\n🔗 Enrichissement — ${rows.length} établissements${doScan ? " (scan activé pour les cibles confirmées)" : " (détection seule, pas de scan — passer --scan pour enchaîner)"}\n`)

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newContext({ locale: "fr-FR" }).then(ctx => ctx.newPage())

  const results = []
  let scanned = 0

  try {
    for (const row of rows) {
      console.log(`🏢 ${row.Denomination} (${row.Commune})`)
      const website = await findWebsite(row.Denomination, row.Commune)
      if (!website) {
        console.log("   — pas de site trouvé, ignoré")
        results.push({ ...row, Site: "", StatutMarchand: "site_introuvable" })
        await sleep(300)
        continue
      }
      console.log(`   🌐 ${website}`)

      const { status, reason } = await detectEcommerce(page, website)
      console.log(`   ${status === "confirmé" ? "✅" : "⚠️ "} ${status} — ${reason}`)
      results.push({ ...row, Site: website, StatutMarchand: status, Raison: reason })

      if (doScan && status === "confirmé") {
        try {
          scanOne(row, website)
          scanned++
        } catch (err) {
          console.error(`   ❌ scan échoué : ${err.message}`)
        }
      }
      await sleep(1500)
    }
  } finally {
    await browser.close()
  }

  const confirmed = results.filter(r => r.StatutMarchand === "confirmé").length
  const uncertain = results.filter(r => r.StatutMarchand === "incertain").length
  const notFound  = results.filter(r => r.StatutMarchand === "site_introuvable").length
  const elapsedS  = ((Date.now() - startedAt) / 1000).toFixed(1)

  console.log(`\n📊 Résumé —  ${results.length} cible(s) traitée(s)`)
  console.log(`   ✅ site marchand confirmé : ${confirmed}`)
  console.log(`   ⚠️  incertain (à vérifier manuellement) : ${uncertain}`)
  console.log(`   — site introuvable : ${notFound}`)
  if (doScan) console.log(`   🔎 scannés (accessibilité) : ${scanned}`)
  console.log(`   ⏱  temps total : ${elapsedS}s\n`)

  const outFile = file.replace(/\.csv$/, `_enrichi_${TODAY}.csv`)
  const cols = ["Siren", "Denomination", "CodePostal", "Commune", "TrancheEffectif", "NAF", "CategorieEntreprise", "Site", "StatutMarchand", "Raison"]
  const csv = [
    cols.map(c => `"${c}"`).join(","),
    ...results.map(r => cols.map(c => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n")
  writeFileSync(outFile, "﻿" + csv, "utf-8")
  console.log(`💾 ${outFile}`)
  if (!doScan) console.log(`\nRevue manuelle recommandée, puis : node enrich-and-scan.mjs ${file} --limit=${limit} --scan`)
}

run().catch(e => { console.error("❌", e.message); process.exit(1) })
