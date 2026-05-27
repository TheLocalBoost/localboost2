// SCHEDULER.JS – envoie 50 emails/jour à 8h automatiquement
// Usage : node scheduler.js
// Arrêt  : Ctrl+C

import { spawnSync, spawn } from "child_process";
import { existsSync, readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const EMAILS_PER_DAY = 50;
const INTERVAL_MS    = 24 * 60 * 60 * 1000;
const SEND_HOUR      = 8;

function countSent() {
  const sentFile = join(__dirname, "sent.csv");
  if (!existsSync(sentFile)) return 0;
  return readFileSync(sentFile, "utf-8").trim().split("\n").filter(Boolean).length;
}

function countRemaining() {
  const files = readdirSync(__dirname).filter(f => f.startsWith("ALL_LEADS_")).sort();
  const file = files[files.length - 1];
  if (!file) return "?";
  const total = readFileSync(join(__dirname, file), "utf-8").trim().split("\n").length - 1;
  return total - countSent();
}

function log(msg) {
  const now = new Date().toLocaleString("fr-FR");
  console.log(`[${now}] ${msg}`);
}

function formatDelay(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h${m.toString().padStart(2, "0")}`;
}

function sendBatch() {
  const before = countSent();
  log(`📧 Envoi de ${EMAILS_PER_DAY} emails — ${before} déjà envoyés, ${countRemaining()} restants`);
  const result = spawnSync("node", [join(__dirname, "send.js"), String(EMAILS_PER_DAY)], { stdio: "inherit" });
  if (result.error) log(`❌ Erreur : ${result.error.message}`);
  const after = countSent();
  log(`✅ ${after - before} emails envoyés ce batch (total cumulé : ${after})`);
  if (countRemaining() <= 0) {
    log("🎉 Tous les contacts ont été contactés. Arrêt du scheduler.");
    process.exit(0);
  }
}

function msUntilNextSend() {
  const now = new Date();
  const next = new Date();
  next.setHours(SEND_HOUR, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next - now;
}

function start() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log(`║  LocalBoost Scheduler — ${EMAILS_PER_DAY} emails/8h00  ║`);
  console.log("╚══════════════════════════════════════════╝\n");

  const delay = msUntilNextSend();
  const nextDate = new Date(Date.now() + delay);
  log(`🚀 Démarrage — ${countRemaining()} contacts restants`);
  log(`⏰ Premier envoi prévu à ${nextDate.toLocaleString("fr-FR")}`);
  log("   Ctrl+C pour arrêter\n");

  setTimeout(() => {
    sendBatch();
    setInterval(sendBatch, INTERVAL_MS);
  }, delay);

  setInterval(() => {
    const remaining = msUntilNextSend();
    log(`⏳ Prochain envoi dans ${formatDelay(remaining)} — ${countSent()} envoyés au total`);
  }, 3600000);
}

start();
