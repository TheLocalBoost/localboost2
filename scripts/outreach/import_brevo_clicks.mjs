// Importe les clics Brevo existants dans Supabase email_clicks
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const sb  = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const KEY = process.env.BREVO_API_KEY;

let offset   = 0;
let total    = 0;
let inserted = 0;
let skipped  = 0;

while (true) {
  const url = `https://api.brevo.com/v3/smtp/statistics/events?event=clicks&limit=100&offset=${offset}&startDate=2026-05-29&endDate=2026-06-07`;
  const res = await fetch(url, { headers: { "api-key": KEY, Accept: "application/json" } });
  if (!res.ok) { console.log("Erreur Brevo:", res.status, await res.text()); break; }
  const d      = await res.json();
  const events = d.events ?? [];
  console.log(`offset=${offset} : ${events.length} events`);
  if (!events.length) break;

  for (const ev of events) {
    const link  = ev.link ?? "";
    const email = (ev.email ?? "").toLowerCase().trim();

    // Extraire le variant_id depuis le lien
    const m = link.match(/[?&]vid=(\d+)/)
           ?? link.match(/utm_campaign=v(\d+)/)
           ?? link.match(/utm_campaign%3Dv(\d+)/);
    if (!m) { skipped++; continue; }

    const variantId = parseInt(m[1]);
    const clickedAt = ev.date ?? new Date().toISOString();

    // Résoudre lead_id depuis l'email (uniquement si id est un entier)
    let leadId = null;
    if (email) {
      const { data: lead } = await sb.from("leads").select("id").eq("email", email).single();
      const rawId = lead?.id;
      leadId = (typeof rawId === "number" || (typeof rawId === "string" && /^\d+$/.test(rawId)))
        ? parseInt(rawId) : null;
    }

    const { error } = await sb.from("email_clicks").insert({
      variant_id: variantId,
      clicked_at: clickedAt,
      lead_id:    leadId,
    });
    if (error) { console.log("  Erreur insert:", error.message); }
    else { inserted++; console.log(`  ✅ v${variantId} | ${email} | lead=${leadId ?? "?"}`); }

    total++;
  }

  offset += events.length;
  if (events.length < 100) break;
}

console.log(`\n✅ ${total} clics Brevo traités → ${inserted} insérés, ${skipped} ignorés (pas de vid)`);
