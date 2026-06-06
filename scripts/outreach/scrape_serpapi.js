// scrape_serpapi.js — scrape des emails de commerces locaux via SerpAPI.com
// Usage : node scrape_serpapi.js "coiffeur" "Lyon"
//         node scrape_serpapi.js "boulanger" "Paris" 3   ← 3 pages par requête
// Output : serpapi_{secteur}_{ville}_{ts}.csv  (colonnes : Nom, Email, Ville)
//          Compatible direct avec send.js

import "dotenv/config";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const KEY = process.env.SERPAPI_KEY;
if (!KEY) { console.error("❌ SERPAPI_KEY manquante dans .env"); process.exit(1); }

const [,, SECTOR = "coiffeur", CITY = "Paris", PAGES_STR = "2"] = process.argv;
const MAX_PAGES = Math.min(parseInt(PAGES_STR) || 2, 5);
const __dirname = dirname(fileURLToPath(import.meta.url));
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── API ──────────────────────────────────────────────────────────

async function serpapiSearch(params) {
  const url = new URL("https://serpapi.com/search.json");
  Object.entries({ api_key: KEY, hl: "fr", gl: "fr", ...params })
    .forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.href);
  if (res.status === 401) throw new Error("Clé SerpAPI invalide ou crédit épuisé");
  if (res.status === 429) throw new Error("Rate limit SerpAPI — attendez quelques secondes");
  if (!res.ok) throw new Error(`SerpAPI ${res.status}: ${(await res.text()).slice(0, 120)}`);
  return res.json();
}

// ── Validation email (mêmes règles que send.js) ──────────────────

function extractEmails(text) {
  if (!text) return [];
  const re = /[a-z0-9][a-z0-9._%+\-]*[a-z0-9]@[a-z0-9][a-z0-9.\-]*\.(fr|com|net|org)/gi;
  return [...new Set((text.match(re) || []).map(e => e.toLowerCase()))];
}

function isValidEmail(email) {
  const e = email.trim().toLowerCase();
  const local = e.split("@")[0];
  const re = /^[a-z0-9][a-z0-9._%+\-]*[a-z0-9]@[a-z0-9][a-z0-9.\-]*\.[a-z]{2,}$/;
  if (!re.test(e)) return false;
  if (local.length <= 3) return false;
  if (/^\d+$/.test(local)) return false;
  if (local.includes("..")) return false;
  if (e.startsWith("www.") || e.startsWith("-")) return false;
  if (/\.(com|fr|net|org|eu)$/.test(local)) return false;
  const GENERIC = /^(contact|info|admin|webmaster|support|hello|service|mairie|secretariat|commercial|direction|recrutement|no-reply|noreply|comptabilite|gestionnaire|accueil|reception|pro|rh|facturation|reservation|commande|vente|sav|bonjour|equipe|team|boutique|news|newsletter|devis|web|presse|communication|achat|logistique)$/i;
  if (GENERIC.test(local)) return false;
  const VILLES = /^(paris|lyon|marseille|toulouse|nantes|bordeaux|lille|nice|rennes|grenoble|strasbourg|montpellier|tours|nimes|dijon|angers|brest|metz|caen|reims|nancy|pau|rouen|toulon|clermont|amiens|limoges|albi|laval|beziers|dax|blois|colmar|vichy|macon|thionville)$/i;
  if (VILLES.test(local)) return false;
  return true;
}

function cleanName(raw) {
  return (raw || "")
    .replace(/\s*[|•·–@\(\[{].*$/, "")
    .replace(/\s*(facebook|instagram|google|maps|youtube|twitter|linkedin|tripadvisor|pages?)\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 70);
}

// ── Stratégies de recherche ──────────────────────────────────────

function buildQueries(sector, city) {
  return [
    `"${sector}" "${city}" "@gmail.com"`,
    `site:facebook.com "${sector}" "${city}" "@gmail.com"`,
    `site:facebook.com "${sector}" "${city}" gmail.com`,
    `site:instagram.com "${sector}" "${city}" "@gmail.com"`,
    `"${sector}" "${city}" contact gmail`,
    `artisan "${sector}" "${city}" "@gmail.com"`,
    `"${sector}" "${city}" email gmail site:pages-jaunes.fr OR site:societe.com`,
  ];
}

// ── Main ─────────────────────────────────────────────────────────

async function run() {
  const BOUNCED_FILE = join(__dirname, "bounced.csv");
  const SENT_FILE    = join(__dirname, "sent.csv");
  const bounced = existsSync(BOUNCED_FILE)
    ? new Set(readFileSync(BOUNCED_FILE, "utf-8").trim().split("\n").map(e => e.toLowerCase()).filter(Boolean))
    : new Set();
  const sent = existsSync(SENT_FILE)
    ? new Set(readFileSync(SENT_FILE, "utf-8").trim().split("\n").filter(Boolean))
    : new Set();

  console.log(`\n🔍  SerpAPI HARVEST — "${SECTOR}" @ ${CITY}  (${MAX_PAGES} page(s)/requête)\n`);

  const seen    = new Set();
  const results = [];
  let   apiCalls = 0;
  let   skipped  = 0;

  const queries = buildQueries(SECTOR, CITY);

  for (const q of queries) {
    for (let page = 0; page < MAX_PAGES; page++) {
      const start = page * 10;
      console.log(`  🔎  [page ${page + 1}] ${q}`);

      try {
        const data = await serpapiSearch({ engine: "google", q, num: 10, start });
        apiCalls++;

        const items = [
          ...(Array.isArray(data.organic_results) ? data.organic_results : []),
          ...(Array.isArray(data.local_results)   ? data.local_results   : []),
        ];

        for (const item of items) {
          const blob = [
            item.title,
            item.snippet,
            item.link,
            item.displayed_link,
            item.description,
          ].join(" ");

          for (const email of extractEmails(blob)) {
            if (seen.has(email))      { continue; }
            if (!isValidEmail(email)) { continue; }
            if (bounced.has(email))   { skipped++; continue; }
            if (sent.has(email))      { skipped++; continue; }

            seen.add(email);
            const nom = cleanName(item.title || "");
            if (nom.length < 3) continue;

            results.push({ Nom: nom, Email: email, Ville: CITY });
            console.log(`    ✅  ${nom.slice(0, 38).padEnd(38)} ${email}`);
          }
        }

        await sleep(1200);
      } catch (e) {
        console.error(`    ❌  ${e.message}`);
        if (e.message.includes("épuisé") || e.message.includes("invalide")) process.exit(1);
        await sleep(3000);
      }
    }
    await sleep(600);
  }

  // ── Google Maps local (bonus) ─────────────────────────────────
  console.log(`\n  🗺️   Google Maps — "${SECTOR} ${CITY}"`);
  try {
    const maps = await serpapiSearch({
      engine: "google_maps",
      q: `${SECTOR} ${CITY}`,
      type: "search",
    });
    apiCalls++;

    for (const place of maps.local_results || []) {
      const blob = [place.title, place.address, place.description || ""].join(" ");
      for (const email of extractEmails(blob)) {
        if (!seen.has(email) && isValidEmail(email) && !bounced.has(email) && !sent.has(email)) {
          seen.add(email);
          const nom = cleanName(place.title || "");
          if (nom.length >= 3) {
            results.push({ Nom: nom, Email: email, Ville: CITY });
            console.log(`    ✅  [Maps] ${nom.slice(0, 35).padEnd(35)} ${email}`);
          }
        }
      }
    }
  } catch (e) {
    console.warn(`  ⚠️  Maps skipped: ${e.message}`);
  }

  // ── Résumé ───────────────────────────────────────────────────
  console.log(`\n📊  ${apiCalls} appels API · ${results.length} nouveaux leads · ${skipped} ignorés (déjà envoyé/bounce)`);

  if (!results.length) {
    console.log("❌  Aucun lead trouvé — essayez un autre secteur ou une autre ville\n");
    return;
  }

  const csv = [
    '"Nom","Email","Ville"',
    ...results.map(r =>
      [r.Nom, r.Email, r.Ville]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const ts  = new Date().toISOString().slice(0, 10);
  const out = join(__dirname, `serpapi_${SECTOR}_${CITY}_${ts}.csv`);
  writeFileSync(out, "﻿" + csv, "utf-8");
  console.log(`✅  ${results.length} leads → ${out}\n`);
}

run().catch(e => { console.error("❌", e.message); process.exit(1); });
