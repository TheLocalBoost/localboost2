import { chromium } from "playwright";
import { writeFileSync } from "fs";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  locale: "fr-FR",
});
const page = await ctx.newPage();
await page.goto("https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=plombier&ou=Lyon&page=1", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(3000);
const html = await page.content();
writeFileSync("scripts/outreach/pj_debug.html", html);

// Chercher les classes autour des noms de commerces
const classes = [...html.matchAll(/class="([^"]{3,60})"/g)]
  .map(m => m[1])
  .filter(c => /nom|denom|title|compan|business|raison|result/i.test(c));
console.log("Classes pertinentes:", [...new Set(classes)].slice(0, 30));

// Chercher les liens vers les sites
const siteLinks = [...html.matchAll(/href="(https?:\/\/(?!www\.pagesjaunes)[^"]+)"/g)]
  .map(m => m[1]).slice(0, 20);
console.log("\nLiens externes:", siteLinks);

await browser.close();
