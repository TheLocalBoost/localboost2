// harvest_all.js — tourne sur toutes les combinaisons secteur/ville jusqu'à épuisement SerpAPI
// Usage : node harvest_all.js

import "dotenv/config";
import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, appendFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_FILE  = join(__dirname, "harvest_all.log");
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Secteurs à fort rendement — artisans avec présence sociale + Gmail exposé
const SECTORS = [
  "coiffeur", "barbier", "plombier", "garagiste",
  "restaurant", "boulanger", "fleuriste", "serrurier",
];

// Grandes villes uniquement — masse critique de Facebook/Instagram/LeBonCoin
const CITIES = [
  "Lyon", "Marseille", "Toulouse", "Bordeaux", "Lille",
  "Nice", "Paris", "Rennes", "Strasbourg", "Montpellier",
  "Grenoble", "Nantes", "Rouen", "Perpignan", "Toulon",
];

function log(msg) {
  const line = `[${new Date().toISOString().slice(0, 19)}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + "\n", "utf-8");
}

// Shuffle pour varier les combinaisons
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function run() {
  log("🚀 HARVEST ALL — démarrage jusqu'à épuisement des crédits SerpAPI");
  log(`   ${SECTORS.length} secteurs × ${CITIES.length} villes = ${SECTORS.length * CITIES.length} combinaisons max\n`);

  let totalRuns = 0;
  let totalLeads = 0;

  const pairs = [];
  for (const city of shuffle(CITIES)) {
    for (const sector of shuffle(SECTORS)) {
      pairs.push({ sector, city });
    }
  }

  for (const { sector, city } of pairs) {
    log(`\n▶  ${sector} @ ${city}`);

    try {
      const output = execSync(
        `node scripts/outreach/scrape_serpapi.js "${sector}" "${city}" 2`,
        { cwd: join(__dirname, "../.."), encoding: "utf-8", timeout: 120_000 }
      );

      // Compter les leads trouvés dans la sortie  ("📊  N appels · N leads")
      const match = output.match(/·\s*(\d+)\s*leads?/);
      const found = match ? parseInt(match[1]) : 0;
      totalLeads += found;
      totalRuns++;

      log(`   ✅ ${found} leads  (total : ${totalLeads})`);

      // Détection épuisement dans la sortie
      if (output.includes("ALL_ENGINES_EXHAUSTED") || output.includes("invalide")) {
        log("💀 Tous les moteurs épuisés — arrêt.");
        break;
      }

      await sleep(2000);
    } catch (e) {
      const msg = (e.stdout || "") + (e.stderr || "") + (e.message || "");

      if (msg.includes("ALL_ENGINES_EXHAUSTED") || msg.includes("invalide") || msg.includes("401")) {
        log("💀 Tous les moteurs épuisés — arrêt.");
        break;
      }

      log(`   ⚠️  Erreur: ${msg.slice(0, 80)}`);
      await sleep(3000);
    }
  }

  log(`\n✅ TERMINÉ — ${totalRuns} runs · ${totalLeads} leads au total`);
  log(`   Fichiers CSV dans scripts/outreach/serpapi_*.csv`);
}

run().catch(e => { console.error("❌", e.message); process.exit(1); });
