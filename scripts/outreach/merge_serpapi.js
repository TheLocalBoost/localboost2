// merge_serpapi.js — fusionne tous les serpapi_*.csv, enrichit avec secteur/score/appels_perdus
// Valide les emails via MX check (gratuit) + optionnellement ZeroBounce
// Usage : node scripts/outreach/merge_serpapi.js [--validate]
// Output : scripts/outreach/leads_ready.csv

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs"
import { join, dirname, basename } from "path"
import { fileURLToPath } from "url"
import dns from "dns/promises"

const __dirname   = dirname(fileURLToPath(import.meta.url))
const USE_ZEROBOUNCE = process.env.ZEROBOUNCE_API_KEY && process.argv.includes("--validate")
const sleep = ms => new Promise(r => setTimeout(r, ms))

// Cache MX par domaine — évite de requêter le même domaine plusieurs fois
const mxCache = new Map()

async function hasMX(email) {
  const domain = email.split("@")[1]?.toLowerCase()
  if (!domain) return false
  if (mxCache.has(domain)) return mxCache.get(domain)
  try {
    const records = await dns.resolveMx(domain)
    const ok = records.length > 0
    mxCache.set(domain, ok)
    return ok
  } catch {
    mxCache.set(domain, false)
    return false
  }
}

async function zeroBounceCheck(email) {
  if (!USE_ZEROBOUNCE) return true
  try {
    const key = process.env.ZEROBOUNCE_API_KEY
    const r   = await fetch(`https://api.zerobounce.net/v2/validate?api_key=${key}&email=${encodeURIComponent(email)}`)
    const d   = await r.json()
    // "valid" ou "catch-all" = on envoie, tout le reste = on rejette
    return d.status === "valid" || d.status === "catch-all"
  } catch { return true }
}

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

// Mots de secteur — un nom composé uniquement de ces mots + ville = faux
const SECTOR_WORDS = new Set([
  'coiffeur','coiffure','coiffeuse','barbier','barbershop','barber',
  'plombier','plomberie','electricien','électricien','electricite','électricité',
  'serrurier','serrurerie','garagiste','garage','mecanique','mécanique',
  'boulanger','boulangerie','patisserie','pâtisserie','restaurant','restaurateur',
  'fleuriste','fleurs','opticien','optique','pharmacie','pharmacien',
  'peintre','peinture','carreleur','carrelage','artisan',
])

// Grandes villes françaises — rejet si le nom se termine par une ville
const VILLES_FR = new Set([
  'paris','lyon','marseille','toulouse','bordeaux','lille','nice','rennes',
  'strasbourg','montpellier','grenoble','nantes','rouen','perpignan','toulon',
  'metz','caen','brest','dijon','angers','tours','pau','limoges',
])

function isRealBusinessName(nom) {
  if (!nom || nom.length < 4) return false
  const words = nom.trim().split(/\s+/)

  // 1 — Un seul mot = catégorie seule
  if (words.length < 2) return false

  // 2 — Trop long = snippet scrappé
  if (words.length > 5) return false

  // 3 — Tout en majuscules sur plus de 2 mots = post scrappé
  if (words.length > 2 && nom === nom.toUpperCase()) return false

  // 4 — Contient des chiffres = adresse ou code
  if (/\d/.test(nom)) return false

  // 5 — Se termine par une ville connue
  const lastWord = words[words.length - 1].toLowerCase().replace(/[^a-z]/g, '')
  if (VILLES_FR.has(lastWord)) return false

  // 6 — Tous les mots significatifs sont des mots de secteur ou générique
  const significantWords = words.filter(w => w.length > 2)
  const nonSectorWords = significantWords.filter(w => {
    const wl = w.toLowerCase().replace(/[^a-zàâéèêëîïôùûüç]/g, '')
    return !SECTOR_WORDS.has(wl) && !VILLES_FR.has(wl)
      && !['les','des','une','pour','sur','par','dans','avec','chez','la','le','au','aux','et','de','du','à'].includes(wl)
  })
  if (nonSectorWords.length === 0) return false

  // 7 — Au moins un mot commence par une majuscule (nom propre)
  const hasProperNoun = words.some(w => w.length > 1 && w[0] === w[0].toUpperCase() && w[0] !== w[0].toLowerCase())
  if (!hasProperNoun) return false

  return true
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
let dupes = 0, excluded = 0, mxFailed = 0, zbFailed = 0

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
    const nomBrut = row.Nom ?? row.nom ?? ""
    if (!isRealBusinessName(nomBrut)) continue

    // Niveau 1 — MX check gratuit
    const mx = await hasMX(email)
    if (!mx) { mxFailed++; continue }

    // Niveau 2 — ZeroBounce (optionnel, si ZEROBOUNCE_API_KEY dans .env + --validate)
    if (USE_ZEROBOUNCE) {
      const zb = await zeroBounceCheck(email)
      if (!zb) { zbFailed++; continue }
      await sleep(100)
    }

    seen.add(email)
    leads.push({
      Nom:          nomBrut,
      Email:        email,
      Ville:        row.Ville ?? row.ville ?? "",
      Secteur:      secteur,
      Score:        score,
      AppelsPerdus: appelsPerdus,
    })
  }
}

console.log(`✅ ${leads.length} leads uniques`)
console.log(`   ${dupes} doublons supprimés`)
console.log(`   ${excluded} déjà envoyés/bounced exclus`)
console.log(`   ${mxFailed} rejetés MX invalide`)
if (USE_ZEROBOUNCE) console.log(`   ${zbFailed} rejetés ZeroBounce`)
console.log()

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
