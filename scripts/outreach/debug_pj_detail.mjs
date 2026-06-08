import { chromium } from "playwright";
import { writeFileSync } from "fs";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  locale: "fr-FR",
});
const page = await ctx.newPage();
await page.goto("https://www.pagesjaunes.fr/pros/62980222", { waitUntil: "networkidle", timeout: 20000 });
await page.waitForTimeout(3000);
const html = await page.content();
writeFileSync("scripts/outreach/pj_detail_debug.html", html);

// Chercher tous les liens
const allLinks = await page.evaluate(() =>
  [...document.querySelectorAll('a')].map(a => ({
    href: a.getAttribute('href') ?? '',
    text: a.textContent?.trim().slice(0, 30),
    cls: a.className?.slice(0, 50)
  })).filter(l => l.href && !l.href.startsWith('#'))
);
console.log("Tous les liens:");
allLinks.slice(0, 30).forEach(l => console.log(` ${l.cls.padEnd(50)} | ${l.href.slice(0,60)} | ${l.text}`));
await browser.close();
