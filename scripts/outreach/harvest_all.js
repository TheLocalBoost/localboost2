// harvest_all.js — tourne sur toutes les combinaisons secteur/ville jusqu'à épuisement SerpAPI
// Usage : node harvest_all.js
// Passe les combinaisons déjà scrapées (fichier serpapi_secteur_ville_*.csv existant)

import "dotenv/config";
import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, appendFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_FILE  = join(__dirname, "harvest_all.log");
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Secteurs à fort rendement — artisans avec présence sociale + Gmail exposé
// Priorité : manques identifiés (electricien/carreleur/peintre/opticien pas en grandes villes)
const SECTORS = [
  // Existants + fort panier
  "electricien", "plombier", "garagiste", "serrurier",
  // Fort volume Gmail
  "coiffeur", "barbier", "restaurant", "boulanger", "fleuriste",
  // Petites villes pas encore couvertes
  "carreleur", "peintre", "opticien",
  // Nouveaux secteurs
  "dentiste", "menuisier", "maçon", "jardinier",
];

// Toutes villes : grandes + moyennes
const CITIES = [
  // 15 grandes (déjà partiellement scrapées)
  "Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux",
  "Lille", "Nice", "Nantes", "Strasbourg", "Montpellier",
  "Grenoble", "Rennes", "Rouen", "Perpignan", "Toulon",
  // Moyennes villes (gap identifié)
  "Angers", "Brest", "Caen", "Dijon", "Limoges",
  "Metz", "Pau", "Tours", "Reims", "Nancy",
  "Saint-Étienne", "Le Havre", "Clermont-Ferrand", "Amiens", "Aix-en-Provence",
];

// Détecte les combinaisons déjà scrapées pour ne pas les refaire
function alreadyScraped(sector, city) {
  const prefix = `serpapi_${sector}_${city}_`;
  return readdirSync(__dirname).some(f => f.startsWith(prefix) && f.endsWith(".csv"));
}

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
  // Construire la liste des paires non encore scrapées
  const allPairs = [];
  for (const city of CITIES) {
    for (const sector of SECTORS) {
      allPairs.push({ sector, city });
    }
  }
  const pending = allPairs.filter(({ sector, city }) => !alreadyScraped(sector, city));
  const skipped = allPairs.length - pending.length;

  log("🚀 HARVEST ALL — démarrage jusqu'à épuisement des crédits SerpAPI");
  log(`   ${SECTORS.length} secteurs × ${CITIES.length} villes = ${allPairs.length} combinaisons`);
  log(`   ${skipped} déjà scrapées → ${pending.length} à faire\n`);

  let totalRuns = 0;
  let totalLeads = 0;

  const pairs = shuffle(pending);

  for (let i = 0; i < pairs.length; i++) {
    const { sector, city } = pairs[i];
    log(`\n▶  [${i+1}/${pairs.length}] ${sector} @ ${city}`);

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
  log(`\n   Prochain : node scripts/outreach/merge_serpapi.mjs → leads_new.csv`);
}

run().catch(e => { console.error("❌", e.message); process.exit(1); });
