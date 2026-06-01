import "dotenv/config";
import axios from "axios";
import { readFileSync, readdirSync, appendFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SENT_FILE = join(__dirname, "sent.csv");

function loadSent() {
  if (!existsSync(SENT_FILE)) return new Set();
  return new Set(readFileSync(SENT_FILE, "utf-8").trim().split("\n").filter(Boolean));
}

function markSent(email) {
  appendFileSync(SENT_FILE, email + "\n", "utf-8");
}

const CSV_FILE = join(__dirname, "leads_clean.csv");
if (!existsSync(CSV_FILE)) { console.error("❌ leads_clean.csv introuvable."); process.exit(1); }

function parseCSV(file) {
  const lines = readFileSync(file, "utf-8").replace(/^﻿/, "").trim().split("\n");
  const headers = lines[0].match(/"([^"]*)"/g).map(v => v.slice(1,-1));
  return lines.slice(1).map(line => {
    const vals = line.match(/"([^"]*)"/g)?.map(v => v.slice(1,-1)) || [];
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] || ""]));
  }).filter(r => r.Email);
}

function isValidLead(c) {
  const nom = c.Nom || ''
  if (nom.length < 3 || nom.length > 80) return false          // trop court ou trop long
  if (nom.split(' ').length > 7) return false                   // phrase entière scrappée
  if (/[<>{}\[\]@#]/.test(nom)) return false                    // caractères suspects
  if (/\d{5,}/.test(nom)) return false                          // numéros de SIRET/tel
  if (/instagram|facebook|twitter|www\.|https?:/i.test(nom)) return false
  if (!c.Ville || c.Ville === 'France') return false            // sans ville réelle
  if (!c.Email?.includes('@')) return false                     // email invalide
  return true
}

const alreadySent = loadSent();
const allContacts = parseCSV(CSV_FILE);
const validContacts = allContacts.filter(isValidLead)
const contacts = validContacts.filter(c => !alreadySent.has(c.Email.toLowerCase()));
console.log(`✅ leads_clean.csv — ${allContacts.length} total → ${validContacts.length} valides → ${contacts.length} à envoyer (${alreadySent.size} déjà envoyés)`);

const LABELS = {
  boulangerie: "boulangerie", restaurant: "restaurant", pharmacie: "pharmacie",
  coiffeur: "salon de coiffure", plombier: "entreprise de plomberie",
  electricien: "entreprise d'électricité", garage: "garage automobile",
  medecin: "cabinet médical", dentiste: "cabinet dentaire", hotel: "hôtel",
  fleuriste: "fleuriste", opticien: "opticien",
};

const HOOKS = {
  boulangerie:  "Un client qui cherche une boulangerie le dimanche matin et ne vous trouve pas… c'est une vente perdue pour toujours.",
  restaurant:   "73% des gens lisent les avis Google avant de choisir un restaurant. Si votre fiche est vide ou mal tenue, ils vont chez le voisin.",
  coiffeur:     "La plupart des salons près de chez vous apparaissent avant vous sur Google Maps — même s'ils sont moins bons.",
  pharmacie:    "Horaires incorrects, numéro manquant : un patient qui ne vous trouve pas en urgence ne revient pas.",
  plombier:     "Quand un client a une fuite à 22h, il appelle le premier plombier qui apparaît sur Google. Ce pourrait être vous.",
  electricien:  "Les urgences électriques se règlent en 30 secondes sur Google. Si vous n'êtes pas visible, c'est votre concurrent qui décroche.",
  garage:       "8 automobilistes sur 10 cherchent un garage sur Google avant d'appeler. Une fiche incomplète = appel manqué.",
  medecin:      "Les patients comparent les médecins en ligne avant de prendre RDV. Votre fiche est votre première impression.",
  dentiste:     "Un cabinet avec des photos, des avis récents et des horaires à jour reçoit 3x plus de nouveaux patients.",
  hotel:        "Sur Google, la différence entre 4,2 et 4,5 étoiles peut représenter des dizaines de réservations en moins chaque mois.",
  fleuriste:    "Mariage, anniversaire, deuil — vos clients cherchent un fleuriste en urgence sur Google. Êtes-vous là quand ils cherchent ?",
  opticien:     "Un opticien avec une fiche Google complète et des avis récents capte 40% de clients en plus dans sa zone.",
};

const delay = ms => new Promise(r => setTimeout(r, ms));

function buildEmail(c) {
  const nom = c.Nom || "votre établissement";
  const secteurKey = c.Secteur?.toLowerCase();
  const secteur = LABELS[secteurKey] || c.Secteur || "commerce local";
  const ville = c.Ville && c.Ville !== "France" ? c.Ville : "votre ville";
  const hook = HOOKS[secteurKey] || `La plupart des ${secteur}s locaux perdent des clients faute de visibilité Google.`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 36px 24px; color: #1a1a1a;">
      <div style="text-align: center; margin: 0 0 32px;">
        <img src="https://thelocalboost.fr/logo.png" alt="LocalBoost" width="160" style="display: inline-block;" />
      </div>
      <p style="font-size: 15px; line-height: 1.7; margin: 0 0 18px;">Bonjour,</p>
      <p style="font-size: 15px; line-height: 1.7; margin: 0 0 18px;">
        En regardant les commerces les plus visibles sur Google à ${ville}, j'ai remarqué votre établissement : <strong>${nom}</strong>.
      </p>
      <p style="font-size: 15px; line-height: 1.7; margin: 0 0 18px; padding: 16px 20px; background: #f9fafb; border-left: 3px solid #16a34a;">
        ${hook}
      </p>
      <p style="font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
        J'ai créé <strong>LocalBoost</strong> pour aider les commerces locaux à identifier rapidement ce qui limite leur visibilité sur Google Maps. En moins de 30 secondes, l'outil analyse votre fiche et met en évidence les points à corriger : avis, photos, horaires, mots-clés et positionnement local.<br><br>
        Aucune inscription, aucune carte bancaire — juste un diagnostic gratuit et immédiat.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://thelocalboost.fr/analyser?nom=${encodeURIComponent(nom)}&ville=${encodeURIComponent(ville)}&utm_source=outreach&utm_medium=email&utm_campaign=cold&secteur=${secteurKey}"
           style="background: #16a34a; color: white; padding: 16px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">
          Voir mon score Google gratuit →
        </a>
      </div>
      <p style="font-size: 13px; color: #888; text-align: center; margin: 0 0 24px;">Analyse gratuite · Aucune carte bancaire · Résultat immédiat</p>
      <p style="font-size: 15px; line-height: 1.7; margin: 0 0 4px;">
        Brian — <span style="color: #16a34a; font-weight: 600;">LocalBoost</span><br>
        <span style="color: #888; font-size: 13px;">contact@thelocalboost.fr</span>
      </p>
      <p style="font-size: 13px; color: #aaa; margin: 4px 0 0;">Plus de 70 commerces déjà analysés partout en France.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0 16px;">
      <p style="color: #bbb; font-size: 12px; margin: 0;">
        Vous avez reçu cet email car votre établissement est référencé publiquement.
        <a href="mailto:contact@thelocalboost.fr?subject=désinscription" style="color: #bbb;">Se désinscrire</a>
      </p>
    </div>
  `;
}

function buildSubject(c) {
  const nom = c.Nom || "votre établissement";
  const subjects = [
    `Votre score Google gratuit — ${nom}`,
    `Ce qui freine la visibilité de ${nom} sur Google`,
    `${nom} : j'ai regardé votre fiche Google`,
    `Votre fiche Google à ${c.Ville || "votre ville"} — un point rapide`,
  ];
  return subjects[Math.abs(nom.charCodeAt(0)) % subjects.length];
}

async function sendEmail(c) {
  const nom = c.Nom || "votre établissement";
  try {
    await axios.post("https://api.brevo.com/v3/smtp/email", {
      sender: { name: process.env.SENDER_NAME, email: process.env.SENDER_EMAIL },
      to: [{ email: c.Email, name: nom }],
      subject: buildSubject(c),
      htmlContent: buildEmail(c),
    }, {
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" }
    });
    markSent(c.Email.toLowerCase());
    console.log(`✅ ${c.Email.padEnd(45)} ${nom.slice(0, 30)}`);
  } catch (err) {
    console.error(`❌ ${c.Email}`, err.response?.data?.message || err.message);
  }
}

const LIMIT = parseInt(process.argv[2]) || contacts.length;

async function main() {
  const batch = contacts.slice(0, LIMIT);
  console.log(`\n📧 Envoi de ${batch.length}/${contacts.length} emails depuis ${allCsvFiles[0]}\n`);
  for (let i = 0; i < batch.length; i++) {
    process.stdout.write(`[${i+1}/${batch.length}] `);
    await sendEmail(batch[i]);
    await delay(3000);
  }
  console.log("\n✅ Terminé !");
}

main();
