// merge_serpapi.mjs — Merge tous les serpapi_*.csv → leads_new.csv prêt pour send.js
// Usage : node merge_serpapi.mjs [--dry-run]
//
// Ce script :
//   1. Lit tous les serpapi_*.csv du répertoire
//   2. Infère le secteur depuis le nom de fichier
//   3. Applique les filtres email + nom + bounced + déjà envoyés
//   4. Déduplique
//   5. Sort par secteur/ville
//   6. Écrit leads_new.csv au format attendu par send.js

import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN   = process.argv.includes("--dry-run");

// ── Charger sent + bounced ───────────────────────────────────────────────────
function loadSet(filename) {
  const path = join(__dirname, filename);
  if (!existsSync(path)) return new Set();
  return new Set(
    readFileSync(path, "utf-8").trim().split("\n").map(e => e.trim().toLowerCase()).filter(Boolean)
  );
}

const alreadySent = loadSet("sent.csv");
const bounced     = loadSet("bounced.csv");
console.log(`\n📬 ${alreadySent.size} déjà envoyés, ${bounced.size} bounced`);

// ── Filtres email ────────────────────────────────────────────────────────────
const GENERIC_LOCAL = /^(contact|info|admin|webmaster|support|hello|service|mairie|secretariat|commercial|direction|recrutement|no-reply|noreply|comptabilite|gestionnaire|accueil|reception|communication|pro|presse|rh|facturation|reservation|commande|vente|achats|logistique|sav|equipe|team|boutique|news|newsletter|devis|magasin|bonjour|demande)$/i;
const VILLES_LOCAL  = /^(paris|lyon|marseille|toulouse|nantes|bordeaux|lille|nice|rennes|grenoble|strasbourg|montpellier|tours|nimes|vichy|dijon|angers|brest|metz|caen|reims|nancy|pau|rouen|toulon|clermont|amiens|limoges|boulogne|macon|albi|laval|beziers|dax|blois|tulle|colmar|thionville|perpignan)$/i;

function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const e = email.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._%+\-]*[a-z0-9]@[a-z0-9][a-z0-9.\-]*\.[a-z]{2,}$/.test(e)) return false;
  if (e.includes("..")) return false;
  const [local, domain] = e.split("@");
  if (local.startsWith("www.") || local.startsWith("-")) return false;
  if (local.length <= 3) return false;
  if (/^\d+$/.test(local)) return false;
  if (/\.(com|fr|net|org|eu|io|co)$/.test(local)) return false;
  if (GENERIC_LOCAL.test(local)) return false;
  if (VILLES_LOCAL.test(local)) return false;
  // Domaines institutionnels
  if (/\.(ac-[a-z]+|gouv|edu)\.fr$/.test(domain)) return false;
  return true;
}

// ── Filtres nom ──────────────────────────────────────────────────────────────
const SCRAPED_NAMES = /^(offre|poste de|recherche|annonce|page |résult|nous rech|contact |electrici|plombier |coiffeur |barbier |fleuriste |boulanger |serrurier |garagiste |restaurant |peintre |carreleur |opticien |pharmacie )/i;
const DIRTY_PATTERNS = [
  /recrutement/i, /recrute/i, /offre d.emploi/i, /poste à pourvoir/i,
  /fonds de commerce/i, /à vendre/i, /\bCDI\b/, /\bCDD\b/,
  /ferme ses portes/i, /on recrute/i, /rejoignez.nous/i, /nous cherchons/i,
  /\bUrgent\b/i, /instagram|facebook|twitter|www\.|https?:/i,
];
const FAUX_VILLES = new Set([
  "france","île-de-france","occitanie","auvergne","bretagne","normandie",
  "nouvelle-aquitaine","bourgogne","centre-val de loire","grand est",
  "hauts-de-france","pays de la loire","provence-alpes","paca","corse",
  "réunion","martinique","guadeloupe","guyane","mayotte",
]);

function isValidLead(nom, ville) {
  if (!nom || nom.length < 4 || nom.length > 70) return false;
  if (nom.split(" ").length > 8) return false;
  if (/[<>{}\[\]@#]/.test(nom)) return false;
  if (/\d{5,}/.test(nom)) return false;
  if (SCRAPED_NAMES.test(nom)) return false;
  if (DIRTY_PATTERNS.some(p => p.test(nom))) return false;
  if (/^\d{2,3}$/.test(nom)) return false;
  if (/ à | en | sur | de /i.test(nom) && nom.split(" ").length <= 4) return false;
  if (!ville || FAUX_VILLES.has(ville.toLowerCase())) return false;
  if (/^\d{2,3}$/.test(ville.trim())) return false;
  return true;
}

function normalizeName(nom) {
  const words = nom.trim().split(/\s+/);
  const allCaps = words.length > 1 && words.every(w => w === w.toUpperCase());
  if (!allCaps) return nom.trim();
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

// ── Inférer le secteur depuis le nom de fichier ──────────────────────────────
// serpapi_{secteur}_{ville}_{date}.csv
function sectorFromFilename(filename) {
  const m = filename.match(/^serpapi_([^_]+)_/);
  return m ? m[1] : "artisan";
}

function villeFromFilename(filename) {
  // serpapi_secteur_Ville_date.csv — Ville peut avoir plusieurs mots
  const m = filename.match(/^serpapi_[^_]+_(.+)_\d{4}-\d{2}-\d{2}\.csv$/);
  return m ? m[1].replace(/_/g, " ") : "";
}

// ── Lire un CSV serpapi ──────────────────────────────────────────────────────
function parseSerpapi(filepath, filename) {
  const content = readFileSync(filepath, "utf-8").replace(/^﻿/, "").trim();
  const lines   = content.split("\n").slice(1); // skip header
  const secteur = sectorFromFilename(filename);
  const filleVille = villeFromFilename(filename);

  return lines.flatMap(line => {
    const cols = line.match(/"([^"]*)"/g)?.map(v => v.slice(1, -1)) ?? [];
    if (cols.length < 2) return [];
    const [nom, email, ville] = cols;
    return [{ nom: nom || "", email: email || "", ville: ville || filleVille, secteur }];
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
const allFiles = readdirSync(__dirname)
  .filter(f => f.startsWith("serpapi_") && f.endsWith(".csv"))
  .sort();

console.log(`\n📂 ${allFiles.length} fichiers serpapi trouvés`);

const seen   = new Set();
const leads  = [];
let rawTotal = 0;

// Stats de rejet
const stats = { email: 0, nom: 0, sent: 0, bounced: 0, dup: 0 };

for (const filename of allFiles) {
  const rows = parseSerpapi(join(__dirname, filename), filename);
  rawTotal += rows.length;

  for (const { nom, email, ville, secteur } of rows) {
    const emailLow = email.toLowerCase().trim();
    if (!isValidEmail(email))              { stats.email++;   continue; }
    if (!isValidLead(nom, ville))          { stats.nom++;     continue; }
    if (alreadySent.has(emailLow))         { stats.sent++;    continue; }
    if (bounced.has(emailLow))             { stats.bounced++; continue; }
    if (seen.has(emailLow))                { stats.dup++;     continue; }
    seen.add(emailLow);
    leads.push({ nom: normalizeName(nom), email: emailLow, ville, secteur });
  }
}

console.log(`\n📊 ${rawTotal} leads bruts dans les CSV serpapi`);
console.log(`   ✗ email invalide    : ${stats.email}`);
console.log(`   ✗ nom invalide      : ${stats.nom}`);
console.log(`   ✗ déjà envoyé       : ${stats.sent}`);
console.log(`   ✗ bounced           : ${stats.bounced}`);
console.log(`   ✗ doublon interne   : ${stats.dup}`);
console.log(`\n✅ Leads exploitables  : ${leads.length}`);

// Répartition par secteur
console.log("\n📈 Par secteur :");
const bySector = {};
leads.forEach(r => { bySector[r.secteur] = (bySector[r.secteur] || 0) + 1; });
Object.entries(bySector).sort((a, b) => b[1] - a[1])
  .forEach(([s, n]) => console.log(`   ${s.padEnd(16)} ${n}`));

// Répartition par ville (top 10)
const byCity = {};
leads.forEach(r => { byCity[r.ville] = (byCity[r.ville] || 0) + 1; });
console.log("\n🗺️  Top villes :");
Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 10)
  .forEach(([v, n]) => console.log(`   ${v.padEnd(18)} ${n}`));

if (DRY_RUN) {
  console.log("\n⚠️  --dry-run : aucun fichier écrit.\n");
  process.exit(0);
}

// ── Écriture leads_new.csv (format send.js) ──────────────────────────────────
// Colonnes : "Nom","Email","Ville","Secteur","Score","AppelsPerdus"
// Score et AppelsPerdus laissés vides — send.js les gère comme null (ok)
const csv = [
  '"Nom","Email","Ville","Secteur","Score","AppelsPerdus"',
  ...leads.map(r =>
    `"${r.nom.replace(/"/g, '""')}","${r.email}","${r.ville}","${r.secteur}","",""`
  ),
].join("\n");

const outPath = join(__dirname, "leads_new.csv");
writeFileSync(outPath, "﻿" + csv, "utf-8");
console.log(`\n💾 leads_new.csv écrit — ${leads.length} leads prêts\n`);
console.log(`   Pour envoyer : cp scripts/outreach/leads_new.csv scripts/outreach/leads_ready.csv`);
console.log(`   Puis         : node scripts/outreach/send.js 100\n`);
