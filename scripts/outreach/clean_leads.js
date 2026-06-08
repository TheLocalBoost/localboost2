// clean_leads.js — tri des leads serpapi pour éviter les hard bounces
// Usage : node clean_leads.js
// Passes : (1) heuristiques email + nom + domaine  (2) MX DNS  (3) SMTP RCPT TO (domaines custom)

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolveMx } from "dns/promises";
import { createConnection } from "net";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Charger le ALL_LEADS le plus récent ──────────────────────────
const files = readdirSync(__dirname)
  .filter(f => f.startsWith("ALL_LEADS_serpapi") && f.endsWith(".csv"))
  .sort();

if (!files.length) {
  console.error("❌ Aucun fichier ALL_LEADS_serpapi*.csv trouvé");
  process.exit(1);
}

const INPUT = join(__dirname, files[files.length - 1]);
console.log(`\n📂 Source : ${files[files.length - 1]}\n`);

// ── Domaines email personnels — MX toujours valide ───────────────
const SAFE_DOMAINS = new Set([
  "gmail.com", "yahoo.fr", "yahoo.com", "hotmail.fr", "hotmail.com",
  "outlook.fr", "outlook.com", "live.fr", "live.com", "msn.com",
  "orange.fr", "sfr.fr", "sfr.net", "laposte.net", "free.fr",
  "wanadoo.fr", "neuf.fr", "bbox.fr", "numericable.fr",
  "icloud.com", "me.com", "mac.com", "protonmail.com", "proton.me",
  "pm.me", "tutanota.com", "gmx.fr", "gmx.com", "ymail.com",
]);

// ── Domaines à bloquer (non-artisans, institutions) ──────────────
const BLOCKED_DOMAINS = [
  /\.ac-[a-z]+\.fr$/, /\.edu\.fr$/, /\.gouv\.fr$/,
  /^(mairie|commune|ville|region|departement)\./,
  /boulanger\.com$/, /leroy-merlin\.fr$/, /fnac\.com$/,
  /son-video\.com$/, /darty\.com$/, /leclerc\.fr$/,
  /\.ac\.fr$/, /academie-/,
];

// ── Filtres sur le nom ───────────────────────────────────────────
const BAD_NAME_RE = [
  /^#/,
  /^Nom$/i,
  /^accueil$/i,
  /newsletter/i,
  /livret\s+(d'|de\s)/i,
  /\barchives\b/i,
  /^forum\b/i,
  /conseil\s+(paroissial|municipal|régional|général|syndical)/i,
  /associationsyndical/i,
  /syndicat|fédération|confédération/i,
  /\bgreta\b/i,
  /formation\s+bac\s+pro/i,
  /mentions?\s+légales/i,
  /partenaire\s+\w/i,
  /zoom sur notre/i,
  /à l'occasion/i,
  /sessions? de formation/i,
  /reel by /i,
  /permanence\s+\d{4}/i,
  /budget qui garde/i,
  /nord\s+sommeil/i,
  /livret\s+d'accueil/i,
  /union\s+locale/i,
  /\bcampagne\b.*\belection/i,
  /^sailly-/i,
  /^magasin\./i,
  /hegel music/i,
  /^(annuaire|bottin|pages?[\s-]jaunes?)/i,
  // Titres de pages / articles — pas des noms d'entreprise
  /\+\s*\d+\s*(carreleurs?|coiffeurs?|électriciens?|plombiers?|artisans?|vérifiés?)/i,
  /\.{2,}|…/,
  /^nous\s+contacter$/i,
  /^commerces?\s*(,|et)\s*services?/i,
  /^les\s+(artisans?|professionnels?|carreleurs?|coiffeurs?|électriciens?|plombiers?|barbiers?|boulangers?)\b/i,
  /^(coiffeur|carreleur|électricien|plombier|barbier|boulanger|fleuriste|garagiste|menuisier|peintre|jardinier|opticien|dentiste)\s+à\s+/i,
  /^réseau\s+/i,
  /\bannuaire\b/i,
  /\boffre\s+d'emploi\b/i,
  /^demande\s+de\s+devis/i,
  /^(bonjour|salut)\s+/i,
  /^profil\s+de\s+/i,
];

function isCleanEmail(email) {
  const e = email.trim().toLowerCase();
  const [local, domain] = e.split("@");
  if (!local || !domain) return false;
  // Double extension
  if (/\.(com|fr|net|org)\.(com|fr|net|org)$/.test(e)) return false;
  if (e.includes("..")) return false;
  if (local.length <= 3) return false;
  if (/^\d+$/.test(local)) return false;
  if (local.startsWith("www.") || local.startsWith("-")) return false;
  // Local contient une extension — URL collée
  if (/\.(com|fr|net|org|eu)$/.test(local)) return false;
  // Locaux génériques — exact ou préfixe (contact.xxx, info-xxx, service_xxx)
  const GENERIC_WORDS = [
    "contact","info","admin","webmaster","support","hello","service","mairie",
    "secretariat","commercial","direction","recrutement","no-reply","noreply",
    "comptabilite","gestionnaire","accueil","reception","pro","rh","facturation",
    "reservation","commande","vente","sav","bonjour","equipe","team","boutique",
    "news","newsletter","devis","presse","communication","achat","logistique",
    "magasin","coiffure","carrelage","electricite","plomberie","boulangerie",
    "fleuriste","jardinerie","menuiserie","peinture","serrurerie","garage",
  ];
  const genericExact = new RegExp(`^(${GENERIC_WORDS.join("|")})$`, "i");
  const genericPrefix = new RegExp(`^(${GENERIC_WORDS.join("|")})[.\\-_]`, "i");
  if (genericExact.test(local) || genericPrefix.test(local)) return false;
  // Domaine bloqué
  for (const pat of BLOCKED_DOMAINS) { if (pat.test(domain)) return false; }
  // Domaines perso : local trop court = compte inexistant probable
  if (SAFE_DOMAINS.has(domain) && local.length < 6) return false;
  return true;
}

function isCleanName(name) {
  if (!name || name.length < 3 || name.length > 80) return false;
  if (/[<>{}\[\]@]/.test(name)) return false;
  if (/#/.test(name)) return false;
  if (/\d{5,}/.test(name)) return false;
  if (/instagram|facebook|twitter|www\.|https?:|youtube|tiktok/i.test(name)) return false;
  for (const re of BAD_NAME_RE) { if (re.test(name)) return false; }
  // Tout en majuscules ET plus de 2 mots = titre de document, pas un nom
  const words = name.trim().split(/\s+/);
  if (words.length > 2 && name === name.toUpperCase()) return false;
  if (words.length > 9) return false;
  return true;
}

// ── Parse CSV ────────────────────────────────────────────────────
function parseCSV(file) {
  const lines = readFileSync(file, "utf-8")
    .replace(/^﻿/, "").trim().split("\n");
  const headers = lines[0].match(/"([^"]*)"/g)?.map(v => v.slice(1, -1)) ?? [];
  return lines.slice(1).map(line => {
    const vals = line.match(/"([^"]*)"/g)?.map(v => v.slice(1, -1)) ?? [];
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
  });
}

// ── MX check par domaine (cache) ─────────────────────────────────
async function checkMxBatch(domains) {
  const results = new Map();
  const BATCH = 20;
  for (let i = 0; i < domains.length; i += BATCH) {
    const batch = domains.slice(i, i + BATCH);
    await Promise.all(batch.map(async d => {
      try {
        const mx = await resolveMx(d);
        results.set(d, mx && mx.length > 0 ? mx.sort((a,b) => a.priority - b.priority)[0].exchange : null);
      } catch {
        results.set(d, null);
      }
    }));
    if (i + BATCH < domains.length) {
      process.stdout.write(`   ${Math.min(i + BATCH, domains.length)}/${domains.length}\r`);
    }
  }
  return results; // Map<domain, mxHost|null>
}

// ── SMTP RCPT TO — vérifie que la boîte existe (domaines custom uniquement) ──
function smtpVerify(email, mxHost) {
  return new Promise(resolve => {
    const TIMEOUT = 8000;
    let done = false;
    let buf  = "";

    const finish = (ok) => {
      if (done) return;
      done = true;
      try { sock.destroy(); } catch {}
      resolve(ok);
    };

    const sock = createConnection({ host: mxHost, port: 25 });
    sock.setTimeout(TIMEOUT);
    sock.on("timeout", () => finish(null)); // inconnu → on garde
    sock.on("error",   () => finish(null));

    const send = (line) => { try { sock.write(line + "\r\n"); } catch {} };

    let step = 0;
    sock.on("data", chunk => {
      buf += chunk.toString();
      const lines = buf.split(/\r?\n/);
      buf = lines.pop();
      for (const line of lines) {
        const code = parseInt(line.slice(0, 3));
        if (step === 0 && code === 220) { step = 1; send("EHLO localboost.fr"); }
        else if (step === 1 && (code === 250 || code === 220)) { step = 2; send(`MAIL FROM:<verify@localboost.fr>`); }
        else if (step === 2 && code === 250) { step = 3; send(`RCPT TO:<${email}>`); }
        else if (step === 3) {
          if (code === 250 || code === 251) finish(true);
          else if (code >= 550 && code < 560) finish(false); // 550 = mailbox not found
          else finish(null); // autre code → inconnu, on garde
        }
        // Refus de connexion ou erreur protocole
        else if (code === 421 || code === 554) finish(null);
      }
    });
  });
}

async function smtpVerifyBatch(emailsWithMx) {
  const results = new Map();
  const BATCH = 5; // SMTP est lent, petit batch
  for (let i = 0; i < emailsWithMx.length; i += BATCH) {
    const batch = emailsWithMx.slice(i, i + BATCH);
    await Promise.all(batch.map(async ({ email, mxHost }) => {
      const ok = await smtpVerify(email, mxHost);
      results.set(email.toLowerCase(), ok); // true=existe, false=n'existe pas, null=inconnu
    }));
    process.stdout.write(`   smtp ${Math.min(i + BATCH, emailsWithMx.length)}/${emailsWithMx.length}\r`);
  }
  return results;
}

// ── Main ─────────────────────────────────────────────────────────
async function run() {
  const raw = parseCSV(INPUT);
  console.log(`Leads bruts         : ${raw.length}`);

  // Passe 1 — heuristiques synchrones
  const p1 = raw.filter(r => isCleanEmail(r.Email) && isCleanName(r.Nom));
  console.log(`Après filtres nom/email  : ${p1.length}  (-${raw.length - p1.length})`);

  // Passe 2 — vérification MX pour les domaines custom
  const customDomains = [
    ...new Set(
      p1
        .map(r => r.Email.split("@")[1]?.toLowerCase())
        .filter(d => d && !SAFE_DOMAINS.has(d))
    ),
  ];

  let mxResults = new Map();
  if (customDomains.length) {
    process.stdout.write(`\nVérification MX : ${customDomains.length} domaine(s) custom...\n`);
    mxResults = await checkMxBatch(customDomains);
    const noMx = [...mxResults.values()].filter(v => !v).length;
    console.log(`   ${noMx} domaine(s) sans MX → emails supprimés`);
  }

  const afterMx = p1.filter(r => {
    const d = r.Email.split("@")[1]?.toLowerCase();
    if (!d) return false;
    if (SAFE_DOMAINS.has(d)) return true;
    return mxResults.get(d) !== null && mxResults.get(d) !== undefined;
  });
  console.log(`Après vérification MX    : ${afterMx.length}  (-${p1.length - afterMx.length})`);

  // Passe 3 — SMTP RCPT TO pour domaines custom (détecte boîtes inexistantes)
  const smtpTargets = afterMx
    .filter(r => {
      const d = r.Email.split("@")[1]?.toLowerCase();
      return d && !SAFE_DOMAINS.has(d) && mxResults.get(d);
    })
    .map(r => ({ email: r.Email.toLowerCase(), mxHost: mxResults.get(r.Email.split("@")[1]?.toLowerCase()) }));

  let smtpResults = new Map();
  if (smtpTargets.length) {
    process.stdout.write(`\nVérification SMTP : ${smtpTargets.length} boîte(s) custom...\n`);
    smtpResults = await smtpVerifyBatch(smtpTargets);
    const dead = [...smtpResults.values()].filter(v => v === false).length;
    console.log(`   ${dead} boîte(s) inexistantes confirmées → supprimées`);
  }

  const p2 = afterMx.filter(r => {
    const d = r.Email.split("@")[1]?.toLowerCase();
    if (!d) return false;
    if (SAFE_DOMAINS.has(d)) return true;
    const smtpOk = smtpResults.get(r.Email.toLowerCase());
    return smtpOk !== false; // false = confirmé inexistant ; null/true = on garde
  });
  console.log(`Après vérification SMTP  : ${p2.length}  (-${afterMx.length - p2.length})`);

  // Déduplication finale
  const seen = new Set();
  const final = p2.filter(r => {
    const k = r.Email.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  console.log(`\n✅ Leads propres         : ${final.length}  (${raw.length - final.length} supprimés au total)`);

  // Répartition par ville
  const byCity = {};
  for (const r of final) byCity[r.Ville] = (byCity[r.Ville] || 0) + 1;
  console.log("\nRépartition par ville :");
  Object.entries(byCity)
    .sort((a, b) => b[1] - a[1])
    .forEach(([v, n]) => console.log(`  ${v.padEnd(18)} ${n}`));

  // Écriture
  const csv = [
    '"Nom","Email","Ville"',
    ...final.map(r =>
      [r.Nom, r.Email, r.Ville]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const outName = `ALL_LEADS_CLEAN_${Date.now()}.csv`;
  writeFileSync(join(__dirname, outName), "﻿" + csv, "utf-8");
  console.log(`\n📁 ${outName}`);
}

run().catch(e => { console.error("❌", e.message); process.exit(1); });
