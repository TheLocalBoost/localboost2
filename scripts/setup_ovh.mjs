// setup_ovh.mjs — Création 50 comptes email + SPF/DMARC sur fichelocal.net
import crypto from 'crypto';

import 'dotenv/config';
const AK   = process.env.OVH_AK;
const AS   = process.env.OVH_AS;
const CK   = process.env.OVH_CK;
const BASE = 'https://eu.api.ovh.com/1.0';
if (!AK || !AS || !CK) { console.error('Manque OVH_AK / OVH_AS / OVH_CK dans .env'); process.exit(1); }

const DOMAIN   = 'fichelocal.net';
const PASSWORD = process.env.OVH_EMAIL_PASSWORD;
if (!PASSWORD) { console.error('Manque OVH_EMAIL_PASSWORD dans .env'); process.exit(1); }

const ACCOUNTS = [
  // Batch 2 — prénoms masculins
  'hugo','leo','victor','arthur','charles','raphael','felix','gabriel','robin','theo',
  'luc','paul','eric','jean','marc','yves','alain','francois','christophe','olivier',
  'patrick','xavier','ethan','nathan','dylan',
  // Batch 2 — prénoms féminins
  'anne','agnes','isabelle','nathalie','valerie','delphine','aurelie','elodie',
  'jessica','laura','manon','pauline','elisa','amelie','margot',
  'alice','ines','yasmine','nadia','helene','laure','virginie','sandrine','cecile','florence',
];

let delta = 0;

async function initTime() {
  const r = await fetch(`${BASE}/auth/time`);
  const t = await r.json();
  delta = t - Math.floor(Date.now() / 1000);
}

function sign(method, url, body, ts) {
  const pre = `${AS}+${CK}+${method}+${url}+${body}+${ts}`;
  return '$1$' + crypto.createHash('sha1').update(pre).digest('hex');
}

async function ovh(method, path, data = null) {
  const ts   = Math.floor(Date.now() / 1000) + delta;
  const url  = `${BASE}${path}`;
  const body = data !== null ? JSON.stringify(data) : '';
  const sig  = sign(method, url, body, ts);

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type':     'application/json',
      'X-Ovh-Application': AK,
      'X-Ovh-Consumer':    CK,
      'X-Ovh-Timestamp':   String(ts),
      'X-Ovh-Signature':   sig,
    },
    body: data !== null ? body : undefined,
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`  ❌ ${method} ${path} → HTTP ${res.status}: ${text.slice(0, 200)}`);
    return null;
  }
  try { return JSON.parse(text); } catch { return text; }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  await initTime();
  console.log('🕐 Sync OVH OK\n');

  // Vérif domaines disponibles
  const domains = await ovh('GET', '/email/domain');
  console.log('📧 Domaines email disponibles :', domains);

  // Comptes existants
  const existing = await ovh('GET', `/email/domain/${DOMAIN}/account`);
  if (!existing) { console.error('Impossible de lister les comptes. Vérifier les droits API.'); process.exit(1); }
  console.log(`📬 Comptes existants : ${existing.length}`);
  const existingSet = new Set(existing);

  // Création des comptes manquants
  const toCreate = ACCOUNTS.filter(a => !existingSet.has(a));
  console.log(`\n🔨 ${toCreate.length} comptes à créer...\n`);

  let ok = 0, fail = 0;
  for (const name of toCreate) {
    const r = await ovh('POST', `/email/domain/${DOMAIN}/account`, {
      accountName: name,
      password:    PASSWORD,
      description: `outreach-${name}`,
      size:        5000000000,
    });
    if (r !== null) { console.log(`  ✅ ${name}@${DOMAIN}`); ok++; }
    else            { fail++; }
    await sleep(300);
  }
  console.log(`\n📊 ${ok} créés, ${fail} erreurs\n`);

  // Vérifier enregistrements DNS existants
  const records = await ovh('GET', `/domain/zone/${DOMAIN}/record?fieldType=TXT`) ?? [];
  const hasSPF  = records.length > 0;

  // SPF
  console.log('🔒 Vérification SPF...');
  if (!hasSPF) {
    const spf = await ovh('POST', `/domain/zone/${DOMAIN}/record`, {
      fieldType: 'TXT',
      subDomain: '',
      target:    'v=spf1 include:mx.ovh.com ~all',
      ttl:       3600,
    });
    if (spf) console.log('  ✅ SPF créé');
  } else {
    console.log('  ℹ️  Des enregistrements TXT existent — vérifier manuellement si SPF est déjà configuré');
  }

  // DMARC
  console.log('🔒 DMARC...');
  const dmarc = await ovh('POST', `/domain/zone/${DOMAIN}/record`, {
    fieldType: 'TXT',
    subDomain: '_dmarc',
    target:    'v=DMARC1; p=none; rua=mailto:contact@fichelocal.net; pct=100',
    ttl:       3600,
  });
  if (dmarc) console.log('  ✅ DMARC créé');

  // Refresh zone
  await ovh('POST', `/domain/zone/${DOMAIN}/refresh`);
  console.log('\n✅ Zone DNS rafraîchie');

  console.log(`
🎉 Setup fichelocal.net terminé !
   ${ok} comptes email créés
   Mot de passe : ${PASSWORD}
   SPF + DMARC configurés

⚠️  DKIM : activer dans panel OVH → Diagnostique → DKIM
⚠️  fichelocal.com : ajouter en multisite dans l'hébergement, puis relancer ce script avec DOMAIN='fichelocal.com'
`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
