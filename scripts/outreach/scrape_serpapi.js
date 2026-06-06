// scrape_serpapi.js — 2 étapes : (1) vrais commerces via Maps local
//                                (2) email de chaque commerce trouvé
// Moteurs : SerpAPI.com puis Serper.dev en fallback automatique
// Usage   : node scrape_serpapi.js "coiffeur" "Lyon"
// Output  : serpapi_{secteur}_{ville}_{date}.csv  colonnes : Nom, Email, Ville

import "dotenv/config";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sleep = ms => new Promise(r => setTimeout(r, ms));

const [,, SECTOR = "coiffeur", CITY = "Paris", PAGES_STR = "1"] = process.argv;
const MAX_PAGES = Math.min(parseInt(PAGES_STR) || 1, 3);

// ── Clés API ─────────────────────────────────────────────────────

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const SERPER_KEYS = [1,2,3,4,5,6,7]
  .map(i => process.env[`SERPER_KEY_${i}`])
  .filter(Boolean);

let useSerpAPI = false;
let serperIdx  = SERPER_KEYS.length - 1; // démarre sur la clé 6 (seule non épuisée)

if (!SERPER_KEYS.length) {
  console.error("❌ Aucune clé SERPER_KEY_1..7 dans .env");
  process.exit(1);
}

console.log(`🔑 Serper.dev  (${SERPER_KEYS.length} clé(s))`);

// ── Appels API ────────────────────────────────────────────────────

async function serpapiCall(params) {
  const url = new URL("https://serpapi.com/search.json");
  Object.entries({ api_key: SERPAPI_KEY, hl: "fr", gl: "fr", ...params })
    .forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.href);
  if (res.status === 401 || res.status === 403 || res.status === 429) {
    useSerpAPI = false;
    throw new Error("__SERPAPI_EXHAUSTED__");
  }
  if (!res.ok) throw new Error(`SerpAPI ${res.status}`);
  return res.json();
}

function serperKey() {
  if (serperIdx >= SERPER_KEYS.length) {
    console.error("❌ Toutes les clés Serper épuisées");
    process.exit(1);
  }
  return SERPER_KEYS[serperIdx];
}

async function serperCall(q, extra = {}) {
  while (serperIdx < SERPER_KEYS.length) {
    const res = await fetch("https://google.serper.dev/search", {
      method:  "POST",
      headers: { "X-API-KEY": serperKey(), "Content-Type": "application/json" },
      body:    JSON.stringify({ q, gl: "fr", hl: "fr", num: 10, ...extra }),
    });
    if (!res.ok) {
      const body = await res.text();
      if (res.status === 402 || res.status === 429 ||
          (res.status === 400 && body.toLowerCase().includes("credit"))) {
        console.warn(`  ⚠️  Clé Serper ${serperIdx + 1} épuisée (${res.status}) → suivante`);
        serperIdx++;
        continue;
      }
      throw new Error(`Serper ${res.status}: ${body.slice(0, 80)}`);
    }
    return res.json();
  }
  console.error("❌ Toutes les clés Serper épuisées"); process.exit(1);
}

// Recherche organique unifiée → retourne un tableau {title, snippet, link}
async function searchOrganic(q, start = 0) {
  if (useSerpAPI) {
    try {
      const d = await serpapiCall({ engine: "google", q, num: 10, start });
      return [
        ...(Array.isArray(d.organic_results) ? d.organic_results : []),
        ...(Array.isArray(d.local_results)   ? d.local_results   : []),
      ].map(r => ({ title: r.title || "", snippet: r.snippet || "", link: r.link || "" }));
    } catch (e) {
      if (!e.message.includes("__SERPAPI_EXHAUSTED__")) throw e;
      console.warn("  ↩️  Bascule Serper.dev");
    }
  }
  const d = await serperCall(q);
  return (d.organic || []).map(r => ({
    title: r.title || "", snippet: r.snippet || "", link: r.link || "",
  }));
}

// Recherche locale Maps → SerpAPI uniquement (Serper.dev ne supporte pas tbm=lcl)
async function searchLocal(q) {
  if (!useSerpAPI) return [];
  try {
    const d = await serpapiCall({ engine: "google_maps", q, type: "search" });
    return Array.isArray(d.local_results) ? d.local_results : [];
  } catch (e) {
    if (e.message.includes("__SERPAPI_EXHAUSTED__")) {
      console.warn("  ↩️  SerpAPI épuisé — Maps ignoré, uniquement scrape organique");
      return [];
    }
    throw e;
  }
}

// ── Validation ────────────────────────────────────────────────────

function extractEmails(text) {
  if (!text) return [];
  const re = /[a-z0-9][a-z0-9._%+\-]*[a-z0-9]@[a-z0-9][a-z0-9.\-]*\.(fr|com|net|org)/gi;
  return [...new Set((text.match(re) || []).map(e => e.toLowerCase()))];
}

function isValidEmail(email) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return false;
  if (email.includes("..")) return false;
  if (/\.(com|fr)\.(com|fr)$/.test(email)) return false;
  if (local.length <= 3) return false;
  if (/^\d+$/.test(local)) return false;
  if (/\.(com|fr|net|org|eu)$/.test(local)) return false;
  const GENERIC = /^(contact|info|admin|support|service|mairie|secretariat|commercial|direction|recrutement|noreply|no-reply|comptabilite|accueil|reception|rh|facturation|reservation|vente|sav|boutique|newsletter|devis|presse|communication|logistique|magasin)$/i;
  if (GENERIC.test(local)) return false;
  const VILLES = /^(paris|lyon|marseille|toulouse|nantes|bordeaux|lille|nice|rennes|grenoble|strasbourg|montpellier|tours|nimes|dijon|angers|brest|metz|caen|reims|nancy|pau|rouen|toulon|clermont|amiens|limoges|albi|laval|beziers|dax|blois|colmar)$/i;
  if (VILLES.test(local)) return false;
  const BAD_DOMAINS = /\.(ac-[a-z]+\.fr|gouv\.fr|edu\.fr)$|^(boulanger|fnac|darty|leroy-merlin)\.com$/;
  if (BAD_DOMAINS.test(domain)) return false;
  return true;
}

function cleanName(raw) {
  if (!raw) return "";
  return raw
    .replace(/\s*[-–|]\s*(Facebook|Instagram|Google|Maps|YouTube|Twitter|TikTok|Pages?).*$/gi, "")
    .replace(/\s*\|.*$/, "")
    .replace(/\s*·.*$/, "")
    .replace(/[^\w\sÀ-ÿ'&°\-]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 65);
}

function isRealBusinessName(name) {
  if (!name || name.length < 3 || name.length > 65) return false;
  if (/[#@<>{}\[\]]/.test(name)) return false;
  if (/\d{5,}/.test(name)) return false;
  if (/^(Nom|Accueil|Forum|Livret|Archives|Newsletter|Budget|Zoom|Reel|Annuaire)$/i.test(name)) return false;
  if (/conseil\s+(paroissial|municipal|syndical)|syndicat|fédération|greta/i.test(name)) return false;
  if (name.split(" ").length > 8) return false;
  const words = name.split(/\s+/);
  if (words.length > 2 && name === name.toUpperCase()) return false;
  return true;
}

// Extrait la ville depuis une adresse Google Maps
function extractCityFromAddress(address) {
  if (!address) return "";
  // "12 Rue du Commerce, 69001 Lyon, France" → "Lyon"
  const m = address.match(/\d{5}\s+([A-ZÀ-Ÿa-zà-ÿ\s\-]+?)(?:,|$)/);
  if (m) return m[1].trim();
  const parts = address.split(",").map(s => s.trim()).filter(Boolean);
  return parts[parts.length - 2] || parts[0] || "";
}

// ── Étape 1 : trouver les vrais commerces via Maps ────────────────

async function findLocalBusinesses(sector, city) {
  const q = `${sector} ${city}`;
  console.log(`\n  🗺️   Maps local — "${q}"`);
  try {
    const places = await searchLocal(q);
    return places.map(p => ({
      name:    p.title || p.name || "",
      address: p.address || "",
      website: p.website || p.website_link || "",
    })).filter(p => p.name);
  } catch (e) {
    console.warn(`  ⚠️  Maps skipped: ${e.message}`);
    return [];
  }
}

// ── Étape 2 : chercher l'email de chaque commerce ─────────────────

async function findEmailForBusiness(businessName, city) {
  const queries = [
    `"${businessName}" "@gmail.com"`,
    `"${businessName}" "${city}" email gmail`,
    `site:facebook.com "${businessName}" "@gmail.com"`,
  ];
  for (const q of queries) {
    try {
      const items = await searchOrganic(q);
      for (const item of items) {
        const blob = [item.title, item.snippet, item.link].join(" ");
        for (const email of extractEmails(blob)) {
          if (isValidEmail(email)) return email;
        }
      }
      await sleep(800);
    } catch { /* passer à la requête suivante */ }
  }
  return null;
}

// ── Étape 2b : scrape organique fallback ────────────────────────

function buildFallbackQueries(sector, city) {
  return [
    // Réseaux sociaux
    `site:facebook.com "${sector}" "${city}" "@gmail.com"`,
    `site:instagram.com "${sector}" "${city}" "@gmail.com"`,

    // Pages Jaunes — annuaire le plus complet pour artisans FR
    `site:pagesjaunes.fr "${sector}" "${city}"`,
    `"${sector}" "${city}" site:pagesjaunes.fr "@gmail.com"`,

    // Le Bon Coin — artisans cherchant clients / emploi
    `site:leboncoin.fr "${sector}" "${city}" "@gmail.com"`,
    `site:leboncoin.fr "artisan" "${sector}" "${city}" gmail`,

    // Google Maps / fiches locales
    `"${sector}" "${city}" "Google Maps" "@gmail.com"`,

    // Sites perso & portfolios (hors réseaux sociaux)
    `"${sector}" "${city}" "@gmail.com" -site:facebook.com -site:instagram.com`,

    // Annuaires pro français
    `"${sector}" "${city}" "@gmail.com" (site:societe.com OR site:kompass.com OR site:hoodspot.fr)`,

    // Pages de contact directes
    `"${sector}" "${city}" "nous contacter" OR "prendre rendez-vous" "@gmail.com"`,
  ];
}

// ── Main ──────────────────────────────────────────────────────────

async function run() {
  const bouncedSet = existsSync(join(__dirname, "bounced.csv"))
    ? new Set(readFileSync(join(__dirname, "bounced.csv"), "utf-8").trim().split("\n").map(e => e.toLowerCase()).filter(Boolean))
    : new Set();
  const sentSet = existsSync(join(__dirname, "sent.csv"))
    ? new Set(readFileSync(join(__dirname, "sent.csv"), "utf-8").trim().split("\n").filter(Boolean))
    : new Set();

  console.log(`\n🔍  "${SECTOR}" @ ${CITY}\n`);

  const seen    = new Set();
  const results = [];
  let   calls   = 0;

  // ── ÉTAPE 1 : vrais commerces depuis Maps ──────────────────────
  const businesses = await findLocalBusinesses(SECTOR, CITY);
  calls++;
  console.log(`  → ${businesses.length} commerces trouvés sur Maps\n`);

  for (const biz of businesses) {
    const nom = cleanName(biz.name);
    if (!isRealBusinessName(nom)) continue;

    const ville = extractCityFromAddress(biz.address) || CITY;
    console.log(`  🏪  ${nom} (${ville})`);

    const email = await findEmailForBusiness(nom, ville);
    calls += 3;

    if (email && !seen.has(email) && !bouncedSet.has(email) && !sentSet.has(email)) {
      seen.add(email);
      results.push({ Nom: nom, Email: email, Ville: ville });
      console.log(`    ✅  ${email}`);
    } else if (!email) {
      console.log(`    —  pas d'email trouvé`);
    }
    await sleep(600);
  }

  // ── ÉTAPE 2 : scrape organique pour compléter ──────────────────
  console.log(`\n  🔎  Scrape organique complémentaire...`);
  for (const q of buildFallbackQueries(SECTOR, CITY)) {
    for (let page = 0; page < MAX_PAGES; page++) {
      try {
        const items = await searchOrganic(q, page * 10);
        calls++;
        for (const item of items) {
          const blob = [item.title, item.snippet, item.link].join(" ");
          // Vérifier que le résultat concerne bien la ville cible
          const cityBase = CITY.split(" ")[0].toLowerCase();
          if (!blob.toLowerCase().includes(cityBase)) continue;
          for (const email of extractEmails(blob)) {
            if (!seen.has(email) && isValidEmail(email)
                && !bouncedSet.has(email) && !sentSet.has(email)) {
              const nom = cleanName(item.title || "");
              if (!isRealBusinessName(nom)) continue;
              seen.add(email);
              results.push({ Nom: nom, Email: email, Ville: CITY });
              console.log(`    ✅  ${nom.slice(0, 38).padEnd(38)} ${email}`);
            }
          }
        }
        await sleep(1000);
      } catch (e) {
        console.error(`    ❌  ${e.message}`);
        await sleep(2000);
      }
    }
  }

  // ── Résultat ──────────────────────────────────────────────────
  console.log(`\n📊  ${calls} appels · ${results.length} leads\n`);

  if (!results.length) return;

  const ts  = new Date().toISOString().slice(0, 10);
  const out = join(__dirname, `serpapi_${SECTOR}_${CITY}_${ts}.csv`);
  const csv = [
    '"Nom","Email","Ville"',
    ...results.map(r =>
      [r.Nom, r.Email, r.Ville].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");
  writeFileSync(out, "﻿" + csv, "utf-8");
  console.log(`✅  → ${out}`);
}

run().catch(e => { console.error("❌", e.message); process.exit(1); });
