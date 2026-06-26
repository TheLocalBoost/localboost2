import { readFileSync, readdirSync, existsSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const dir = join(__dirname, "outreach")

const sentEmails = new Set(readFileSync(join(dir,"sent.csv"),"utf8").trim().split("\n").filter(Boolean).map(e=>e.toLowerCase().trim()))
const bounced = new Set(existsSync(join(dir,"bounced.csv")) ? readFileSync(join(dir,"bounced.csv"),"utf8").trim().split("\n").map(e=>e.toLowerCase().trim()) : [])

const FAUX_VILLES = new Set(["france","île-de-france","occitanie","bretagne","normandie","nouvelle-aquitaine","bourgogne","pays de la loire","provence-alpes","paca","corse"])
const GENERIC = /^(contact|info|admin|webmaster|support|hello|service|mairie|secretariat|commercial|direction|recrutement|no-reply|noreply|comptabilite|accueil|reception|rh|facturation|reservation|vente|sav|test|demo|exemple|example|user|email|mail)$/i
const BAD_DOMAINS = new Set(["example.com","example.fr","exemple.fr","test.com","test.fr","domain.com"])

function isValidEmail(e) {
  if (!e) return false
  e = e.trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9._%+\-]*[a-z0-9]@[a-z0-9][a-z0-9.\-]*\.[a-z]{2,}$/.test(e)) return false
  const local = e.split("@")[0]
  if (local.length <= 3) return false
  if (GENERIC.test(local)) return false
  if (BAD_DOMAINS.has(e.split("@")[1])) return false
  return true
}

const seen = new Set()
const newRows = []
const files = readdirSync(dir).filter(f => (f.startsWith("gmaps_") || f.startsWith("bing_")) && f.endsWith(".csv"))

let total = 0, newLeads = 0

for (const f of files) {
  const lines = readFileSync(join(dir,f),"utf8").replace(/^﻿/,"").trim().split("\n")
  if (lines.length < 2) continue
  const raw = lines[0]
  const headers = raw.includes('"') ? raw.match(/"([^"]*)"/g).map(v=>v.slice(1,-1)) : raw.split(",")
  const emailIdx = headers.findIndex(h => h.toLowerCase() === "email")
  const villeIdx = headers.findIndex(h => h.toLowerCase() === "ville")
  if (emailIdx === -1) continue

  if (newRows.length === 0) newRows.push(raw)

  for (const line of lines.slice(1)) {
    const vals = line.includes('"') ? line.match(/"([^"]*)"/g)?.map(v=>v.slice(1,-1)) : line.split(",")
    if (!vals) continue
    const email = (vals[emailIdx]||"").trim().toLowerCase()
    const ville = (vals[villeIdx]||"").trim().toLowerCase()
    if (!isValidEmail(email)) continue
    if (FAUX_VILLES.has(ville)) continue
    total++
    if (!sentEmails.has(email) && !bounced.has(email) && !seen.has(email)) {
      newLeads++
      seen.add(email)
      newRows.push(line)
    }
  }
}

console.log("Total leads valides:", total)
console.log("Deja envoyes (sent.csv):", sentEmails.size)
console.log("Nouveaux non envoyes:", newLeads)
console.log("Fichiers CSV scrapees:", files.length)

if (newLeads > 0) {
  writeFileSync(join(dir, "leads_all.csv"), newRows.join("\n") + "\n", "utf8")
  console.log("leads_all.csv regenere avec", newLeads, "nouveaux leads")
} else {
  console.log("Aucun nouveau lead — leads_all.csv inchange")
}
