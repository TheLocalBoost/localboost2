// find-targets-sirene.mjs — Recherche de cibles via l'API officielle INSEE Sirene,
// filtrées par tranche d'effectif salarié (contrairement à scrape_sirene.mjs qui,
// malgré son nom, ne fait que du scraping DuckDuckGo/Bing sans aucune donnée
// d'effectif — vérifié en lisant son code).
//
// Nécessite un compte gratuit sur https://portail-api.insee.fr et une
// application avec accès à l'API "Sirene". Authentification et endpoint
// VÉRIFIÉS EN DIRECT le 2026-07-13 avec de vraies credentials (pas une
// supposition) : header X-INSEE-Api-Key-Integration = Client ID de
// l'application (le Client Secret n'a pas été nécessaire pour cet appel),
// endpoint https://api.insee.fr/api-sirene/3.11/siret.
//
// Ciblage légal : "10+ salariés" seul ne suffit pas à garantir un vrai
// périmètre EAA (qui dépend du type de service B2C rendu, pas juste de
// l'effectif) — voir enrich-and-scan.mjs pour la vérification de présence
// d'un vrai tunnel d'achat. Les codes NAF "vente à distance" (47.91A/B)
// garantissent au moins une activité de vente en ligne par construction.
//
// Usage :
//   node scripts/accessibility/find-targets-sirene.mjs --naf=47.91A,47.91B --departement=75 [--effectifMin=11] [--pages=5] [--limit=30]
//
// Élargissement automatique : si moins de 20 résultats sont trouvés sur le
// département demandé (après filtre effectif), élargit automatiquement à
// [75, 92, 93, 94] et fusionne (dédoublonné par SIREN) — désactivable avec
// --no-widen.
//
// Codes tranche d'effectif INSEE (trancheEffectifsUniteLegale) :
//   00=0 01=1-2 02=3-5 03=6-9 11=10-19 12=20-49 21=50-99 22=100-199
//   31=200-249 32=250-499 41=500-999 42=1000-1999 51=2000-4999 52=5000-9999 53=10000+
// --effectifMin=11 (défaut) = 10 salariés ou plus.
//
// Sortie : sirene_targets_{naf}_{departement}_{date}.csv (SIREN, dénomination,
// commune, code postal, tranche effectif, NAF) — SANS site web ni email :
// l'API Sirene ne les fournit pas. Voir enrich-and-scan.mjs pour la suite.

import "dotenv/config"
import { writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const TODAY = new Date().toISOString().slice(0, 10)

const INSEE_CLIENT_ID = process.env.INSEE_SIRENE_CLIENT_ID
const BASE_URL = "https://api.insee.fr/api-sirene/3.11/siret"

const WIDEN_DEPARTEMENTS = ["75", "92", "93", "94"]
const WIDEN_THRESHOLD = 20

// Tranches correspondant à "10 salariés ou plus" (>= code 11)
const TRANCHES_10_PLUS = ["11", "12", "21", "22", "31", "32", "41", "42", "51", "52", "53"]

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (prefix) => args.find(a => a.startsWith(prefix))?.slice(prefix.length)
  const naf = get("--naf=")
  return {
    naf:          naf ? naf.split(",").map(s => s.trim()).filter(Boolean) : [],
    departement:  get("--departement="),
    effectifMin:  get("--effectifMin=") ?? "11",
    pages:        parseInt(get("--pages=") ?? "5", 10),
    limit:        parseInt(get("--limit=") ?? "30", 10),
    noWiden:      args.includes("--no-widen"),
  }
}

function buildEffectifClause(effectifMin) {
  const idx = TRANCHES_10_PLUS.indexOf(effectifMin)
  const tranches = idx >= 0 ? TRANCHES_10_PLUS.slice(idx) : TRANCHES_10_PLUS
  return `(${tranches.map(t => `trancheEffectifsUniteLegale:${t}`).join(" OR ")})`
}

function buildNafClause(nafCodes) {
  if (!nafCodes.length) return null
  return `(${nafCodes.map(n => `activitePrincipaleUniteLegale:${n}`).join(" OR ")})`
}

async function querySirene({ nafClause, departement, effectifMin, page, pageSize = 20 }) {
  if (!INSEE_CLIENT_ID) {
    throw new Error("INSEE_SIRENE_CLIENT_ID manquant dans .env — voir https://portail-api.insee.fr pour créer une application")
  }

  const clauses = []
  if (nafClause) clauses.push(nafClause)
  if (departement) clauses.push(`codePostalEtablissement:${departement}*`)
  clauses.push(buildEffectifClause(effectifMin))
  // Deux filtres de statut distincts et nécessaires : l'unité légale (la société)
  // ET l'établissement précis (ce magasin/site) peuvent être actifs
  // indépendamment l'un de l'autre — une société active peut avoir fermé cet
  // établissement précis. Vérifié en test réel (2026-07-13) : un résultat avait
  // etatAdministratifUniteLegale=A mais l'établissement lui-même fermé.
  clauses.push("etatAdministratifUniteLegale:A")
  // Champ historisé (par période) — nécessite la syntaxe periode(...), sinon 400
  // "Erreur de syntaxe dans le paramètre q" (vérifié en test réel 2026-07-13).
  clauses.push("periode(etatAdministratifEtablissement:A)")

  const q = clauses.join(" AND ")
  const url = `${BASE_URL}?q=${encodeURIComponent(q)}&nombre=${pageSize}&debut=${page * pageSize}`

  const res = await fetch(url, {
    headers: {
      "X-INSEE-Api-Key-Integration": INSEE_CLIENT_ID,
      "Accept": "application/json",
    },
  })
  if (!res.ok) {
    throw new Error(`INSEE API ${res.status} — ${await res.text().catch(() => "")}`)
  }
  return res.json()
}

function extractRows(data) {
  return (data.etablissements ?? []).map(e => {
    const ul = e.uniteLegale ?? {}
    const adr = e.adresseEtablissement ?? {}
    const denomination = ul.denominationUniteLegale
      ?? [ul.prenom1UniteLegale, ul.nomUniteLegale].filter(Boolean).join(" ")
      ?? ""
    return {
      Siren:        e.siren ?? "",
      Denomination: denomination,
      CodePostal:   adr.codePostalEtablissement ?? "",
      Commune:      adr.libelleCommuneEtablissement ?? "",
      TrancheEffectif: ul.trancheEffectifsUniteLegale ?? "",
      NAF:          ul.activitePrincipaleUniteLegale ?? "",
      CategorieEntreprise: ul.categorieEntreprise ?? "",
    }
  }).filter(r => r.Denomination && r.Siren)
}

function dedupeBySiren(rows) {
  const seen = new Set()
  return rows.filter(r => {
    if (seen.has(r.Siren)) return false
    seen.add(r.Siren)
    return true
  })
}

async function fetchAll({ nafClause, departement, effectifMin, pages }) {
  const rows = []
  for (let page = 0; page < pages; page++) {
    console.log(`  📄 Page ${page + 1}/${pages} (dépt ${departement ?? "tous"})`)
    try {
      const data = await querySirene({ nafClause, departement, effectifMin, page })
      const pageRows = extractRows(data)
      console.log(`     → ${pageRows.length} établissements`)
      rows.push(...pageRows)
      if (pageRows.length === 0) break
    } catch (err) {
      console.error(`  ❌ ${err.message}`)
      break
    }
  }
  return rows
}

async function run() {
  const startedAt = Date.now()
  const { naf, departement, effectifMin, pages, limit, noWiden } = parseArgs()
  if (!naf.length && !departement) {
    console.error("Usage: node find-targets-sirene.mjs --naf=47.91A,47.91B --departement=75 [--effectifMin=11] [--pages=5] [--limit=30]")
    process.exit(1)
  }

  const nafClause = buildNafClause(naf)
  console.log(`\n🔍 Recherche Sirene — NAF=${naf.join(",") || "tous"} · dépt=${departement ?? "tous"} · effectif ≥ tranche ${effectifMin} · limite=${limit}\n`)

  let rows = dedupeBySiren(await fetchAll({ nafClause, departement, effectifMin, pages }))
  let departementsUsed = [departement].filter(Boolean)

  // Élargissement automatique si trop peu de résultats UNIQUES sur le département
  // demandé — le seuil doit être vérifié APRÈS dédoublonnage, sinon des pages
  // pleines de doublons masquent un pool réellement restreint (bug rencontré en
  // test réel : 100 lignes brutes sur 5 pages, seulement 18 SIREN uniques).
  if (!noWiden && rows.length < WIDEN_THRESHOLD && departement) {
    const others = WIDEN_DEPARTEMENTS.filter(d => d !== departement)
    if (others.length) {
      console.log(`\n⚠️  Seulement ${rows.length} résultat(s) unique(s) sur ${departement} (< ${WIDEN_THRESHOLD}) — élargissement à ${others.join(", ")}\n`)
      for (const d of others) {
        const more = await fetchAll({ nafClause, departement: d, effectifMin, pages })
        rows = dedupeBySiren([...rows, ...more])
        departementsUsed.push(d)
        if (rows.length >= WIDEN_THRESHOLD) break
      }
    }
  }

  const totalFound = rows.length
  rows = rows.slice(0, limit)

  const elapsedS = ((Date.now() - startedAt) / 1000).toFixed(1)
  console.log(`\n📊 ${totalFound} établissement(s) unique(s) trouvé(s) (≥ tranche ${effectifMin}) sur [${departementsUsed.join(", ")}]`)
  console.log(`   → ${rows.length} conservé(s) après limite --limit=${limit}`)
  console.log(`   ⏱  ${elapsedS}s\n`)

  if (!rows.length) { console.log("Aucun résultat."); process.exit(0) }

  const outFile = join(__dirname, `sirene_targets_${naf.join("-") || "all"}_${departementsUsed.join("-")}_${TODAY}.csv`)
  const csv = [
    '"Siren","Denomination","CodePostal","Commune","TrancheEffectif","NAF","CategorieEntreprise"',
    ...rows.map(r => [r.Siren, r.Denomination, r.CodePostal, r.Commune, r.TrancheEffectif, r.NAF, r.CategorieEntreprise]
      .map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")),
  ].join("\n")
  writeFileSync(outFile, "﻿" + csv, "utf-8")
  console.log(`💾 ${outFile}`)
  console.log(`\nÉtape suivante : node enrich-and-scan.mjs ${outFile} (détection site marchand, pas de scan par défaut)`)
}

run().catch(e => { console.error("❌", e.message); process.exit(1) })
