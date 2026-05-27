// Import ALL_LEADS CSV → Supabase
// Usage : node import_to_supabase.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function findLatest() {
  const files = readdirSync(__dirname).filter(f => f.startsWith("ALL_LEADS_")).sort();
  return files[files.length - 1];
}

function parseCSV(file) {
  const lines = readFileSync(join(__dirname, file), "utf-8").replace(/^﻿/, "").trim().split("\n");
  const headers = lines[0].match(/"([^"]*)"/g).map(v => v.slice(1,-1));
  return lines.slice(1).map(line => {
    const cols = line.match(/"([^"]*)"/g)?.map(v => v.slice(1,-1)) || [];
    return Object.fromEntries(headers.map((h, i) => [h, cols[i] || ""]));
  }).filter(r => r.Email);
}

async function run() {
  const file = findLatest();
  if (!file) { console.error("❌ Aucun fichier ALL_LEADS_*.csv trouvé"); process.exit(1); }

  console.log(`\n📂 Import de ${file}`);
  const rows = parseCSV(file);
  console.log(`${rows.length} leads à importer\n`);

  const BATCH = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH).map(r => ({
      nom:     r["Nom"]        || "",
      email:   r["Email"].toLowerCase(),
      secteur: r["Secteur"]   || "",
      ville:   r["Ville"]     || "",
      phone:   r["Téléphone"] || "",
      address: r["Adresse"]   || "",
      site:    r["Site"]      || "",
    }));

    const { error } = await supabase
      .from("leads")
      .upsert(batch, { onConflict: "email", ignoreDuplicates: true });

    if (error) { console.error(`  ❌ Batch ${i}:`, error.message); }
    else {
      inserted += batch.length;
      process.stdout.write(`\r  ✅ ${inserted}/${rows.length} importés...`);
    }
  }

  console.log(`\n\n✅ Import terminé — ${inserted} leads dans Supabase`);
}

run().catch(console.error);
