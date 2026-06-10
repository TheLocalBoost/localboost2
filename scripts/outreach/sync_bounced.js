// sync_bounced.js — Synchronise bounced.csv depuis Supabase (email_status = 'bounced' ou 'unsubscribed')
// Usage : node scripts/outreach/sync_bounced.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BOUNCED_FILE = join(__dirname, "bounced.csv");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const existing = existsSync(BOUNCED_FILE)
    ? new Set(readFileSync(BOUNCED_FILE, "utf-8").trim().split("\n").map(e => e.toLowerCase().trim()).filter(Boolean))
    : new Set();

  const { data, error } = await supabase
    .from("leads")
    .select("email")
    .in("email_status", ["bounced", "unsubscribed"]);

  if (error) { console.error("❌ Supabase:", error.message); process.exit(1); }

  let added = 0;
  for (const row of data ?? []) {
    const email = row.email?.toLowerCase().trim();
    if (email && !existing.has(email)) {
      existing.add(email);
      added++;
    }
  }

  writeFileSync(BOUNCED_FILE, [...existing].join("\n") + "\n", "utf-8");
  console.log(`✅ bounced.csv — ${existing.size} entrées (${added} ajoutées depuis Supabase)`);
}

run().catch(console.error);
