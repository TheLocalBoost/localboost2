// merge_serpapi.mjs — Merge tous les serpapi_*.csv → leads_new.csv prêt pour send.js
// Usage : node merge_serpapi.mjs [--dry-run] [--verify]
//
// Ce script :
//   1. Lit tous les serpapi_*.csv du répertoire
//   2. Infère le secteur depuis le nom de fichier
//   3. Applique les filtres email + nom + bounced + déjà envoyés
//   4. Déduplique
//   5. [--verify] Vérifie les emails domaines custom via Disify (MX check)
//   6. Écrit leads_new.csv au format attendu par send.js

import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { resolveMx } from "dns/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const VERIFY = process.argv.includes("--verify");

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN   = process.argv.includes("--dry-run");

// ── Domaines toujours valides — pas besoin de vérifier ───────────────────────
const SAFE_DOMAINS = new Set([
  "gmail.com","yahoo.fr","yahoo.com","hotmail.fr","hotmail.com","outlook.fr",
  "outlook.com","live.fr","live.com","orange.fr","sfr.fr","sfr.net",
  "laposte.net","free.fr","wanadoo.fr","icloud.com","me.com","protonmail.com",
  "proton.me","gmx.fr","gmx.com","ymail.com","bbox.fr","numericable.fr",
]);

// Vérifie via MX DNS que le domaine reçoit des emails (pour domaines custom)
const mxCache = new Map();
async function hasMX(domain) {
  if (SAFE_DOMAINS.has(domain)) return true;
  if (mxCache.has(domain)) return mxCache.get(domain);
  try {
    const records = await resolveMx(domain);
    const ok = records && records.length > 0;
    mxCache.set(domain, ok);
    return ok;
  } catch {
    mxCache.set(domain, false);
    return false;
  }
}

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
const GENERIC_LOCAL = /^(contact|info|admin|webmaster|support|hello|service|mairie|secretariat|commercial|direction|recrutement|no-reply|noreply|comptabilite|gestionnaire|accueil|reception|communication|pro|presse|rh|facturation|reservation|commande|vente|achats|logistique|sav|equipe|team|boutique|news|newsletter|devis|magasin|bonjour|demande|orders|sales|billing|postmaster|abuse|spam|test|demo|exemple|example|user|username|email|mail|nul|null|void|placeholder)$/i;
const VILLES_LOCAL  = /^(paris|lyon|marseille|toulouse|nantes|bordeaux|lille|nice|rennes|grenoble|strasbourg|montpellier|tours|nimes|vichy|dijon|angers|brest|metz|caen|reims|nancy|pau|rouen|toulon|clermont|amiens|limoges|boulogne|macon|albi|laval|beziers|dax|blois|tulle|colmar|thionville|perpignan)$/i;

// Domaines placeholder ou suspects — souvent issus de templates de sites web
const FAKE_DOMAINS = /^(example\.com|exemple\.com|mail\.com|yoursite\.|mysite\.|mywebsite|yourwebsite|votresite|domain\.com|test\.com|email\.com|site\.com|website\.com|company\.com)$/i;

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
  // Domaines institutionnels ou placeholder
  if (/\.(ac-[a-z]+|gouv|edu)\.fr$/.test(domain)) return false;
  if (FAKE_DOMAINS.test(domain)) return false;
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
if (VERIFY) console.log("🔍 Mode --verify actif : vérification MX pour domaines custom\n");

const seen   = new Set();
const leads  = [];
let rawTotal = 0;

const stats = { email: 0, nom: 0, sent: 0, bounced: 0, dup: 0, noMX: 0 };

// Phase 1 — filtres synchrones
const candidates = [];
for (const filename of allFiles) {
  const rows = parseSerpapi(join(__dirname, filename), filename);
  rawTotal += rows.length;

  for (const { nom, email, ville, secteur } of rows) {
    const emailLow = email.toLowerCase().trim();
    if (!isValidEmail(email))      { stats.email++;   continue; }
    if (!isValidLead(nom, ville))  { stats.nom++;     continue; }
    if (alreadySent.has(emailLow)) { stats.sent++;    continue; }
    if (bounced.has(emailLow))     { stats.bounced++; continue; }
    if (seen.has(emailLow))        { stats.dup++;     continue; }
    seen.add(emailLow);
    candidates.push({ nom: normalizeName(nom), email: emailLow, ville, secteur });
  }
}

// Phase 2 — vérification MX (uniquement avec --verify, et seulement domaines custom)
if (VERIFY) {
  const customDomains = [...new Set(
    candidates
      .map(r => r.email.split("@")[1])
      .filter(d => d && !SAFE_DOMAINS.has(d))
  )];
  if (customDomains.length) {
    process.stdout.write(`\n🔎 Vérification MX : ${customDomains.length} domaine(s) custom...`);
    // Vérifier en parallèle par batch de 20
    for (let i = 0; i < customDomains.length; i += 20) {
      await Promise.all(customDomains.slice(i, i + 20).map(d => hasMX(d)));
      process.stdout.write(`\r🔎 MX vérifié : ${Math.min(i + 20, customDomains.length)}/${customDomains.length}   `);
    }
    console.log();
  }
}

for (const r of candidates) {
  if (VERIFY) {
    const domain = r.email.split("@")[1];
    if (!SAFE_DOMAINS.has(domain) && !mxCache.get(domain)) {
      stats.noMX++;
      continue;
    }
  }
  leads.push(r);
}

console.log(`\n📊 ${rawTotal} leads bruts dans les CSV serpapi`);
console.log(`   ✗ email invalide    : ${stats.email}`);
console.log(`   ✗ nom invalide      : ${stats.nom}`);
console.log(`   ✗ déjà envoyé       : ${stats.sent}`);
console.log(`   ✗ bounced           : ${stats.bounced}`);
console.log(`   ✗ doublon interne   : ${stats.dup}`);
if (VERIFY) console.log(`   ✗ domaine sans MX   : ${stats.noMX}`);
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
