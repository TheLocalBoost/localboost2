// monitor.js — cron trigger : surveille les fiches Google de la base leads envoyés
// Détecte : avis négatif récent, fiche inactive 90j, note < 4.0
// Usage : node scripts/outreach/monitor.js
// Idéalement via cron chaque nuit : 0 3 * * * node /path/to/monitor.js

import "dotenv/config"
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname    = dirname(fileURLToPath(import.meta.url))
const GOOGLE_KEY   = process.env.GOOGLE_PLACES_API_KEY
const LOG_FILE     = join(__dirname, "monitor.log")
const OUT_FILE     = join(__dirname, "trigger_leads.csv")
const STATE_FILE   = join(__dirname, "monitor_state.json")
const SENT_FILE    = join(__dirname, "sent.csv")
const LEADS_FILE   = existsSync(join(__dirname, "leads_ready.csv"))
  ? join(__dirname, "leads_ready.csv")
  : join(__dirname, "leads_clean2.csv")

const sleep = ms => new Promise(r => setTimeout(r, ms))

function log(msg) {
  const line = `[${new Date().toISOString().slice(0, 19)}] ${msg}`
  console.log(line)
  appendFileSync(LOG_FILE, line + "\n", "utf-8")
}

function parseCSV(file) {
  const content = readFileSync(file, "utf-8").replace(/^﻿/, "").trim()
  const lines   = content.split("\n")
  const headers = lines[0].match(/"([^"]*)"/g)?.map(v => v.slice(1, -1))
    ?? lines[0].split(",")
  return lines.slice(1).map(line => {
    const vals = line.match(/"([^"]*)"/g)?.map(v => v.slice(1, -1)) ?? line.split(",")
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]))
  }).filter(r => r.Email || r.email)
}

function loadState() {
  if (!existsSync(STATE_FILE)) return {}
  return JSON.parse(readFileSync(STATE_FILE, "utf-8"))
}

function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8")
}

async function fetchPlace(nom, ville) {
  const q   = `${nom} ${ville}`
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&language=fr&region=fr&key=${GOOGLE_KEY}`
  const res = await fetch(url)
  const d   = await res.json()
  return d.results?.[0] ?? null
}

async function fetchDetails(placeId) {
  const fields = "name,rating,user_ratings_total,reviews,opening_hours,business_status"
  const url    = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=fr&key=${GOOGLE_KEY}`
  const res    = await fetch(url)
  const d      = await res.json()
  return d.result ?? {}
}

async function checkLead(lead) {
  const nom   = lead.Nom   || lead.nom   || ""
  const ville = lead.Ville || lead.ville || ""
  if (!nom || !ville) return null

  const place = await fetchPlace(nom, ville)
  if (!place) return null

  const p        = await fetchDetails(place.place_id)
  const triggers = []
  const now      = Date.now() / 1000
  const week     = 7  * 86400
  const days90   = 90 * 86400

  // Trigger 1 — avis négatif dans les 7 derniers jours
  const recentNeg = (p.reviews ?? []).filter(r => r.rating < 4 && r.time > now - week)
  if (recentNeg.length > 0) {
    triggers.push({
      type:   "avis_negatif",
      detail: `${recentNeg.length} avis <4★ cette semaine (dernier: ${recentNeg[0].rating}★)`,
    })
  }

  // Trigger 2 — fiche inactive > 90 jours (aucun avis récent)
  const hasRecent = (p.reviews ?? []).some(r => r.time > now - days90)
  if (!hasRecent && (p.user_ratings_total ?? 0) > 0) {
    triggers.push({
      type:   "inactive_90j",
      detail: "aucun avis depuis 90+ jours — fiche considérée inactive par Google",
    })
  }

  // Trigger 3 — note < 4.0
  if (p.rating && p.rating < 4.0 && p.rating > 0) {
    triggers.push({
      type:   "note_faible",
      detail: `note actuelle ${p.rating}/5 — en dessous du seuil de confiance client`,
    })
  }

  // Trigger 4 — fiche marquée fermée
  if (p.business_status === "CLOSED_PERMANENTLY" || p.business_status === "CLOSED_TEMPORARILY") {
    triggers.push({
      type:   "fiche_fermee",
      detail: `fiche Google affiche l'établissement comme ${p.business_status === "CLOSED_PERMANENTLY" ? "définitivement" : "temporairement"} fermé`,
    })
  }

  return triggers.length > 0 ? { lead, triggers, placeId: place.place_id } : null
}

async function run() {
  if (!GOOGLE_KEY) { console.error("❌ GOOGLE_PLACES_API_KEY manquante dans .env"); process.exit(1) }
  if (!existsSync(LEADS_FILE)) { console.error(`❌ ${LEADS_FILE} introuvable`); process.exit(1) }

  log("🔍 MONITOR — démarrage surveillance des fiches")

  const state  = loadState()
  const leads  = parseCSV(LEADS_FILE)
  const sent   = existsSync(SENT_FILE)
    ? new Set(readFileSync(SENT_FILE, "utf-8").trim().split("\n").map(e => e.toLowerCase()).filter(Boolean))
    : new Set()

  // Filtrer : uniquement les leads déjà envoyés + pas vérifiés depuis 7 jours
  const toCheck = leads.filter(l => {
    const email = (l.Email ?? l.email ?? "").toLowerCase()
    if (!sent.has(email)) return false
    const lastCheck = state[email]?.lastCheck ?? 0
    return Date.now() - lastCheck > 7 * 24 * 3600 * 1000
  })

  log(`   ${toCheck.length} leads à vérifier (envoyés + non vérifiés depuis 7j)`)

  const triggered = []
  let checked = 0

  for (const lead of toCheck) {
    const email = (lead.Email ?? lead.email ?? "").toLowerCase()
    try {
      const result = await checkLead(lead)
      checked++
      state[email] = { lastCheck: Date.now() }

      if (result) {
        triggered.push(result)
        const types = result.triggers.map(t => t.type).join(", ")
        log(`  🎯 ${lead.Nom} (${lead.Ville}) — ${types}`)
      }

      if (checked % 50 === 0) {
        saveState(state)
        log(`   ${checked}/${toCheck.length} vérifiés — ${triggered.length} triggers détectés`)
      }

      await sleep(200) // respecter quota Google Places API
    } catch (e) {
      log(`   ⚠️  ${email} : ${e.message}`)
    }
  }

  saveState(state)

  // Écrire les triggers dans trigger_leads.csv
  if (triggered.length > 0) {
    const rows = triggered.flatMap(({ lead, triggers }) =>
      triggers.map(t => ({
        Nom:     lead.Nom   ?? lead.nom   ?? "",
        Email:   lead.Email ?? lead.email ?? "",
        Ville:   lead.Ville ?? lead.ville ?? "",
        Secteur: lead.Secteur ?? "",
        Trigger: t.type,
        Detail:  t.detail,
      }))
    )
    const csv = [
      '"Nom","Email","Ville","Secteur","Trigger","Detail"',
      ...rows.map(r =>
        [r.Nom, r.Email, r.Ville, r.Secteur, r.Trigger, r.Detail]
          .map(v => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n")
    writeFileSync(OUT_FILE, "﻿" + csv, "utf-8")
    log(`\n📄 ${triggered.length} leads avec triggers → ${OUT_FILE}`)
  }

  log(`\n✅ TERMINÉ — ${checked} vérifiés · ${triggered.length} triggers détectés`)
}

run().catch(e => { console.error("❌", e.message); process.exit(1) })
