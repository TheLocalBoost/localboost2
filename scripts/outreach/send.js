import "dotenv/config";
import axios from "axios";
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// ── Rotation comptes Brevo ────────────────────────────────────────
// Ajouter dans .env : BREVO_API_KEY_1, BREVO_API_KEY_2, etc.
// + BREVO_SENDER_EMAIL_1, BREVO_SENDER_EMAIL_2, etc.
// Chaque compte = 300 emails/jour gratuits
const BREVO_ACCOUNTS = [1, 2, 3, 4]
  .map(i => ({
    key:   process.env[`BREVO_API_KEY_${i}`],
    email: process.env[`BREVO_SENDER_EMAIL_${i}`],
    name:  process.env[`BREVO_SENDER_NAME_${i}`],
  }))
  .filter(a => a.key);

// Fallback : BREVO_API_KEY / SENDER_EMAIL / SENDER_NAME (ancienne config)
if (!BREVO_ACCOUNTS.length) {
  BREVO_ACCOUNTS.push({
    key:   process.env.BREVO_API_KEY,
    email: process.env.SENDER_EMAIL,
    name:  process.env.SENDER_NAME,
  });
}

let accountIdx = 0;
const currentAccount = () => BREVO_ACCOUNTS[accountIdx];

function rotateAccount() {
  accountIdx++;
  if (accountIdx >= BREVO_ACCOUNTS.length) {
    console.error(`\n❌ Tous les comptes Brevo (${BREVO_ACCOUNTS.length}) ont atteint leur limite du jour.`);
    process.exit(1);
  }
  const acc = currentAccount();
  console.log(`\n🔄 Rotation → compte ${accountIdx + 1}/${BREVO_ACCOUNTS.length} (${acc.email})\n`);
}

console.log(`\n📬 ${BREVO_ACCOUNTS.length} compte(s) Brevo chargé(s) : ${BREVO_ACCOUNTS.map(a => a.email).join(", ")}\n`);

const __dirname = dirname(fileURLToPath(import.meta.url));
const SENT_FILE    = join(__dirname, "sent.csv");
const STATS_FILE   = join(__dirname, "variant_stats.json");
const BOUNCED_FILE = join(__dirname, "bounced.csv");

// ── CSV ──────────────────────────────────────────────────────────
function loadSent() {
  if (!existsSync(SENT_FILE)) return new Set();
  return new Set(readFileSync(SENT_FILE, "utf-8").trim().split("\n").filter(Boolean));
}

function loadBounced() {
  if (!existsSync(BOUNCED_FILE)) return new Set();
  return new Set(readFileSync(BOUNCED_FILE, "utf-8").trim().split("\n").map(e => e.toLowerCase()).filter(Boolean));
}
function markSent(email) { appendFileSync(SENT_FILE, email + "\n", "utf-8"); }

const CSV_FILE = existsSync(join(__dirname, "leads_ready.csv"))
  ? join(__dirname, "leads_ready.csv")
  : join(__dirname, "leads_clean2.csv");
if (!existsSync(CSV_FILE)) { console.error("❌ leads_ready.csv / leads_clean2.csv introuvable."); process.exit(1); }
console.log(`📂 Source : ${CSV_FILE}`);

function parseCSV(file) {
  const lines   = readFileSync(file, "utf-8").replace(/^﻿/, "").trim().split("\n");
  const headers = lines[0].match(/"([^"]*)"/g).map(v => v.slice(1,-1));
  return lines.slice(1).map(line => {
    const vals = line.match(/"([^"]*)"/g)?.map(v => v.slice(1,-1)) || [];
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] || ""]));
  }).filter(r => r.Email);
}

function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const e  = email.trim().toLowerCase();
  const re = /^[a-z0-9][a-z0-9._%+\-]*[a-z0-9]@[a-z0-9][a-z0-9.\-]*\.[a-z]{2,}$/;
  if (!re.test(e)) return false;
  if (e.split("@")[0].includes("..")) return false;
  if (e.startsWith("www.") || e.startsWith("-")) return false;
  const localPart = e.split("@")[0];
  if (localPart.length <= 3) return false;
  if (/^\d+$/.test(localPart)) return false;
  const GENERIC = /^(contact|info|admin|webmaster|support|hello|service|mairie|secretariat|commercial|direction|recrutement|no-reply|noreply|comptabilite|gestionnaire|accueil|reception|communication|pro|presse|rh|facturation|reservation|commande|vente|achats|logistique|sav|orders|sales|billing|postmaster|abuse|test|demo|exemple|example|user|email|mail|nul|null|placeholder)$/i;
  if (GENERIC.test(localPart)) return false;
  if (/\.(com|fr|net|org|eu|io|co)$/.test(localPart)) return false;
  const VILLES = /^(paris|lyon|marseille|toulouse|nantes|bordeaux|lille|nice|rennes|grenoble|strasbourg|montpellier|tours|nimes|vichy|dijon|angers|brest|metz|caen|reims|nancy|pau|rouen|toulon|clermont|amiens|limoges|boulogne|macon|albi|laval|beziers|dax|blois|tulle|colmar|thionville)$/i;
  if (VILLES.test(localPart)) return false;
  const domain = e.split("@")[1];
  if (/^(example\.com|exemple\.com|mail\.com|yoursite\.|mysite\.|mywebsite|domain\.com|test\.com|email\.com|website\.com|company\.com)$/.test(domain)) return false;
  return true;
}

// Noms scrappés, génériques ou non-établissements
const SCRAPED_NAMES = /^(offre|offres|poste de|recherche|annonce|page |résult|nous rech|contact |electrici|plombier |coiffeur |barbier |fleuriste |boulanger |serrurier |garagiste |restaurant |peintre |carreleur |opticien |pharmacie )/i;
const GENERIC_NAMES = /^(contact|info|bonjour|salut|mon|ma |le |la |les |un |une |des )$/i;

function isValidLead(c) {
  const nom = (c.Nom || "").trim();
  if (nom.length < 4 || nom.length > 60) return false;
  // Trop de mots = snippet scrappé
  if (nom.split(" ").length > 6) return false;
  if (/[<>{}\[\]@#]/.test(nom)) return false;
  if (/\d{5,}/.test(nom)) return false;
  if (/instagram|facebook|twitter|www\.|https?:/i.test(nom)) return false;
  if (SCRAPED_NAMES.test(nom)) return false;
  if (/#/.test(nom)) return false;
  // Nom = juste un mot générique de secteur (ex: "Contact", "Electricien")
  if (GENERIC_NAMES.test(nom)) return false;
  // Nom commence par un verbe d'action scrappé
  if (/^(nous |vous |je |votre |notre |pour |avec |chez )/i.test(nom)) return false;
  // Nom = ville seule ou département
  if (/^\d{2,3}$/.test(nom)) return false;
  // Nom contient une ville seule (ex: "Électricien à Tours")
  if (/ à | en | sur | de /i.test(nom) && nom.split(" ").length <= 4) return false;
  const FAUX_VILLES = ['france','île-de-france','occitanie','auvergne','bretagne','normandie',
    'nouvelle-aquitaine','bourgogne','centre-val de loire','grand est','hauts-de-france',
    'pays de la loire','provence-alpes','paca','corse','réunion','martinique','guadeloupe','guyane','mayotte'];
  if (!c.Ville || FAUX_VILLES.includes(c.Ville.toLowerCase())) return false;
  if (/^\d{2,3}$/.test(c.Ville.trim())) return false;
  if (!isValidEmail(c.Email)) return false;
  return true;
}

// ── Thompson Sampling ────────────────────────────────────────────
function loadStats() {
  if (!existsSync(STATS_FILE)) return {};
  return JSON.parse(readFileSync(STATS_FILE, "utf-8"));
}

function saveSend(vid, stats) {
  if (!stats[vid]) stats[vid] = { sends: 0, clicks: 0 };
  stats[vid].sends++;
  writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
}

// Charge les vrais clics depuis Supabase et les fusionne dans stats
async function syncClicksFromSupabase(stats) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return stats;
  try {
    const res = await fetch(`${url}/rest/v1/email_clicks?select=variant_id`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    if (!res.ok) return stats;
    const rows = await res.json();
    // Reset clicks dans stats, recompter depuis Supabase
    const clickCounts = {};
    rows.forEach(r => { clickCounts[r.variant_id] = (clickCounts[r.variant_id] || 0) + 1; });
    for (const [vid, count] of Object.entries(clickCounts)) {
      if (!stats[vid]) stats[vid] = { sends: 0, clicks: 0 };
      stats[vid].clicks = count;
    }
    const total = Object.values(clickCounts).reduce((a, b) => a + b, 0);
    if (total > 0) console.log(`  📊 ${total} clics réels chargés depuis Supabase\n`);
  } catch {}
  return stats;
}

function randomNormal() {
  let u, v;
  do { u = Math.random(); } while (u === 0);
  do { v = Math.random(); } while (v === 0);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function sampleGamma(alpha) {
  if (alpha < 1) return sampleGamma(1 + alpha) * Math.pow(Math.random(), 1 / alpha);
  const d = alpha - 1 / 3, c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x, v;
    do { x = randomNormal(); v = 1 + c * x; } while (v <= 0);
    v = v * v * v;
    const u = Math.random();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function sampleBeta(alpha, beta) {
  const x = sampleGamma(alpha), y = sampleGamma(beta);
  return x / (x + y);
}

function selectVariant(stats) {
  let best = 0, bestScore = -1;
  for (let i = 0; i < VARIANTS.length; i++) {
    const s = stats[i]?.sends  || 0;
    const c = stats[i]?.clicks || 0;
    const score = sampleBeta(c + 1, Math.max(s - c, 0) + 1);
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
}

// ── 10 Variantes ─────────────────────────────────────────────────
// Sélection resserrée — Thompson sampling apprend plus vite avec moins de variantes
// Règle : zéro "gratuit / sans inscription / 30 secondes" · Bouton = "Voir ce que j'ai trouvé →"

const SL = { boulangerie:'boulanger', plombier:'plombier', electricien:'électricien', coiffeur:'coiffeur',
  restaurant:'restaurateur', garage:'garagiste', pharmacie:'pharmacie', hotel:'hôtelier',
  fleuriste:'fleuriste', opticien:'opticien', dentiste:'dentiste', medecin:'médecin' };

const VARIANTS = [

  // 0 — La fiche reçoit des visites quand vous n'êtes pas là
  (nom, ville, s) => ({
    subject: `votre fiche Google Maps`,
    body: `Bonjour,

La fiche Google de ${nom} reçoit des visites la nuit, le weekend, quand vous n'êtes pas là.

Si elle est incomplète, ces gens appellent ailleurs.

J'ai noté ce qui manque.

Brian`,
  }),

  // 1 — Client qui hésite entre deux fiches
  (nom, ville, s) => ({
    subject: `j'ai regardé votre fiche Google`,
    body: `Bonjour,

Quand un client hésite entre deux ${SL[s]||s}s à ${ville}, il ouvre Google Maps.

Photos, note, dernier avis. 10 secondes. Décision prise.

J'ai noté ce que voit quelqu'un qui tombe sur ${nom}.

Brian`,
  }),

  // 2 — Concurrent moins bien noté passe devant
  (nom, ville, s) => ({
    subject: `votre fiche Google Maps`,
    body: `Bonjour,

Un concurrent moins bien noté que ${nom} apparaît avant vous à ${ville}.

Google ne récompense pas la qualité. Il récompense l'activité de fiche.

Voilà ce que j'ai trouvé sur la vôtre.

Brian`,
  }),

  // 3 — Bons avis mais sans activité récente
  (nom, ville, s) => ({
    subject: `bien noté mais invisible sur Google Maps`,
    body: `Bonjour,

Une fiche Google avec de bons avis mais sans activité récente descend dans les résultats.

Google ne récompense pas le passé. Il récompense ce qui se passe maintenant.

J'ai regardé celle de ${nom} à ${ville}.

Brian`,
  }),

  // 4 — J'ai cherché depuis mon téléphone
  (nom, ville, s) => ({
    subject: `j'ai regardé votre fiche Google`,
    body: `Bonjour,

J'ai cherché ${SL[s]||s} à ${ville} depuis mon téléphone.

${nom} apparaît. Mais il y a quelques points qui font que le suivant récupère l'appel.

Brian`,
  }),

  // 5 — Urgence, le premier qui inspire confiance
  (nom, ville, s) => ({
    subject: `votre fiche Google Maps`,
    body: `Bonjour,

Quelqu'un cherche un ${SL[s]||s} à ${ville} en urgence.

Il voit les résultats. Il appelle celui dont la fiche inspire confiance — pas forcément le meilleur.

J'ai regardé la vôtre.

Brian`,
  }),

  // 6 — Toujours en premier : une question d'activité
  (nom, ville, s) => ({
    subject: `votre fiche Google Maps`,
    body: `Bonjour,

Il y a des ${SL[s]||s}s à ${ville} qui apparaissent toujours en premier sur Google.

Pas parce qu'ils sont meilleurs — parce que leur fiche est tenue à jour chaque semaine.

J'ai regardé celle de ${nom}.

Brian`,
  }),

  // 7 — 8 recherches sur 10 sur mobile
  (nom, ville, s) => ({
    subject: `comment vous apparaissez sur mobile`,
    body: `Bonjour,

8 recherches sur 10 pour un ${SL[s]||s} à ${ville} se font sur mobile.

Les gens appellent directement depuis Google — sans visiter de site.

J'ai regardé comment ${nom} apparaît dans ces résultats.

Brian`,
  }),

  // 8 — 10 secondes sur la fiche avant de décider
  (nom, ville, s) => ({
    subject: `3 secondes pour décider`,
    body: `Bonjour,

Avant d'appeler un ${SL[s]||s}, la plupart des gens passent 10 secondes sur sa fiche Google.

Photos, horaires, avis récents. Puis ils décident.

Voilà ce que voit quelqu'un qui tombe sur ${nom}.

Brian`,
  }),

  // 9 — Moins d'avis que certains concurrents
  (nom, ville, s) => ({
    subject: `j'ai regardé votre fiche Google`,
    body: `Bonjour,

${nom} a moins d'avis Google que certains de vos concurrents à ${ville}.

Ce n'est pas un problème de qualité — c'est un problème de fiche.

J'ai noté ce qui creuse l'écart.

Brian`,
  }),
];

// ── Preheader par secteur ─────────────────────────────────────────
function buildPreheader(secteur, score, appelsPerdus) {
  if (score && appelsPerdus) {
    return `Score estimé : ${score}/100 · ~${appelsPerdus} appels perdus/mois · Vérifiez en 30 secondes`;
  }
  const map = {
    plombier:    "Un client vous a cherché cette nuit — votre fiche l'a-t-elle convaincu ?",
    serrurier:   "En urgence, les gens appellent le premier résultat Google. C'est vous ?",
    electricien: "Votre fiche Google travaille pendant que vous dormez — ou pas.",
    coiffeur:    "Samedi matin, un client cherche un coiffeur à côté. Il voit votre fiche.",
    barbier:     "Un client cherche un barbier — votre fiche lui donne-t-elle envie d'appeler ?",
    restaurant:  "Vendredi soir, les gens choisissent leur restaurant sur Google Maps.",
    boulanger:   "Le matin, les gens cherchent une boulangerie ouverte. Vous apparaissez ?",
    fleuriste:   "Pour la fête des mères, les clients cherchent un fleuriste local sur Google.",
    garagiste:   "Panne sur la route — le client appelle le premier garagiste bien noté.",
    pharmacie:   "Votre pharmacie est-elle bien positionnée sur Google Maps ?",
    opticien:    "Votre fiche Google est votre première vitrine pour les nouveaux clients.",
    peintre:     "Les artisans bien référencés sur Google reçoivent 3× plus de devis.",
    carreleur:   "Les clients comparent 3 artisans sur Google avant d'appeler.",
  };
  return map[secteur] || "Votre fiche Google perd peut-être des clients chaque semaine.";
}

// ── Bloc score (injecté juste avant le CTA) ───────────────────────
function buildScoreBlock(score, appelsPerdus, secteur) {
  if (!score) return "";
  const color  = score >= 70 ? "#d97706" : score >= 50 ? "#ea580c" : "#dc2626";
  const label  = score >= 70 ? "Fiche insuffisante" : score >= 50 ? "Fiche très incomplète" : "Fiche quasiment invisible";
  const appels = appelsPerdus || 7;
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr>
      <td style="background:#fef9f0;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle;width:70px;">
              <p style="font-size:32px;font-weight:900;color:${color};margin:0;line-height:1;">${score}</p>
              <p style="font-size:11px;color:#9ca3af;margin:0;">/100</p>
            </td>
            <td style="vertical-align:middle;padding-left:14px;border-left:2px solid #fed7aa;">
              <p style="font-size:13px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">${label}</p>
              <p style="font-size:12px;color:#92400e;margin:0;">~${appels} appels perdus/mois sur votre secteur</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

// ── Construction email ────────────────────────────────────────────
function buildEmail(c, stats) {
  const nom          = c.Nom   || "votre établissement";
  const ville        = c.Ville && c.Ville !== "France" ? c.Ville : "votre ville";
  const secteur      = (c.Secteur || "commerce").toLowerCase();
  const score        = parseInt(c.Score) || null;
  const appelsPerdus = parseInt(c.AppelsPerdus) || null;
  const vid          = selectVariant(stats);
  const variant      = VARIANTS[vid](nom, ville, secteur);

  const scoreParam   = score        ? `&score=${score}`                           : "";
  const secteurParam = c.Secteur    ? `&secteur=${encodeURIComponent(secteur)}`   : "";
  const dest         = `https://thelocalboost.fr/analyser?nom=${encodeURIComponent(nom)}&ville=${encodeURIComponent(ville)}${scoreParam}${secteurParam}&utm_source=brevo&utm_medium=email&utm_campaign=v${vid}`;
  // Passe par /api/track pour enregistrer le clic dans Supabase avant redirect
  const auditUrl     = `https://thelocalboost.fr/api/track?vid=${vid}&url=${encodeURIComponent(dest)}`;

  const preheader    = buildPreheader(secteur, score, appelsPerdus);
  const scoreBlock   = buildScoreBlock(score, appelsPerdus, secteur);
  const paragraphs   = variant.body.split("\n\n").map(p =>
    `<p style="font-size:15px;line-height:1.7;color:#1a1a1a;margin:0 0 16px;">${p.replace(/\n/g, "<br>")}</p>`
  ).join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
<!-- Preheader caché -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#f9fafb;">
  ${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌
</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="560" cellpadding="0" cellspacing="0" border="0"
           style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:0 32px 32px;">
          ${paragraphs}
          ${scoreBlock}
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
            <tr>
              <td align="center">
                <a href="${auditUrl}"
                   style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:700;font-size:16px;padding:16px 36px;border-radius:8px;text-decoration:none;">
                  Voir ce que j'ai trouvé →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="background:#f3f4f6;padding:16px 32px;border-top:1px solid #e5e7eb;">
          <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.6;">
            Vous avez reçu cet email car votre établissement est référencé publiquement.<br>
            Pour ne plus en recevoir : <a href="mailto:contact@thelocalboost.fr" style="color:#9ca3af;">contact@thelocalboost.fr</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  return { subject: variant.subject, html, vid };
}

// ── Envoi ────────────────────────────────────────────────────────
const delay      = ms => new Promise(r => setTimeout(r, ms));
const humanDelay = () => delay(2_000 + Math.random() * 2_000); // 2–4s burst

async function sendEmail(c, stats, attempt = 0) {
  if (attempt >= BREVO_ACCOUNTS.length) {
    console.error(`❌ ${c.Email} — tous les comptes épuisés`);
    return;
  }
  const nom = c.Nom || "votre établissement";
  const { subject, html, vid } = buildEmail(c, stats);
  const acc = currentAccount();
  try {
    await axios.post("https://api.brevo.com/v3/smtp/email", {
      sender:      { name: acc.name, email: acc.email },
      to:          [{ email: c.Email, name: nom }],
      subject,
      htmlContent: html,
      tracking:    { openTracking: false, clickTracking: true },
    }, {
      headers: { "api-key": acc.key, "Content-Type": "application/json" }
    });
    markSent(c.Email.toLowerCase());
    saveSend(vid, stats);
    console.log(`✅ [cpt${accountIdx + 1}] v${vid} ${c.Email.padEnd(38)} ${nom.slice(0, 28)}`);
  } catch (err) {
    const status = err.response?.status;
    const msg    = err.response?.data?.message || err.message;
    if (status === 429 || (status === 400 && /limit|quota|daily/i.test(msg))) {
      console.warn(`⚠️  Compte ${accountIdx + 1} limite atteinte — rotation`);
      rotateAccount();
      await sendEmail(c, stats, attempt + 1);
    } else {
      console.error(`❌ ${c.Email}`, msg);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────
const alreadySent  = loadSent();
const bounced      = loadBounced();
const allContacts  = parseCSV(CSV_FILE);
const validContacts = allContacts.filter(isValidLead);
const contacts     = validContacts.filter(c => !alreadySent.has(c.Email.toLowerCase()) && !bounced.has(c.Email.toLowerCase()));
console.log(`✅ ${allContacts.length} total → ${validContacts.length} valides → ${contacts.length} à envoyer (${alreadySent.size} déjà envoyés)`);

const LIMIT = parseInt(process.argv[2]) || contacts.length;

async function main() {
  let stats = loadStats();
  stats = await syncClicksFromSupabase(stats);
  const batch = contacts.slice(0, LIMIT);
  console.log(`\n📧 Envoi de ${batch.length} emails — Thompson sampling actif (${VARIANTS.length} variantes)\n`);
  for (let i = 0; i < batch.length; i++) {
    process.stdout.write(`[${i+1}/${batch.length}] `);
    await sendEmail(batch[i], stats);
    if (i + 1 < batch.length) await humanDelay();
  }
  console.log("\n✅ Terminé !");

  // Résumé des variantes
  const s = loadStats();
  console.log("\n📊 Stats variantes :");
  Object.entries(s).sort((a, b) => b[1].sends - a[1].sends).forEach(([vid, d]) => {
    const ctr = d.sends > 0 ? ((d.clicks / d.sends) * 100).toFixed(1) : "—";
    console.log(`  v${vid.padEnd(3)} ${d.sends} envois  ${d.clicks} clics  CTR ${ctr}%`);
  });
}

main();
