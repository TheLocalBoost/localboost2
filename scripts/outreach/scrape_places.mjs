// scrape_places.mjs — Leads via Google Places API + scraping site web
// Gratuit dans le crédit $200/mois Google (clé déjà disponible dans Vercel)
// Usage   : node scrape_places.mjs "coiffeur" "Lyon"
// Output  : serpapi_{secteur}_{ville}_{date}.csv (même format)
//
// Pipeline :
//   1. Places Text Search  → liste des commerces (nom, place_id)
//   2. Places Details      → website du commerce
//   3. Scraping du site    → email sur page /contact ou /nous-contacter

import "dotenv/config";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sleep     = ms => new Promise(r => setTimeout(r, ms));
const TODAY     = new Date().toISOString().slice(0, 10);

const [,, SECTOR = "coiffeur", CITY = "Paris"] = process.argv;

const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;
if (!PLACES_KEY) {
  console.error("❌ GOOGLE_PLACES_API_KEY manquante dans .env");
  process.exit(1);
}

// ── Places Text Search ───────────────────────────────────────────────────────
async function textSearch(sector, city) {
  const q = encodeURIComponent(`${sector} ${city}`);
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&language=fr&region=fr&key=${PLACES_KEY}`;
  const res = await fetch(url);
  const d   = await res.json();
  if (d.status !== "OK" && d.status !== "ZERO_RESULTS") {
    console.error("  ❌ Places Text Search:", d.status, d.error_message || "");
    return [];
  }
  return (d.results || []).map(r => ({
    name:     r.name || "",
    place_id: r.place_id || "",
    address:  r.formatted_address || "",
  }));
}

// Paginate jusqu'à 3 pages (max 60 résultats)
async function textSearchAll(sector, city) {
  const url0 = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${sector} ${city}`)}&language=fr&region=fr&key=${PLACES_KEY}`;
  const results = [];
  let nextUrl = url0;

  for (let page = 0; page < 3 && nextUrl; page++) {
    if (page > 0) await sleep(2000); // Places API need 2s between page_token calls
    const res = await fetch(nextUrl);
    const d   = await res.json();
    if (d.status !== "OK" && d.status !== "ZERO_RESULTS") break;
    for (const r of d.results || []) {
      results.push({ name: r.name || "", place_id: r.place_id || "", address: r.formatted_address || "" });
    }
    nextUrl = d.next_page_token
      ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${d.next_page_token}&key=${PLACES_KEY}`
      : null;
  }
  return results;
}

// ── Places Details → website ─────────────────────────────────────────────────
async function getWebsite(place_id) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=website,formatted_phone_number&language=fr&key=${PLACES_KEY}`;
  try {
    const res = await fetch(url);
    const d   = await res.json();
    return {
      website: d.result?.website || "",
      phone:   d.result?.formatted_phone_number || "",
    };
  } catch {
    return { website: "", phone: "" };
  }
}

// ── Scraping site web ────────────────────────────────────────────────────────
const EMAIL_RE      = /[a-z0-9][a-z0-9._%+\-]{2,}@[a-z0-9.\-]+\.(fr|com|net|org|eu)/gi;
const GENERIC_LOCAL = /^(contact|info|admin|webmaster|support|hello|service|mairie|secretariat|commercial|direction|recrutement|noreply|no-reply|accueil|reception|rh|facturation|reservation|vente|sav|boutique|newsletter|devis|presse|communication|logistique|magasin|bonjour|equipe|team)$/i;
const CONTACT_PATHS = [
  "", "/contact", "/nous-contacter", "/contactez-nous",
  "/contact.html", "/nous-contacter.html",
  "/a-propos", "/about", "/equipe", "/mentions-legales",
];

function extractEmails(html) {
  return [...new Set((html.match(EMAIL_RE) || []).map(e => e.toLowerCase()))].filter(e => {
    const [local, domain] = e.split("@");
    if (!local || !domain) return false;
    if (local.length <= 3) return false;
    if (/^\d+$/.test(local)) return false;
    if (/\.(com|fr|net|org|eu)$/.test(local)) return false;
    if (GENERIC_LOCAL.test(local)) return false;
    if (/\.(ac-[a-z]+\.fr|gouv\.fr|edu\.fr)$/.test(domain)) return false;
    if (/^(boulanger|fnac|darty|leroy-merlin|maaf|ageas)\./.test(domain)) return false;
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
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept":     "text/html,application/xhtml+xml",
          "Accept-Language": "fr-FR,fr;q=0.9",
        },
        signal:   AbortSignal.timeout(8000),
        redirect: "follow",
      });
      if (!res.ok) continue;
      const html   = await res.text();
      const emails = extractEmails(html);
      if (emails.length) return emails[0];
      await sleep(300);
    } catch {
      continue;
    }
  }
  return null;
}

// ── Extraire la ville depuis l'adresse Google ────────────────────────────────
function extractCity(address) {
  const m = address.match(/\d{5}\s+([A-ZÀ-Ÿa-zà-ÿ\s\-]+?)(?:,|$)/);
  if (m) return m[1].trim();
  const parts = address.split(",").map(s => s.trim()).filter(Boolean);
  return parts[parts.length - 2] || CITY;
}

function cleanName(raw) {
  return raw
    .replace(/\s*[-–|]\s*(Facebook|Instagram|Google|Maps|YouTube|TikTok).*$/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 65);
}

function isValidName(name) {
  if (!name || name.length < 3 || name.length > 65) return false;
  if (/[#@<>{}\[\]]/.test(name)) return false;
  if (/\d{5,}/.test(name)) return false;
  if (name.split(" ").length > 8) return false;
  return true;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  const bouncedSet = existsSync(join(__dirname, "bounced.csv"))
    ? new Set(readFileSync(join(__dirname, "bounced.csv"), "utf-8").trim().split("\n").map(e => e.toLowerCase()).filter(Boolean))
    : new Set();
  const sentSet = existsSync(join(__dirname, "sent.csv"))
    ? new Set(readFileSync(join(__dirname, "sent.csv"), "utf-8").trim().split("\n").filter(Boolean))
    : new Set();

  console.log(`\n📍 Places scraper — "${SECTOR}" @ ${CITY}`);

  const businesses = await textSearchAll(SECTOR, CITY);
  console.log(`→ ${businesses.length} commerces trouvés sur Google Maps\n`);

  const seen    = new Set();
  const results = [];

  for (const biz of businesses) {
    const nom = cleanName(biz.name);
    if (!isValidName(nom)) continue;

    const ville = extractCity(biz.address) || CITY;
    console.log(`  🏪 ${nom.slice(0, 40).padEnd(40)} ${ville}`);

    // Récupérer le website via Place Details
    const { website } = await getWebsite(biz.place_id);
    await sleep(200);

    if (!website) {
      console.log(`     — pas de site web`);
      continue;
    }

    console.log(`     🌐 ${website.slice(0, 50)}`);

    // Scraper le site pour trouver l'email
    const email = await scrapeWebsite(website);
    await sleep(400);

    if (!email) {
      console.log(`     — pas d'email`);
      continue;
    }

    if (seen.has(email) || bouncedSet.has(email) || sentSet.has(email)) {
      console.log(`     ↩  ${email} (déjà connu)`);
      continue;
    }

    seen.add(email);
    results.push({ Nom: nom, Email: email, Ville: ville });
    console.log(`     ✅ ${email}`);
  }

  console.log(`\n📊 ${results.length} leads trouvés\n`);
  if (!results.length) {
    console.log("ℹ️  Aucun email trouvé pour ce secteur/ville.");
    return;
  }

  // Fusionner avec CSV existant si présent (éviter les doublons avec scrape_serpapi)
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
    .filter(r => !existingEmails.has(r.Email))
    .map(r => `"${r.Nom.replace(/"/g, '""')}","${r.Email}","${r.Ville}"`);

  const csv = ['"Nom","Email","Ville"', ...existingLines, ...newLines].join("\n");
  writeFileSync(outPath, "﻿" + csv, "utf-8");
  console.log(`✅ ${newLines.length} nouveau(x) → ${outPath}`);
}

run().catch(e => { console.error("❌", e.message); process.exit(1); });
