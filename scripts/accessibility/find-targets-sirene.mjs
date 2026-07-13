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
// Usage :
//   node scripts/accessibility/find-targets-sirene.mjs --naf=47.71Z --departement=75 [--effectifMin=11] [--pages=5]
//
// Codes tranche d'effectif INSEE (trancheEffectifsUniteLegale) :
//   00=0 01=1-2 02=3-5 03=6-9 11=10-19 12=20-49 21=50-99 22=100-199
//   31=200-249 32=250-499 41=500-999 42=1000-1999 51=2000-4999 52=5000-9999 53=10000+
// --effectifMin=11 (défaut) = 10 salariés ou plus.
//
// Sortie : sirene_targets_{naf}_{departement}_{date}.csv (SIREN, dénomination,
// commune, code postal, tranche effectif) — SANS site web ni email : l'API
// Sirene ne les fournit pas. Étape suivante à construire : réutiliser la logique
// de découverte de site (scrape_sirene.mjs::scrapeEmailFromSite) à partir de la
// dénomination sociale pour chaque ligne de ce fichier.

import "dotenv/config"
import { writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const TODAY = new Date().toISOString().slice(0, 10)

const INSEE_CLIENT_ID = process.env.INSEE_SIRENE_CLIENT_ID
const BASE_URL = "https://api.insee.fr/api-sirene/3.11/siret"

// Tranches correspondant à "10 salariés ou plus" (>= code 11)
const TRANCHES_10_PLUS = ["11", "12", "21", "22", "31", "32", "41", "42", "51", "52", "53"]

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (prefix) => args.find(a => a.startsWith(prefix))?.slice(prefix.length)
  return {
    naf:          get("--naf="),
    departement:  get("--departement="),
    effectifMin:  get("--effectifMin=") ?? "11",
    pages:        parseInt(get("--pages=") ?? "5", 10),
  }
}

function buildEffectifClause(effectifMin) {
  const idx = TRANCHES_10_PLUS.indexOf(effectifMin)
  const tranches = idx >= 0 ? TRANCHES_10_PLUS.slice(idx) : TRANCHES_10_PLUS
  return `(${tranches.map(t => `trancheEffectifsUniteLegale:${t}`).join(" OR ")})`
}

async function querySirene({ naf, departement, effectifMin, page, pageSize = 20 }) {
  if (!INSEE_CLIENT_ID) {
    throw new Error("INSEE_SIRENE_CLIENT_ID manquant dans .env — voir https://portail-api.insee.fr pour créer une application")
  }

  const clauses = []
  if (naf) clauses.push(`activitePrincipaleUniteLegale:${naf}`)
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
    }
  }).filter(r => r.Denomination && r.Siren)
}

async function run() {
  const { naf, departement, effectifMin, pages } = parseArgs()
  if (!naf && !departement) {
    console.error("Usage: node find-targets-sirene.mjs --naf=47.71Z --departement=75 [--effectifMin=11] [--pages=5]")
    process.exit(1)
  }

  console.log(`\n🔍 Recherche Sirene — NAF=${naf ?? "tous"} · dépt=${departement ?? "tous"} · effectif ≥ tranche ${effectifMin}\n`)

  const rows = []
  for (let page = 0; page < pages; page++) {
    console.log(`  📄 Page ${page + 1}/${pages}`)
    try {
      const data = await querySirene({ naf, departement, effectifMin, page })
      const pageRows = extractRows(data)
      console.log(`     → ${pageRows.length} établissements`)
      rows.push(...pageRows)
      if (pageRows.length === 0) break
    } catch (err) {
      console.error(`  ❌ ${err.message}`)
      break
    }
  }

  console.log(`\n📊 ${rows.length} établissements trouvés (≥ ${effectifMin === "11" ? "10 salariés" : "tranche " + effectifMin})\n`)

  if (!rows.length) { console.log("Aucun résultat."); process.exit(0) }

  const outFile = join(__dirname, `sirene_targets_${naf ?? "all"}_${departement ?? "all"}_${TODAY}.csv`)
  const csv = [
    '"Siren","Denomination","CodePostal","Commune","TrancheEffectif","NAF"',
    ...rows.map(r => [r.Siren, r.Denomination, r.CodePostal, r.Commune, r.TrancheEffectif, r.NAF]
      .map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")),
  ].join("\n")
  writeFileSync(outFile, "﻿" + csv, "utf-8")
  console.log(`💾 ${outFile}`)
  console.log(`\nÉtape suivante : trouver le site web + email de chaque dénomination (réutiliser scrape_sirene.mjs), puis scanner via scan.mjs.`)
}

run().catch(e => { console.error("❌", e.message); process.exit(1) })
