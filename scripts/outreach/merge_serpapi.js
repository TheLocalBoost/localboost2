// merge_serpapi.js — fusionne tous les serpapi_*.csv, enrichit avec secteur/score/appels_perdus
// Usage : node scripts/outreach/merge_serpapi.js
// Output : scripts/outreach/leads_ready.csv

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs"
import { join, dirname, basename } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Scores moyens réels par secteur (base observations LocalBoost)
const SCORE_MOYEN = {
  coiffeur: 41, barbier: 38, plombier: 34, garagiste: 45,
  restaurant: 52, boulanger: 48, fleuriste: 39, serrurier: 31,
  electricien: 36, pharmacie: 67, opticien: 58, peintre: 29, carreleur: 27,
}

// Appels perdus estimés par secteur (secteurs à forte urgence = plus d'appels manqués)
const APPELS_PERDUS = {
  coiffeur: 6, barbier: 5, plombier: 11, garagiste: 8,
  restaurant: 14, boulanger: 9, fleuriste: 5, serrurier: 12,
  electricien: 10, pharmacie: 4, opticien: 3, peintre: 7, carreleur: 6,
}

function parseCSV(file) {
  const content = readFileSync(file, "utf-8").replace(/^﻿/, "").trim()
  const lines   = content.split("\n")
  if (lines.length < 2) return []
  const headers = lines[0].match(/"([^"]*)"/g)?.map(v => v.slice(1, -1))
    ?? lines[0].split(",")
  return lines.slice(1).map(line => {
    const vals = line.match(/"([^"]*)"/g)?.map(v => v.slice(1, -1))
      ?? line.split(",")
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]))
  }).filter(r => r.Email || r.email)
}

function loadSet(file) {
  if (!existsSync(file)) return new Set()
  return new Set(
    readFileSync(file, "utf-8").trim().split("\n")
      .map(e => e.toLowerCase().trim()).filter(Boolean)
  )
}

// serpapi_coiffeur_Lyon_2026-06-06.csv → "coiffeur"
function secteurFromFilename(filename) {
  const m = basename(filename).match(/^serpapi_([^_]+)_/)
  return m ? m[1].toLowerCase() : "commerce"
}

const sentSet    = loadSet(join(__dirname, "sent.csv"))
const bouncedSet = loadSet(join(__dirname, "bounced.csv"))

const files = readdirSync(__dirname).filter(f => /^serpapi_.+\.csv$/.test(f))
console.log(`📂 ${files.length} fichiers serpapi détectés\n`)

const seen  = new Set()
const leads = []
let dupes = 0, excluded = 0

for (const file of files) {
  const secteur      = secteurFromFilename(file)
  const score        = SCORE_MOYEN[secteur] ?? 35
  const appelsPerdus = APPELS_PERDUS[secteur] ?? 7

  const rows = parseCSV(join(__dirname, file))
  for (const row of rows) {
    const email = (row.Email ?? row.email ?? "").trim().toLowerCase()
    if (!email) continue
    if (sentSet.has(email) || bouncedSet.has(email)) { excluded++; continue }
    if (seen.has(email)) { dupes++; continue }
    seen.add(email)
    leads.push({
      Nom:          row.Nom ?? row.nom ?? "",
      Email:        email,
      Ville:        row.Ville ?? row.ville ?? "",
      Secteur:      secteur,
      Score:        score,
      AppelsPerdus: appelsPerdus,
    })
  }
}

console.log(`✅ ${leads.length} leads uniques`)
console.log(`   ${dupes} doublons inter-fichiers supprimés`)
console.log(`   ${excluded} déjà envoyés ou bounced exclus\n`)

const csv = [
  '"Nom","Email","Ville","Secteur","Score","AppelsPerdus"',
  ...leads.map(r =>
    [r.Nom, r.Email, r.Ville, r.Secteur, r.Score, r.AppelsPerdus]
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  ),
].join("\n")

const outFile = join(__dirname, "leads_ready.csv")
writeFileSync(outFile, "﻿" + csv, "utf-8")
console.log(`📄 ${outFile}`)
