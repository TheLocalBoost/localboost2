// Nettoyage + import Supabase
// Usage : node clean_and_import.js [--dry-run] [--export-only]

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN     = process.argv.includes("--dry-run");
const EXPORT_ONLY = process.argv.includes("--export-only");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Secteurs reconnus ──────────────────────────────────────────────────────
const VALID_SECTORS = new Set([
  "boulangerie","restaurant","pharmacie","garage","hotel","coiffeur",
  "fleuriste","plombier","electricien","dentiste","medecin","opticien",
  "tatouage","traiteur","coiffure","photographe","pizzeria","peintre",
  "artisan","serrurier","menuisier","kebab","jardinier","maçon",
  "carreleur","pressing","salon de coiffure",
]);

// ── Mots-clés qui trahissent un post ou une annonce, pas un établissement ──
const DIRTY_PATTERNS = [
  /recrutement/i, /recrute/i, /offre d.emploi/i, /poste à pourvoir/i,
  /fonds de commerce/i, /à vendre/i, /candidat/i, /\bCDI\b/, /\bCDD\b/,
  /greeting fellow/i, /applications are/i, /how to contact/i,
  /anyone who got/i, /it's time to go/i, /vendor spotlight/i,
  /calling all/i, /prennent le large/i, /ferme ses portes/i,
  /on recrute/i, /rejoignez.nous/i, /nous cherchons/i,
  /\bUrgent\b/i, /\bemploi\b/i, /\.\.\.$/,
  /^thanks\s/i, /^#\s*\*+/,
];

// ── Noms purement génériques (= juste le nom du secteur) ──────────────────
const GENERIC_NAMES = new Set([
  "boulangerie","la boulangerie","le boulanger","notre boulangerie",
  "restaurant","le restaurant","la brasserie","le bistrot",
  "pharmacie","la pharmacie","garage","coiffeur","fleuriste",
  "hotel","plombier","electricien","dentiste","medecin","opticien",
  "artisan","pressing","pizzeria","kebab",
]);

function isDirty(nom) {
  if (!nom || nom.trim().length < 3)         return true;   // vide ou trop court
  if (nom.length > 70)                        return true;   // trop long = post scrappé
  if (GENERIC_NAMES.has(nom.trim().toLowerCase())) return true;
  if (DIRTY_PATTERNS.some(p => p.test(nom))) return true;
  return false;
}

function normalizeName(nom) {
  // "MAISON HADDAD" → "Maison Haddad"  (si tout est en majuscules)
  const words = nom.trim().split(/\s+/);
  const allCaps = words.every(w => w === w.toUpperCase());
  if (!allCaps) return nom.trim();
  return words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function parseCSV(file) {
  const raw = readFileSync(join(__dirname, file), "utf-8").replace(/^﻿/, "").trim();
  const lines = raw.split("\n");
  const headers = lines[0].match(/"([^"]*)"/g).map(v => v.slice(1, -1));
  return lines.slice(1).map(line => {
    const cols = line.match(/"([^"]*)"/g)?.map(v => v.slice(1, -1)) || [];
    return Object.fromEntries(headers.map((h, i) => [h, cols[i] || ""]));
  }).filter(r => r.Email && r.Email.includes("@"));
}

function findLatest() {
  const files = readdirSync(__dirname).filter(f => f.startsWith("ALL_LEADS_")).sort();
  return files[files.length - 1];
}

async function run() {
  const file = findLatest();
  if (!file) { console.error("❌ Aucun fichier ALL_LEADS_*.csv trouvé"); process.exit(1); }

  console.log(`\n📂 Fichier : ${file}`);
  const rows = parseCSV(file);
  console.log(`📋 Leads bruts : ${rows.length}`);

  const rejected = [];
  const clean = [];

  for (const r of rows) {
    const nom     = r["Nom"]      || "";
    const secteur = r["Secteur"]  || "";
    const ville   = r["Ville"]    || "";

    const reason =
      !VALID_SECTORS.has(secteur.toLowerCase()) ? `secteur inconnu (${secteur})` :
      ville === "France"                         ? "ville=France"                :
      isDirty(nom)                               ? "nom invalide"                :
      null;

    if (reason) {
      rejected.push({ ...r, _raison: reason });
    } else {
      clean.push({ ...r, Nom: normalizeName(nom) });
    }
  }

  console.log(`\n✅ Leads propres   : ${clean.length}`);
  console.log(`❌ Leads rejetés   : ${rejected.length}`);

  // Breakdown rejet par raison
  const byReason = {};
  rejected.forEach(r => { byReason[r._raison] = (byReason[r._raison] || 0) + 1; });
  Object.entries(byReason).sort((a,b) => b[1]-a[1]).forEach(([r,n]) => {
    console.log(`   · ${r} : ${n}`);
  });

  // Breakdown clean par secteur
  console.log("\n📊 Leads propres par secteur :");
  const bySector = {};
  clean.forEach(r => { bySector[r.Secteur] = (bySector[r.Secteur] || 0) + 1; });
  Object.entries(bySector).sort((a,b) => b[1]-a[1]).forEach(([s,n]) => {
    console.log(`   · ${s} : ${n}`);
  });

  // Export CSV propre pour vérification
  const cleanCsv = [
    '"Nom","Email","Secteur","Ville"',
    ...clean.map(r => `"${r.Nom}","${r.Email}","${r.Secteur}","${r.Ville}"`),
  ].join("\n");
  const outFile = join(__dirname, "leads_clean.csv");
  writeFileSync(outFile, cleanCsv, "utf-8");
  console.log(`\n💾 CSV propre exporté → leads_clean.csv`);

  if (DRY_RUN || EXPORT_ONLY) {
    console.log("\n⚠️  Mode dry-run / export-only — aucun import Supabase.");
    return;
  }

  // ── Import Supabase ────────────────────────────────────────────────────
  console.log("\n🚀 Import Supabase...");
  const BATCH = 500;
  let inserted = 0;
  let skipped  = 0;

  for (let i = 0; i < clean.length; i += BATCH) {
    const batch = clean.slice(i, i + BATCH).map(r => ({
      nom:     r["Nom"],
      email:   r["Email"].toLowerCase().trim(),
      secteur: r["Secteur"].toLowerCase().trim(),
      ville:   r["Ville"],
      phone:   r["Téléphone"] || "",
      address: r["Adresse"]   || "",
      site:    r["Site"]      || "",
    }));

    const { error, data } = await supabase
      .from("leads")
      .upsert(batch, { onConflict: "email", ignoreDuplicates: true });

    if (error) {
      console.error(`\n  ❌ Batch ${i} :`, error.message);
    } else {
      inserted += batch.length;
      process.stdout.write(`\r  ✅ ${inserted}/${clean.length} traités...`);
    }
  }

  console.log(`\n\n✅ Import terminé — ${inserted} leads dans Supabase`);
}

run().catch(console.error);
