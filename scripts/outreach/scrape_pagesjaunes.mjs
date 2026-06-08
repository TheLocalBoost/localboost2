// scrape_pagesjaunes.mjs — Scrape Pages Jaunes avec Playwright
// Étape 1 : récupère les URLs des fiches depuis la liste de résultats
// Étape 2 : visite chaque fiche détail → extrait le site web
// Étape 3 : visite le site web → extrait l'email
// Usage   : node scrape_pagesjaunes.mjs "plombier" "Lyon" [pages=3]
// Output  : pj_{secteur}_{ville}_{date}.csv

import { chromium } from "playwright";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

config({ path: join(dirname(fileURLToPath(import.meta.url)), ".env") });

const __dirname = dirname(fileURLToPath(import.meta.url));
const sleep     = ms => new Promise(r => setTimeout(r, ms));
const TODAY     = new Date().toISOString().slice(0, 10);

const [,, SECTOR = "plombier", CITY = "Lyon", PAGES_STR = "3"] = process.argv;
const MAX_PAGES = Math.min(parseInt(PAGES_STR) || 3, 10);
const OUT_FILE  = join(__dirname, `pj_${SECTOR}_${CITY}_${TODAY}.csv`);
const PJ_BASE   = "https://www.pagesjaunes.fr";

// ── Filtres email ─────────────────────────────────────────────────────────────
const EMAIL_RE   = /[a-z0-9][a-z0-9._%+\-]{2,}@[a-z0-9.\-]+\.(fr|com|net|org|eu)/gi;
const GENERIC_RE = /^(contact|info|admin|webmaster|support|service|mairie|secretariat|commercial|direction|recrutement|noreply|no-reply|accueil|reception|rh|facturation|reservation|vente|sav|newsletter|devis|presse|communication|logistique|magasin|coiffure|carrelage|electricite|plomberie|boulangerie)([.\-_]|$)/i;

function extractEmails(html) {
  return [...new Set((html.match(EMAIL_RE) || []).map(e => e.toLowerCase()))].filter(e => {
    const [local, domain] = e.split("@");
    if (!local || !domain || local.length < 4) return false;
    if (/^\d+$/.test(local)) return false;
    if (/\.(com|fr|net|org|eu)$/.test(local)) return false;
    if (GENERIC_RE.test(local)) return false;
    if (/\.(ac-[a-z]+\.fr|gouv\.fr|edu\.fr)$/.test(domain)) return false;
    return true;
  });
}

// ── Scrape email depuis site web ──────────────────────────────────────────────
const CONTACT_PATHS = ["", "/contact", "/nous-contacter", "/contactez-nous", "/contact.html", "/a-propos", "/mentions-legales"];

async function scrapeEmailFromSite(page, website) {
  const base = website.replace(/\/$/, "");
  for (const path of CONTACT_PATHS) {
    try {
      await page.goto(base + path, { waitUntil: "domcontentloaded", timeout: 10000 });
      const html = await page.content();
      const emails = extractEmails(html);
      if (emails.length) return emails[0];
      await sleep(300);
    } catch { continue; }
  }
  return null;
}

// ── Récupère les URLs de fiches depuis la page de résultats ──────────────────
// Extrait directement nom + site depuis la page de liste (plus besoin de visiter la fiche détail)
async function getBusinessesWithSite(page, sector, city, pageNum) {
  const url = `${PJ_BASE}/annuaire/chercherlespros?quoiqui=${encodeURIComponent(sector)}&ou=${encodeURIComponent(city)}&page=${pageNum}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  await sleep(2000);

  return page.evaluate(() => {
    const results = [];
    const websiteAnchors = [...document.querySelectorAll('a.bi-website, a[title*="Site web"]')];

    for (const anchor of websiteAnchors) {
      // L'URL réelle est encodée en base64 dans data-pjlb
      let site = "";
      try {
        const raw  = anchor.getAttribute("data-pjlb") ?? "";
        const json = JSON.parse(raw);
        if (json.url) site = atob(json.url);
      } catch {}

      if (!site || site.includes("pagesjaunes") || site.includes("solocal")) continue;

      // Nom du commerce
      const card  = anchor.closest('[id^="bi-"]') ?? anchor.closest('li') ?? anchor.closest('article');
      const nomEl = card?.querySelector('.bi-denomination, [class*="denomination"], h2');
      const nom   = nomEl?.textContent?.trim() ?? "";

      if (nom && site) results.push({ nom, site });
    }
    return results;
  });
}

// ── Visite une fiche détail et extrait nom + site web ────────────────────────
async function getFicheDetail(page, ficheUrl) {
  try {
    await page.goto(ficheUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await sleep(1500);

    return page.evaluate(() => {
      // Nom
      const nomEl = document.querySelector('.bi-denomination, h1.denomination, [itemprop="name"]');
      const nom   = nomEl?.textContent?.trim() ?? "";

      // Site web — chercher un lien externe
      const siteEl = [...document.querySelectorAll('a[href^="http"]')]
        .find(a => {
          const h = a.href;
          return !h.includes("pagesjaunes") && !h.includes("solocal") &&
                 !h.includes("google") && !h.includes("facebook") &&
                 !h.includes("instagram") && !h.includes("javascript");
        });
      const site = siteEl?.href ?? "";

      // Email direct sur la fiche (rare mais possible)
      const emailMatch = document.body.innerHTML.match(/[a-z0-9][a-z0-9._%+\-]{2,}@[a-z0-9.\-]+\.(fr|com|net|org)/i);
      const emailDirect = emailMatch ? emailMatch[0].toLowerCase() : "";

      return { nom, site, emailDirect };
    });
  } catch {
    return { nom: "", site: "", emailDirect: "" };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log(`\n📒 Pages Jaunes — "${SECTOR}" @ ${CITY} (${MAX_PAGES} pages)\n`);

  // Charger bounced + envoyés
  const bounced = existsSync(join(__dirname, "bounced.csv"))
    ? new Set(readFileSync(join(__dirname, "bounced.csv"), "utf-8").trim().split("\n").map(e => e.toLowerCase()).filter(Boolean))
    : new Set();
  const sent = existsSync(join(__dirname, "sent.csv"))
    ? new Set(readFileSync(join(__dirname, "sent.csv"), "utf-8").trim().split("\n").filter(Boolean))
    : new Set();

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
  });

  const ctx = await browser.newContext({
    userAgent:  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale:     "fr-FR",
    timezoneId: "Europe/Paris",
    viewport:   { width: 1280, height: 800 },
  });

  const results = [];
  const seen    = new Set();

  try {
    const listPage  = await ctx.newPage();
    const emailPage = await ctx.newPage();

    for (let p = 1; p <= MAX_PAGES; p++) {
      console.log(`\n📄 Page ${p}/${MAX_PAGES}`);
      const businesses = await getBusinessesWithSite(listPage, SECTOR, CITY, p);
      console.log(`   → ${businesses.length} fiches avec site trouvées`);
      if (!businesses.length) break;

      for (const { nom, site } of businesses) {
        process.stdout.write(`   🏪 ${nom.slice(0, 40).padEnd(40)} `);
        try {
          const email = await scrapeEmailFromSite(emailPage, site);
          if (email && !seen.has(email) && !bounced.has(email) && !sent.has(email)) {
            seen.add(email);
            results.push({ Nom: nom, Email: email, Ville: CITY });
            console.log(`✅ ${email}`);
          } else {
            console.log(`— ${email ? "déjà vu/blacklisté" : "pas d'email"}`);
          }
        } catch { console.log(`— erreur`); }
        await sleep(500);
      }
      await sleep(2000);
    }

  } finally {
    await browser.close();
  }

  console.log(`\n📊 ${results.length} leads récoltés\n`);

  if (!results.length) { console.log("Aucun lead trouvé."); process.exit(0); }

  const csv = [
    '"Nom","Email","Ville"',
    ...results.map(r =>
      [r.Nom, r.Email, r.Ville].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  writeFileSync(OUT_FILE, "﻿" + csv, "utf-8");
  console.log(`💾 ${OUT_FILE}`);
}

run().catch(e => { console.error("❌", e.message); process.exit(1); });
