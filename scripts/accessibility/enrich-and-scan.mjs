// enrich-and-scan.mjs — Pont entre find-targets-sirene.mjs (données officielles,
// sans site web) et scan.mjs (scan accessibilité, a besoin d'un domaine).
//
// Pour chaque établissement d'un fichier sirene_targets_*.csv : cherche son site
// web via DuckDuckGo (même logique que scrape_sirene.mjs), puis lance scan.mjs
// sur l'accueil + /contact + /mentions-legales de ce site.
//
// Usage :
//   node scripts/accessibility/enrich-and-scan.mjs scripts/accessibility/sirene_targets_47.71Z_75_2026-07-13.csv [--limit=20]

import "dotenv/config"
import { chromium } from "playwright"
import { execFileSync } from "child_process"
import { readFileSync, existsSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const sleep = ms => new Promise(r => setTimeout(r, ms))

const SKIP_DOMAINS = /pagesjaunes\.fr|facebook\.com|instagram\.com|wikipedia\.|linkedin\.com|youtube\.com|google\.|bing\.|duckduckgo\.|societe\.com|kompass\.|infogreffe\.|pappers\.|legifrance\.|service-public\.|gouv\.fr/

function parseCSV(file) {
  const content = readFileSync(file, "utf-8").replace(/^﻿/, "").trim()
  const lines = content.split("\n")
  const headers = lines[0].match(/"([^"]*)"/g).map(v => v.slice(1, -1))
  return lines.slice(1).map(line => {
    const cols = line.match(/"([^"]*)"/g)?.map(v => v.slice(1, -1)) ?? []
    return Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? ""]))
  })
}

async function findWebsite(page, denomination, commune) {
  const q = encodeURIComponent(`${denomination} ${commune} site officiel`)
  try {
    await page.goto(`https://lite.duckduckgo.com/lite/?q=${q}&kl=fr-fr`, { waitUntil: "domcontentloaded", timeout: 15000 })
    await sleep(1000)
    const links = await page.evaluate((skipRe) => {
      return Array.from(document.querySelectorAll('a[href^="http"]'))
        .map(a => a.href)
        .filter(href => !new RegExp(skipRe).test(href) && !href.includes("duckduckgo"))
    }, SKIP_DOMAINS.source)
    return links[0] ? new URL(links[0]).origin : null
  } catch { return null }
}

async function run() {
  const file = process.argv[2]
  const limit = parseInt(process.argv.find(a => a.startsWith("--limit="))?.split("=")[1] ?? "20", 10)
  if (!file || !existsSync(file)) {
    console.error("Usage: node enrich-and-scan.mjs <sirene_targets_*.csv> [--limit=20]")
    process.exit(1)
  }

  const rows = parseCSV(file).slice(0, limit)
  console.log(`\n🔗 Enrichissement + scan — ${rows.length} établissements\n`)

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newContext({ locale: "fr-FR" }).then(ctx => ctx.newPage())

  let scanned = 0
  try {
    for (const row of rows) {
      console.log(`🏢 ${row.Denomination} (${row.Commune})`)
      const website = await findWebsite(page, row.Denomination, row.Commune)
      if (!website) { console.log("   — pas de site trouvé, ignoré"); await sleep(1500); continue }

      const domain = new URL(website).hostname
      console.log(`   🌐 ${website}`)

      try {
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
        scanned++
      } catch (err) {
        console.error(`   ❌ scan échoué : ${err.message}`)
      }
      await sleep(1500)
    }
  } finally {
    await browser.close()
  }

  console.log(`\n✅ ${scanned}/${rows.length} sites scannés et enregistrés.`)
}

run().catch(e => { console.error("❌", e.message); process.exit(1) })
