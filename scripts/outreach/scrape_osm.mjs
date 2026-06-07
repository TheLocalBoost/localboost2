// scrape_osm.mjs — Leads gratuits sans clé API
// Sources : Overpass API (OpenStreetMap) + scraping site web
// Usage   : node scrape_osm.mjs "coiffeur" "Lyon"
// Output  : serpapi_{secteur}_{ville}_{date}.csv (même format que scrape_serpapi.js)

import "dotenv/config";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sleep     = ms => new Promise(r => setTimeout(r, ms));
const TODAY     = new Date().toISOString().slice(0, 10);

const [,, SECTOR = "coiffeur", CITY = "Paris"] = process.argv;

// ── Mapping secteur → tags OSM ───────────────────────────────────────────────
const OSM_TAGS = {
  coiffeur:    [["shop",    "hairdresser"], ["shop",  "beauty"]],
  barbier:     [["shop",    "hairdresser"], ["shop",  "barber"]],
  boulanger:   [["shop",    "bakery"]],
  restaurant:  [["amenity", "restaurant"]],
  fleuriste:   [["shop",    "florist"]],
  pharmacie:   [["amenity", "pharmacy"]],
  opticien:    [["shop",    "optician"]],
  dentiste:    [["amenity", "dentist"]],
  garagiste:   [["amenity", "car_repair"], ["shop",  "car_repair"]],
  plombier:    [["craft",   "plumber"]],
  electricien: [["craft",   "electrician"]],
  serrurier:   [["craft",   "locksmith"]],
  menuisier:   [["craft",   "carpenter"]],
  peintre:     [["craft",   "painter"]],
  carreleur:   [["craft",   "tiler"]],
  "maçon":     [["craft",   "mason"]],
  jardinier:   [["craft",   "gardener"]],
};

function buildOverpassQuery(sector, city) {
  const tagPairs = OSM_TAGS[sector] ?? [["name", `~"${sector}"`]];
  // Construire le filtre de tags en QL
  const tagFilters = tagPairs.map(([k, v]) => `["${k}"="${v}"]`).join("");
  return `[out:json][timeout:30];
area["name"="${city}"]["boundary"="administrative"]->.a;
(
  node${tagFilters}(area.a);
  way${tagFilters}(area.a);
);
out body center 80;`;
}

const OVERPASS_MIRRORS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

async function queryOverpass(sector, city) {
  const query = buildOverpassQuery(sector, city);
  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(mirror, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":   "LocalBoost-LeadScraper/1.0 (contact@thelocalboost.fr)",
        },
        body: "data=" + encodeURIComponent(query),
        signal: AbortSignal.timeout(35_000),
      });
      if (res.status === 429) { await sleep(3000); continue; }
      if (!res.ok) continue;
      const text = await res.text();
      if (!text.startsWith("{")) continue;
      const d = JSON.parse(text);
      return d.elements ?? [];
    } catch {
      continue;
    }
  }
  return [];
}

// ── Email depuis les tags OSM ────────────────────────────────────────────────
function emailFromTags(tags) {
  return (tags?.email || tags?.["contact:email"] || "").trim().toLowerCase() || null;
}

// ── Scraping site web ────────────────────────────────────────────────────────
const EMAIL_RE = /[a-z0-9][a-z0-9._%+\-]{2,}@[a-z0-9.\-]+\.(fr|com|net|org|eu)/gi;
const GENERIC_LOCAL = /^(contact|info|admin|webmaster|support|hello|service|mairie|secretariat|commercial|direction|recrutement|noreply|no-reply|accueil|reception|rh|facturation|reservation|vente|sav|boutique|newsletter|devis|presse|communication|logistique|magasin|bonjour)$/i;

function extractEmailsFromHtml(html) {
  const raw = [...new Set((html.match(EMAIL_RE) || []).map(e => e.toLowerCase()))];
  return raw.filter(e => {
    const [local] = e.split("@");
    if (local.length <= 3) return false;
    if (/^\d+$/.test(local)) return false;
    if (GENERIC_LOCAL.test(local)) return false;
    if (/\.(com|fr|net|org|eu)$/.test(local)) return false;
    return true;
  });
}

const CONTACT_PATHS = [
  "", "/contact", "/nous-contacter", "/contact.html", "/contactez-nous",
  "/a-propos", "/about", "/equipe", "/mentions-legales",
];

async function scrapeWebsite(url) {
  if (!url) return null;
  const base = url.replace(/\/$/, "");
  for (const path of CONTACT_PATHS) {
    try {
      const res = await fetch(base + path, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept":     "text/html",
        },
        signal: AbortSignal.timeout(8_000),
        redirect: "follow",
      });
      if (!res.ok) continue;
      const html = await res.text();
      const emails = extractEmailsFromHtml(html);
      if (emails.length) return emails[0];
      await sleep(300);
    } catch {
      continue;
    }
  }
  return null;
}

// ── Validation finale ────────────────────────────────────────────────────────
function isValidEmail(email) {
  if (!email) return false;
  const [local, domain] = email.split("@");
  if (!local || !domain) return false;
  if (email.includes("..")) return false;
  if (local.length <= 3) return false;
  if (/^\d+$/.test(local)) return false;
  if (/\.(com|fr|net|org|eu)$/.test(local)) return false;
  if (GENERIC_LOCAL.test(local)) return false;
  if (/\.(ac-[a-z]+\.fr|gouv\.fr|edu\.fr)$/.test(domain)) return false;
  return true;
}

function cleanName(raw) {
  if (!raw) return "";
  return raw
    .replace(/\s*[-–|]\s*(Facebook|Instagram|Google|Maps|YouTube).*$/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 65);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  const bouncedSet = existsSync(join(__dirname, "bounced.csv"))
    ? new Set(readFileSync(join(__dirname, "bounced.csv"), "utf-8").trim().split("\n").map(e => e.toLowerCase()).filter(Boolean))
    : new Set();
  const sentSet = existsSync(join(__dirname, "sent.csv"))
    ? new Set(readFileSync(join(__dirname, "sent.csv"), "utf-8").trim().split("\n").filter(Boolean))
    : new Set();

  console.log(`\n🗺️  OSM scraper — "${SECTOR}" @ ${CITY}\n`);

  const elements = await queryOverpass(SECTOR, CITY);
  console.log(`→ ${elements.length} éléments OSM trouvés`);

  const seen    = new Set();
  const results = [];

  for (const el of elements) {
    const tags = el.tags ?? {};
    const nom  = cleanName(tags.name || "");
    if (!nom || nom.length < 3) continue;

    const ville   = CITY;
    let   email   = emailFromTags(tags);
    const website = tags.website || tags["contact:website"] || tags.url || "";

    // Email direct depuis OSM
    if (email && isValidEmail(email) && !seen.has(email)
        && !bouncedSet.has(email) && !sentSet.has(email)) {
      seen.add(email);
      results.push({ Nom: nom, Email: email, Ville: ville });
      console.log(`  ✅ [OSM]  ${nom.padEnd(35)} ${email}`);
      continue;
    }

    // Scraper le site web si disponible
    if (website) {
      console.log(`  🌐 [web]  ${nom.slice(0, 35).padEnd(35)} ${website.slice(0, 40)}`);
      email = await scrapeWebsite(website);
      if (email && isValidEmail(email) && !seen.has(email)
          && !bouncedSet.has(email) && !sentSet.has(email)) {
        seen.add(email);
        results.push({ Nom: nom, Email: email, Ville: ville });
        console.log(`    ✅ ${email}`);
      } else {
        console.log(`    — pas d'email`);
      }
      await sleep(500);
    }
  }

  console.log(`\n📊 ${results.length} leads trouvés\n`);

  if (!results.length) {
    console.log("ℹ️  Aucun email trouvé via OSM pour ce secteur/ville.");
    return;
  }

  const out = join(__dirname, `serpapi_${SECTOR}_${CITY}_${TODAY}.csv`);
  // Si le fichier existe déjà (depuis scrape_serpapi.js), on fusionne
  const existingEmails = new Set();
  let existingRows     = [];
  if (existsSync(out)) {
    const lines = readFileSync(out, "utf-8").replace(/^﻿/, "").trim().split("\n").slice(1);
    for (const line of lines) {
      const cols = line.match(/"([^"]*)"/g)?.map(v => v.slice(1, -1)) ?? [];
      if (cols[1]) { existingEmails.add(cols[1].toLowerCase()); existingRows.push(cols); }
    }
  }

  const newRows = results.filter(r => !existingEmails.has(r.Email));
  const allRows = [
    ...existingRows.map(c => `"${c[0]}","${c[1]}","${c[2]}"`),
    ...newRows.map(r => `"${r.Nom.replace(/"/g, '""')}","${r.Email}","${r.Ville}"`),
  ];

  const csv = ['"Nom","Email","Ville"', ...allRows].join("\n");
  writeFileSync(out, "﻿" + csv, "utf-8");
  console.log(`✅ ${newRows.length} nouveau(x) lead(s) ajouté(s) → ${out}`);
}

run().catch(e => { console.error("❌", e.message); process.exit(1); });
