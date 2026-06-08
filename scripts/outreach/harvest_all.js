// harvest_all.js — deux sources en parallèle :
//   1. scrape_serpapi.js  → emails depuis réseaux sociaux / Google (Serper/CSE/Brave)
//   2. scrape_places.mjs  → emails depuis sites web, filtrés sur fiches Google non optimisées
// Usage : node harvest_all.js [--places-only] [--serper-only]

import "dotenv/config";
import { execSync } from "child_process";
import { existsSync, appendFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname    = dirname(fileURLToPath(import.meta.url));
const LOG_FILE     = join(__dirname, "harvest_all.log");
const sleep        = ms => new Promise(r => setTimeout(r, ms));
const PLACES_ONLY  = process.argv.includes("--places-only");
const SERPER_ONLY  = process.argv.includes("--serper-only");
const SCORE_MAX    = 85; // fiches avec score < 85 = cibles LocalBoost

const SECTORS = [
  "electricien", "plombier", "garagiste", "serrurier",
  "coiffeur", "barbier", "restaurant", "boulanger", "fleuriste",
  "carreleur", "peintre", "opticien",
  "dentiste", "menuisier", "jardinier",
];

const CITIES = [
  // Grandes métropoles
  "Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux",
  "Lille", "Nice", "Nantes", "Strasbourg", "Montpellier",
  "Grenoble", "Rennes", "Rouen", "Perpignan", "Toulon",
  // Villes moyennes
  "Angers", "Brest", "Caen", "Dijon", "Limoges",
  "Metz", "Pau", "Tours", "Reims", "Nancy",
  "Saint-Étienne", "Le Havre", "Clermont-Ferrand", "Amiens", "Aix-en-Provence",
  // Villes 100k-200k
  "Nîmes", "Villeurbanne", "Orléans", "Mulhouse", "Besançon",
  "La Rochelle", "Avignon", "Poitiers", "Mérignac", "Pessac",
  "Dunkerque", "Annecy", "Chambéry", "Bayonne", "Valence",
  "Troyes", "Cannes", "Antibes", "Colmar", "Saint-Denis",
  // Villes 50k-100k
  "Boulogne-sur-Mer", "Calais", "Arles", "Quimper", "Vannes",
  "Saint-Brieuc", "Lorient", "Albi", "Tarbes", "Agen",
  "Périgueux", "Brive", "Angoulême", "Niort", "Châteauroux",
  "Évreux", "Chartres", "Laval", "Saint-Nazaire", "Belfort",
  "Épinal", "Charleville-Mézières", "Cherbourg", "Béziers", "Fréjus",
  "Hyères", "Ajaccio", "Bastia", "Thionville", "Mâcon",
  // Banlieues Paris (sous-représentées)
  "Versailles", "Créteil", "Montreuil", "Aubervilliers",
  "Vitry-sur-Seine", "Champigny-sur-Marne", "Boulogne-Billancourt",
  "Rueil-Malmaison", "Argenteuil", "Cergy", "Évry",
  // Côte d'Azur / PACA
  "Toulon", "Aix-en-Provence", "Arles", "Martigues", "Aubagne",
  // DOM
  "Fort-de-France", "Pointe-à-Pitre", "Saint-Denis de la Réunion",
];

function alreadyScrapedSync(sector, city) {
  const prefix = `serpapi_${sector}_${city}_`;
  return readdirSync(__dirname).some(f => f.startsWith(prefix) && f.endsWith(".csv"));
}

function log(msg) {
  const line = `[${new Date().toISOString().slice(0, 19)}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + "\n", "utf-8");
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function runSerper(pairs) {
  log("\n📡 SOURCE 1 — Serper / Google CSE / Brave (emails réseaux sociaux)");
  let totalRuns = 0, totalLeads = 0;

  for (let i = 0; i < pairs.length; i++) {
    const { sector, city } = pairs[i];
    log(`\n▶  [${i + 1}/${pairs.length}] ${sector} @ ${city}`);

    try {
      const output = execSync(
        `node scripts/outreach/scrape_serpapi.js "${sector}" "${city}" 2`,
        { cwd: join(__dirname, "../.."), encoding: "utf-8", timeout: 120_000 }
      );
      const match = output.match(/·\s*(\d+)\s*leads?/);
      const found = match ? parseInt(match[1]) : 0;
      totalLeads += found; totalRuns++;
      log(`   ✅ ${found} leads  (total : ${totalLeads})`);
      if (output.includes("ALL_ENGINES_EXHAUSTED") || output.includes("invalide")) {
        log("💀 Moteurs épuisés — arrêt Serper."); return { totalRuns, totalLeads, exhausted: true };
      }
      await sleep(2000);
    } catch (e) {
      const msg = (e.stdout || "") + (e.stderr || "") + (e.message || "");
      if (msg.includes("ALL_ENGINES_EXHAUSTED") || msg.includes("invalide") || msg.includes("401")) {
        log("💀 Moteurs épuisés — arrêt Serper."); return { totalRuns, totalLeads, exhausted: true };
      }
      log(`   ⚠️  Erreur: ${msg.slice(0, 80)}`);
      await sleep(3000);
    }
  }
  return { totalRuns, totalLeads, exhausted: false };
}

async function runPlaces(pairs) {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    log("\n⚠️  GOOGLE_PLACES_API_KEY absente — source Places ignorée.");
    return { totalRuns: 0, totalLeads: 0 };
  }

  log(`\n🗺️  SOURCE 2 — Google Places + sites web (score < ${SCORE_MAX})`);
  let totalRuns = 0, totalLeads = 0;

  for (let i = 0; i < pairs.length; i++) {
    const { sector, city } = pairs[i];
    log(`\n▶  [${i + 1}/${pairs.length}] ${sector} @ ${city}`);

    try {
      const output = execSync(
        `node scripts/outreach/scrape_places.mjs "${sector}" "${city}" --score-max=${SCORE_MAX}`,
        { cwd: join(__dirname, "../.."), encoding: "utf-8", timeout: 300_000 }
      );
      const match = output.match(/(\d+) leads retenus/);
      const found = match ? parseInt(match[1]) : 0;
      totalLeads += found; totalRuns++;
      log(`   ✅ ${found} leads  (total : ${totalLeads})`);
      await sleep(1000);
    } catch (e) {
      log(`   ⚠️  Erreur Places: ${(e.message || "").slice(0, 80)}`);
      await sleep(2000);
    }
  }
  return { totalRuns, totalLeads };
}

async function run() {
  const allPairs = [];
  for (const city of CITIES) {
    for (const sector of SECTORS) {
      allPairs.push({ sector, city });
    }
  }

  const pendingSerper = allPairs.filter(({ sector, city }) => !alreadyScrapedSync(sector, city));
  // Places tourne toujours sur toutes les combos (filtre par score, pas par CSV existant)
  const pendingPlaces = shuffle([...allPairs]);

  log("🚀 HARVEST ALL");
  log(`   ${SECTORS.length} secteurs × ${CITIES.length} villes = ${allPairs.length} combinaisons`);
  if (!PLACES_ONLY) log(`   Serper : ${pendingSerper.length} à faire (${allPairs.length - pendingSerper.length} déjà scrapées)`);
  if (!SERPER_ONLY) log(`   Places : ${pendingPlaces.length} combinaisons (filtre score < ${SCORE_MAX})`);

  // ── Source 1 : Serper ─────────────────────────────────────────────────────
  if (!PLACES_ONLY && pendingSerper.length) {
    const { totalRuns, totalLeads } = await runSerper(shuffle(pendingSerper));
    log(`\n   Serper terminé — ${totalRuns} runs · ${totalLeads} leads`);
  }

  // ── Source 2 : Places + sites web ────────────────────────────────────────
  if (!SERPER_ONLY) {
    const { totalRuns, totalLeads } = await runPlaces(pendingPlaces);
    log(`\n   Places terminé — ${totalRuns} runs · ${totalLeads} leads`);
  }

  log(`\n✅ TERMINÉ`);
  log(`   Prochain : node scripts/outreach/merge_serpapi.mjs → leads_new.csv`);
}

run().catch(e => { console.error("❌", e.message); process.exit(1); });
