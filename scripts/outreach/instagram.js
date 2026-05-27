// INSTAGRAM.JS – trouve des gmails via Serper Search (site:facebook.com / instagram.com)
// Usage : node instagram.js "boulangerie" "Lyon"

import { writeFileSync, readFileSync, writeFileSync as wfs } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import "dotenv/config";

const [,, QUERY = "boulangerie", CITY = "Paris"] = process.argv;

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = join(__dirname, "serper_state.json");

const SERPER_KEYS = [1,2,3,4,5,6,7]
  .map(i => process.env[`SERPER_KEY_${i}`])
  .filter(Boolean);
const BRAVE_KEY = process.env.BRAVE_API_KEY;

if (!SERPER_KEYS.length && !BRAVE_KEY) {
  console.error("❌ Aucune clé Serper (SERPER_KEY_1..7) ou BRAVE_API_KEY dans .env");
  process.exit(1);
}

function loadKeyIndex() {
  try { return JSON.parse(readFileSync(STATE_FILE, "utf-8")).current || 0; } catch { return 0; }
}
function saveKeyIndex(i) {
  wfs(STATE_FILE, JSON.stringify({ current: i }), "utf-8");
}

let keyIndex = loadKeyIndex();

async function serperFetch(key, q) {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q, gl: "fr", hl: "fr", num: 10 }),
  });
  if (res.status === 402) return null;
  if (res.status === 400) {
    const body = await res.text();
    if (body.includes("credits")) return null;
    throw new Error(`Serper API 400: ${body.slice(0, 100)}`);
  }
  if (!res.ok) { const err = await res.text(); throw new Error(`Serper API ${res.status}: ${err.slice(0, 100)}`); }
  const data = await res.json();
  return { web: { results: (data.organic || []).map(r => ({ title: r.title, description: r.snippet, url: r.link })) } };
}

async function searchWeb(q) {
  if (SERPER_KEYS.length) {
    while (keyIndex < SERPER_KEYS.length) {
      const result = await serperFetch(SERPER_KEYS[keyIndex], q);
      if (result !== null) return result;
      console.warn(`⚠️  Clé ${keyIndex + 1}/${SERPER_KEYS.length} épuisée, passage à la suivante...`);
      keyIndex++;
      saveKeyIndex(keyIndex);
    }
    console.error("❌ Toutes les clés Serper sont épuisées.");
    process.exit(1);
  }

  // Fallback Brave
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", q);
  url.searchParams.set("count", 20);
  url.searchParams.set("country", "fr");
  url.searchParams.set("search_lang", "fr");
  url.searchParams.set("text_decorations", false);
  const res = await fetch(url.href, { headers: { "X-Subscription-Token": BRAVE_KEY, "Accept": "application/json" } });
  if (!res.ok) throw new Error(`Brave API ${res.status}: ${(await res.text()).slice(0, 100)}`);
  return res.json();
}

function extractGmails(text) {
  const found = text.match(/[a-zA-Z0-9._%+\-]+@gmail\.com/gi) || [];
  return [...new Set(found.map(e => e.toLowerCase()))];
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log(`\n📸 HARVEST — "${QUERY}" @ ${CITY}\n`);

  const queries = [
    `site:facebook.com "${QUERY}" "${CITY}" "@gmail.com"`,
    `site:facebook.com "${QUERY}" "${CITY}" gmail.com`,
    `site:facebook.com artisan "${QUERY}" "${CITY}" gmail`,
    `site:facebook.com "${QUERY}" "${CITY}" contact gmail`,
    `site:instagram.com "${QUERY}" "${CITY}" "@gmail.com"`,
  ];

  const results = [];
  const seen = new Set();
  let apiCalls = 0;

  for (const q of queries) {
    console.log(`🔍 ${q}`);
    try {
      const data = await searchWeb(q);
      apiCalls++;
      const items = data.web?.results || [];
      for (const item of items) {
        const text = `${item.title} ${item.description} ${item.url}`;
        for (const gmail of extractGmails(text)) {
          if (!seen.has(gmail)) {
            seen.add(gmail);
            const name = item.title.replace(/[•·\-–|(@].*$/, "").trim();
            results.push({ name, igUrl: item.url, email: gmail });
            console.log(`  ✅ ${name.slice(0, 35).padEnd(35)} ${gmail}`);
          }
        }
      }
      await sleep(500);
    } catch (e) {
      console.error(`  ❌ ${e.message}`);
    }
    await sleep(800);
  }

  console.log(`\n📊 ${apiCalls} appels API utilisés (clé ${keyIndex + 1})`);

  if (!results.length) { console.log("❌ Aucun gmail trouvé\n"); return; }

  const csv = [
    '"Nom","Instagram","Email"',
    ...results.map(r => [r.name, r.igUrl, r.email].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const filename = join(__dirname, `ig_leads_${QUERY}_${CITY}_${Date.now()}.csv`);
  writeFileSync(filename, "﻿" + csv, "utf-8");
  console.log(`✅ ${results.length} gmails → ${filename}\n`);
}

run().catch(console.error);
