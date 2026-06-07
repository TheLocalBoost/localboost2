// scrape_places.mjs — Leads via Google Places API + scraping site web
// Ne garde que les commerces avec une fiche Google non optimisée (score < SCORE_MAX)
// Usage   : node scrape_places.mjs "coiffeur" "Lyon" [--score-max=70]
// Output  : serpapi_{secteur}_{ville}_{date}.csv avec Score et AppelsPerdus

import "dotenv/config";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sleep     = ms => new Promise(r => setTimeout(r, ms));
const TODAY     = new Date().toISOString().slice(0, 10);

const [,, SECTOR = "coiffeur", CITY = "Paris"] = process.argv;
const SCORE_MAX_ARG = process.argv.find(a => a.startsWith("--score-max="));
const SCORE_MAX     = SCORE_MAX_ARG ? parseInt(SCORE_MAX_ARG.split("=")[1]) : 70;

const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!PLACES_KEY) {
  console.error("❌ GOOGLE_PLACES_API_KEY manquante dans .env");
  process.exit(1);
}

// ── Panier moyen par secteur (pour estimer les appels perdus) ────────────────
const PANIER = {
  plombier: 200, electricien: 180, coiffeur: 55, boulanger: 75,
  restaurateur: 25, restaurant: 25, garagiste: 300, serrurier: 150,
  fleuriste: 55, opticien: 200, dentiste: 150, pharmacie: 40,
  menuisier: 180, peintre: 180, carreleur: 200, jardinier: 80, artisan: 150,
};

// ── Score fiche Google (même logique que l'analyseur) ────────────────────────
function scoreFiche(details) {
  const criteria = {
    nom:         !!details.name,
    adresse:     !!details.formatted_address,
    telephone:   !!details.formatted_phone_number,
    horaires:    !!(details.opening_hours?.periods?.length),
    site:        !!details.website,
    description: !!details.editorial_summary?.overview,
    photos:      (details.photos?.length ?? 0) >= 5,
    avis20:      (details.user_ratings_total ?? 0) >= 20,
    note4:       (details.rating ?? 0) >= 4.0,
    recentAvis:  hasRecentReview(details.reviews ?? []),
  };
  const score = Math.round(Object.values(criteria).filter(Boolean).length / Object.keys(criteria).length * 100);
  return { score, criteria };
}

function hasRecentReview(reviews) {
  if (!reviews?.length) return false;
  const cutoff = Date.now() / 1000 - 90 * 86400;
  return reviews.some(r => r.time > cutoff);
}

// Estimation des appels perdus par mois selon les problèmes
function estimateLostCalls(criteria, score) {
  let calls = 0;
  if (!criteria.horaires)    calls += 8;
  if (!criteria.photos)      calls += 5;
  if (!criteria.recentAvis)  calls += 10;
  if (!criteria.description) calls += 2;
  if (!criteria.site)        calls += 1;
  if (!criteria.avis20)      calls += 3;
  if (!criteria.note4)       calls += 5;
  if (!criteria.telephone)   calls += 4;
  // Plafonnement selon le score
  const cap = score >= 86 ? 5 : score >= 71 ? 15 : score >= 51 ? 30 : calls;
  return Math.min(calls, cap);
}

// ── Places Text Search (jusqu'à 3 pages = 60 résultats) ─────────────────────
async function textSearchAll(sector, city) {
  const results = [];
  let nextUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${sector} ${city}`)}&language=fr&region=fr&key=${PLACES_KEY}`;

  for (let page = 0; page < 3 && nextUrl; page++) {
    if (page > 0) await sleep(2100);
    const res = await fetch(nextUrl);
    const d   = await res.json();
    if (d.status !== "OK" && d.status !== "ZERO_RESULTS") break;
    results.push(...(d.results ?? []));
    nextUrl = d.next_page_token
      ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${d.next_page_token}&key=${PLACES_KEY}`
      : null;
  }
  return results;
}

// ── Place Details ─────────────────────────────────────────────────────────────
const DETAIL_FIELDS = [
  "name","formatted_address","formatted_phone_number","opening_hours",
  "website","editorial_summary","photos","user_ratings_total",
  "rating","reviews","business_status",
].join(",");

async function getDetails(place_id) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=${DETAIL_FIELDS}&language=fr&key=${PLACES_KEY}`;
  try {
    const res = await fetch(url);
    const d   = await res.json();
    return d.result ?? null;
  } catch { return null; }
}

// ── Scraping site web ─────────────────────────────────────────────────────────
const EMAIL_RE      = /[a-z0-9][a-z0-9._%+\-]{2,}@[a-z0-9.\-]+\.(fr|com|net|org|eu)/gi;
const GENERIC_LOCAL = /^(contact|info|admin|webmaster|support|hello|service|mairie|secretariat|commercial|direction|recrutement|noreply|no-reply|accueil|reception|rh|facturation|reservation|vente|sav|boutique|newsletter|devis|presse|communication|logistique|magasin|bonjour|equipe|team|votre)$/i;
const CONTACT_PATHS = [
  "", "/contact", "/nous-contacter", "/contactez-nous",
  "/contact.html", "/a-propos", "/about", "/mentions-legales",
];

function extractEmails(html) {
  return [...new Set((html.match(EMAIL_RE) || []).map(e => e.toLowerCase()))].filter(e => {
    const [local, domain] = e.split("@");
    if (!local || !domain) return false;
    if (local.length <= 3) return false;
    if (/^\d+$/.test(local)) return false;
    if (/\.(com|fr|net|org|eu)$/.test(local)) return false;
    if (GENERIC_LOCAL.test(local)) return false;
    if (/\.(ac-[a-z]+\.fr|gouv\.fr)$/.test(domain)) return false;
    if (/^(boulanger|fnac|darty|leroy)\./.test(domain)) return false;
    return true;
  });
}

async function scrapeWebsite(website) {
  if (!website) return null;
  const base = website.replace(/\/$/, "");
  for (const path of CONTACT_PATHS) {
    try {
      const res = await fetch(base + path, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept":     "text/html",
          "Accept-Language": "fr-FR,fr;q=0.9",
        },
        signal:   AbortSignal.timeout(8000),
        redirect: "follow",
      });
      if (!res.ok) continue;
      const emails = extractEmails(await res.text());
      if (emails.length) return emails[0];
      await sleep(300);
    } catch { continue; }
  }
  return null;
}

function cleanName(raw) {
  return raw.replace(/\s*[-–|]\s*(Facebook|Instagram|Google|Maps|YouTube).*$/gi, "")
    .replace(/\s{2,}/g, " ").trim().slice(0, 65);
}

function extractCity(address) {
  const m = address?.match(/\d{5}\s+([A-ZÀ-Ÿa-zà-ÿ\s\-]+?)(?:,|$)/);
  if (m) return m[1].trim();
  const parts = (address ?? "").split(",").map(s => s.trim()).filter(Boolean);
  return parts[parts.length - 2] || CITY;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  const sentSet = existsSync(join(__dirname, "sent.csv"))
    ? new Set(readFileSync(join(__dirname, "sent.csv"), "utf-8").trim().split("\n").map(e => e.toLowerCase()).filter(Boolean))
    : new Set();
  const bouncedSet = existsSync(join(__dirname, "bounced.csv"))
    ? new Set(readFileSync(join(__dirname, "bounced.csv"), "utf-8").trim().split("\n").map(e => e.toLowerCase()).filter(Boolean))
    : new Set();

  console.log(`\n📍 Places scraper — "${SECTOR}" @ ${CITY} (score max : ${SCORE_MAX}/100)\n`);

  const businesses = await textSearchAll(SECTOR, CITY);
  console.log(`→ ${businesses.length} commerces trouvés sur Maps\n`);

  const seen    = new Set();
  const results = [];
  let   skipped_score = 0;

  for (const biz of businesses) {
    const nom = cleanName(biz.name || "");
    if (!nom || nom.length < 3) continue;

    process.stdout.write(`  🏪 ${nom.slice(0, 38).padEnd(38)} `);

    // Récupérer les détails complets
    const details = await getDetails(biz.place_id);
    await sleep(150);
    if (!details) { console.log("— détails indispo"); continue; }

    // Calculer le score
    const { score, criteria } = scoreFiche(details);
    const panier     = PANIER[SECTOR] ?? PANIER[biz.types?.[0]] ?? 150;
    const lostCalls  = estimateLostCalls(criteria, score);
    const lostRevenue = lostCalls * panier;

    // Filtrer les fiches déjà bien optimisées
    if (score >= SCORE_MAX) {
      console.log(`— score ${score}/100 ✅ déjà bien tenue (skip)`);
      skipped_score++;
      continue;
    }

    const ville   = extractCity(details.formatted_address) || CITY;
    const website = details.website || "";

    console.log(`score ${score}/100 ⚠️`);

    if (!website) {
      console.log(`     — pas de site web`);
      continue;
    }
    console.log(`     🌐 ${website.slice(0, 55)}`);

    const email = await scrapeWebsite(website);
    await sleep(400);

    if (!email) { console.log(`     — pas d'email`); continue; }
    if (seen.has(email) || sentSet.has(email) || bouncedSet.has(email)) {
      console.log(`     ↩  ${email} (déjà connu)`); continue;
    }

    seen.add(email);
    results.push({ nom, email, ville, secteur: SECTOR, score, lostCalls });
    console.log(`     ✅ ${email} | ~${lostCalls} appels perdus/mois | ~${lostRevenue}€`);
  }

  console.log(`\n📊 ${results.length} leads retenus`);
  console.log(`   ${skipped_score} skipped (score ≥ ${SCORE_MAX} = fiche déjà bien tenue)`);

  if (!results.length) { console.log("ℹ️  Aucun lead trouvé."); return; }

  // Fusionner avec CSV existant si présent
  const outPath = join(__dirname, `serpapi_${SECTOR}_${CITY}_${TODAY}.csv`);
  const existingEmails = new Set();
  let   existingLines  = [];
  if (existsSync(outPath)) {
    const lines = readFileSync(outPath, "utf-8").replace(/^﻿/, "").trim().split("\n").slice(1);
    for (const line of lines) {
      const cols = line.match(/"([^"]*)"/g)?.map(v => v.slice(1, -1)) ?? [];
      if (cols[1]) { existingEmails.add(cols[1].toLowerCase()); existingLines.push(line); }
    }
  }

  const newLines = results
    .filter(r => !existingEmails.has(r.email))
    .map(r => `"${r.nom.replace(/"/g, '""')}","${r.email}","${r.ville}","${r.secteur}","${r.score}","${r.lostCalls}"`);

  const csv = ['"Nom","Email","Ville","Secteur","Score","AppelsPerdus"', ...existingLines, ...newLines].join("\n");
  writeFileSync(outPath, "﻿" + csv, "utf-8");
  console.log(`\n✅ ${newLines.length} nouveau(x) → ${outPath}`);
  console.log(`   Ces leads ont le score dans le CSV → l'email affichera leur diagnostic réel.\n`);
}

run().catch(e => { console.error("❌", e.message); process.exit(1); });
