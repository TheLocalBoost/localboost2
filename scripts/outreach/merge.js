// MERGE.JS – fusionne tous les CSV leads en un seul fichier propre
// Usage : node merge.js

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const files = readdirSync(__dirname).filter(f => f.match(/^(leads_|ig_|fb_).*\.csv$/));
console.log(`\n📂 ${files.length} fichiers CSV trouvés\n`);

const EXCLUDED_SECTORS = ["avocat", "notaire"];

const seen = new Set();
const rows = [];

for (const file of files) {
  const content = readFileSync(`${__dirname}/${file}`, "utf-8").replace(/^﻿/, "");
  const lines = content.trim().split("\n").slice(1);

  let added = 0;
  for (const line of lines) {
    const cols = line.match(/"([^"]*)"/g)?.map(v => v.slice(1,-1)) || [];
    if (!cols.length) continue;

    const isIG = file.startsWith("ig_") || file.startsWith("fb_");
    let name, phone, address, site, emails;

    if (isIG) {
      [name, site, emails] = cols;
      phone = ""; address = "";
    } else {
      [name, phone, address, site, emails] = cols;
    }

    if (!emails) continue;

    for (const email of emails.split("|").filter(Boolean)) {
      if (!seen.has(email)) {
        seen.add(email);
        const parts = file.replace(/^(leads_|ig_leads_|fb_leads_)/, "").split("_");
        const secteur = parts[0] || "";
        const ville = parts.slice(1, -1).join(" ") || "France";
        if (EXCLUDED_SECTORS.includes(secteur.toLowerCase())) continue;
        rows.push({ name, phone, address, site, email, secteur, ville });
        added++;
      }
    }
  }
  console.log(`  ${file.slice(0,50).padEnd(50)} +${added}`);
}

const csv = [
  '"Nom","Téléphone","Adresse","Site","Email","Secteur","Ville"',
  ...rows.map(r =>
    [r.name, r.phone, r.address, r.site, r.email, r.secteur, r.ville]
      .map(v => `"${String(v || "").replace(/"/g, '""')}"`)
      .join(",")
  ),
].join("\n");

const filename = `${__dirname}/ALL_LEADS_${Date.now()}.csv`;
writeFileSync(filename, "﻿" + csv, "utf-8");
console.log(`\n✅ ${rows.length} leads uniques → ${filename}\n`);
