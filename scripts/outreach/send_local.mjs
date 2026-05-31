/**
 * LocalBoost — envoi email local avec planification et warming automatique
 *
 * Usage :
 *   node send_local.mjs          → lance le planificateur (tourne en continu)
 *   node send_local.mjs --now    → envoie immédiatement (limite du jour)
 *   node send_local.mjs --test   → 1 email test vers ADMIN_EMAIL
 */

import { createClient } from '@supabase/supabase-js'

// ── CONFIG ────────────────────────────────────────────────────────────────────

const CONFIG = {
  hour:       8,            // heure d'envoi
  minute:     0,
  days:       [1,2,3,4,5], // 1=lun ... 5=ven
  adminEmail: 'mandartbrian68@gmail.com',

  // Warming progressif — limite emails/jour selon la semaine de campagne
  warming: [
    { week: 1, limit:  50 },
    { week: 2, limit: 100 },
    { week: 3, limit: 200 },
    { week: 4, limit: 300 }, // max Brevo gratuit
  ],
}

// ── CREDENTIALS ───────────────────────────────────────────────────────────────

const SUPABASE_URL  = 'https://gezgemgrfehsxbbkjwuz.supabase.co'
const SUPABASE_KEY  = 'sb_secret_mSRMkqfgV1teHAy6MAwn3Q_1VOXFbRG'
const BREVO_API_KEY = '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'
const APP_URL       = 'https://thelocalboost.fr'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── WARMING ───────────────────────────────────────────────────────────────────

async function getDailyLimit() {
  const { data } = await supabase
    .from('leads').select('sent_at').eq('sent', true)
    .not('sent_at', 'is', null).order('sent_at', { ascending: true }).limit(1)

  if (!data?.length) {
    const limit = CONFIG.warming[0].limit
    console.log(`\n🌱 Premier envoi — Semaine 1 — limite : ${limit}/jour`)
    return limit
  }

  const daysSinceStart = Math.floor((Date.now() - new Date(data[0].sent_at)) / 86400000)
  const week = Math.floor(daysSinceStart / 7) + 1
  const schedule = [...CONFIG.warming].reverse().find(w => w.week <= week)
  const limit = schedule ? schedule.limit : CONFIG.warming.at(-1).limit

  console.log(`\n📈 Semaine ${week} de campagne (J+${daysSinceStart}) — limite : ${limit}/jour`)
  return limit
}

// ── 20 VARIANTES ──────────────────────────────────────────────────────────────

const VARIANTS = [
  { subject: (n,s,v) => `${n} — quelques pistes sur votre fiche Google`,     hook: (n,s,v) => `J'ai pris quelques minutes pour consulter la fiche Google de <strong>${n}</strong> à <strong>${v}</strong>.\nQuelques ajustements simples pourraient améliorer sa visibilité auprès de vos futurs clients.`,                                                                       cta: () => `Voir les améliorations possibles →` },
  { subject: (n,s,v) => `${n} — des opportunités sur votre fiche Google`,    hook: (n,s,v) => `La fiche Google de <strong>${n}</strong> contient déjà de bons éléments.\nJ'ai toutefois identifié plusieurs opportunités qui pourraient l'aider à ressortir davantage sur Google Maps.`,                                                                             cta: () => `Voir lesquelles →` },
  { subject: (n,s,v) => `En cherchant ${s} à ${v}...`,                       hook: (n,s,v) => `En recherchant des commerces de votre secteur à <strong>${v}</strong>, je suis tombé sur la fiche de <strong>${n}</strong>.\nJ'ai remarqué quelques points faciles à optimiser pour gagner en visibilité.`,                                                               cta: () => `Découvrir les recommandations →` },
  { subject: (n,s,v) => `Ce que vos clients voient sur Google — ${n}`,       hook: (n,s,v) => `La plupart des commerçants ignorent ce que leurs clients voient réellement sur Google.\nJ'ai regardé la fiche de <strong>${n}</strong> à <strong>${v}</strong> — et j'ai identifié plusieurs points faciles à améliorer.`,                                               cta: () => `Voir le diagnostic →` },
  { subject: (n,s,v) => `${n} — quelques optimisations à portée de main`,    hook: (n,s,v) => `J'ai passé quelques minutes sur la présence Google de <strong>${n}</strong> à <strong>${v}</strong>.\nIl y a plusieurs petites optimisations qui pourraient avoir un impact réel sur vos résultats.`,                                                                       cta: () => `Les découvrir →` },
  { subject: (n,s,v) => `${n} mérite plus de visibilité à ${v}`,             hook: (n,s,v) => `<strong>${n}</strong> mérite probablement d'être plus visible qu'aujourd'hui sur Google Maps à <strong>${v}</strong>.\nJ'ai relevé quelques pistes d'amélioration concrètes sur votre fiche.`,                                                                              cta: () => `Voir les détails →` },
  { subject: (n,s,v) => `Votre fiche Google à ${v} — quelques observations`, hook: (n,s,v) => `Une simple recherche sur Google Maps à <strong>${v}</strong> m'a amené sur la fiche de <strong>${n}</strong>.\nJ'y ai repéré plusieurs éléments qui pourraient être optimisés rapidement.`,                                                                                 cta: () => `Voir les opportunités →` },
  { subject: (n,s,v) => `${n} — analyse rapide de votre fiche Google`,       hook: (n,s,v) => `J'analyse régulièrement des fiches Google de commerces locaux en France.\nCelle de <strong>${n}</strong> à <strong>${v}</strong> présente quelques leviers intéressants à exploiter.`,                                                                                    cta: () => `Les consulter →` },
  { subject: (n,s,v) => `${n} — un rapide aperçu Google`,                    hook: (n,s,v) => `Quelques détails sur la fiche Google de <strong>${n}</strong> pourraient influencer la décision de vos futurs clients à <strong>${v}</strong>.\nJe vous ai préparé un rapide aperçu.`,                                                                                    cta: () => `Voir l'analyse →` },
  { subject: (n,s,v) => `${n} — votre fiche peut faire plus`,                hook: (n,s,v) => `La fiche Google de <strong>${n}</strong> est déjà en place — mais elle pourrait probablement travailler davantage pour vous.\nJ'ai identifié plusieurs pistes concrètes pour <strong>${v}</strong>.`,                                                                       cta: () => `Voir lesquelles →` },
  { subject: (n,s,v) => `Avez-vous vérifié votre fiche Google récemment ?`,  hook: (n,s,v) => `Ce que vos clients voient sur Google avant de venir chez vous — avez-vous vérifié récemment ?\nJ'ai consulté la fiche de <strong>${n}</strong> à <strong>${v}</strong> et j'ai quelques observations à partager.`,                                                         cta: () => `Voir l'analyse →` },
  { subject: (n,s,v) => `${n} à ${v} — quelques idées Google Maps`,          hook: (n,s,v) => `À <strong>${v}</strong>, les recherches Google vers des commerces comme <strong>${n}</strong> sont quotidiennes.\nJ'ai regardé votre fiche — quelques améliorations simples pourraient faire une vraie différence.`,                                                        cta: () => `Découvrir lesquelles →` },
  { subject: (n,s,v) => `${n} — votre fiche pourrait convertir davantage`,   hook: (n,s,v) => `J'ai consulté la fiche Google de <strong>${n}</strong> ce matin.\nElle est visible — mais elle pourrait convertir bien davantage de curieux en clients réels à <strong>${v}</strong>.`,                                                                                    cta: () => `Voir comment →` },
  { subject: (n,s,v) => `Ce que voient vos clients sur Google Maps`,         hook: (n,s,v) => `Savez-vous ce qu'un client potentiel voit en cherchant <strong>${n}</strong> sur Google Maps à <strong>${v}</strong> ?\nJ'ai regardé — et j'ai identifié plusieurs points qui méritent attention.`,                                                                         cta: () => `Voir le rapport →` },
  { subject: (n,s,v) => `${n} — quelques ajustements à ${v}`,                hook: (n,s,v) => `La fiche Google de <strong>${n}</strong> existe. C'est déjà bien.\nMais à <strong>${v}</strong>, quelques ajustements simples pourraient lui donner beaucoup plus de portée.`,                                                                                            cta: () => `Voir les pistes →` },
  { subject: (n,s,v) => `Quelques observations sur ${n}`,                    hook: (n,s,v) => `En parcourant les fiches Google de commerces à <strong>${v}</strong>, j'ai noté plusieurs choses sur <strong>${n}</strong>.\nCertaines optimisations sont rapides à mettre en place et peuvent avoir un impact direct.`,                                                    cta: () => `Les voir maintenant →` },
  { subject: (n,s,v) => `Vos futurs clients vous cherchent sur Google`,       hook: (n,s,v) => `Chaque semaine, des clients potentiels cherchent des commerces comme <strong>${n}</strong> sur Google à <strong>${v}</strong>.\nVotre fiche leur donne-t-elle envie de venir ? J'ai quelques observations.`,                                                              cta: () => `Voir l'analyse →` },
  { subject: (n,s,v) => `${n} sur Google Maps — quelques points`,            hook: (n,s,v) => `J'ai regardé comment <strong>${n}</strong> apparaît sur Google Maps à <strong>${v}</strong>.\nIl y a quelques points simples qui, une fois corrigés, pourraient améliorer nettement votre visibilité.`,                                                                    cta: () => `Voir les détails →` },
  { subject: (n,s,v) => `Une fiche Google qui travaille pour vous — ${n}`,   hook: (n,s,v) => `Une fiche Google bien entretenue peut faire une différence réelle pour un commerce comme <strong>${n}</strong> à <strong>${v}</strong>.\nJ'ai identifié quelques opportunités sur la vôtre.`,                                                                              cta: () => `Les découvrir →` },
  { subject: (n,s,v) => `${n} à ${v} — mes recommandations Google`,          hook: (n,s,v) => `Je travaille sur la visibilité Google des commerces locaux en France.\nJ'ai regardé la fiche de <strong>${n}</strong> à <strong>${v}</strong> — et j'ai quelques recommandations concrètes à vous partager.`,                                                             cta: () => `Voir les recommandations →` },
]

// ── THOMPSON SAMPLING ─────────────────────────────────────────────────────────

function normalRandom() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
function gammaRandom(shape) {
  if (shape < 1) return gammaRandom(1 + shape) * Math.pow(Math.random(), 1 / shape)
  const d = shape - 1 / 3, c = 1 / Math.sqrt(9 * d)
  while (true) {
    let x, v
    do { x = normalRandom(); v = 1 + c * x } while (v <= 0)
    v = v ** 3
    const u = Math.random()
    if (u < 1 - 0.0331 * x ** 4) return d * v
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v
  }
}
function sampleBeta(alpha, beta) {
  const g1 = gammaRandom(Math.max(alpha, 0.01))
  const g2 = gammaRandom(Math.max(beta, 0.01))
  return g1 / (g1 + g2)
}
async function loadStats() {
  const stats = new Map()
  const { data: sends } = await supabase.from('leads').select('subject_variant').eq('sent', true).not('subject_variant', 'is', null)
  for (const r of sends ?? []) {
    const id = parseInt(r.subject_variant)
    if (isNaN(id)) continue
    const s = stats.get(id) ?? { sends: 0, clicks: 0 }
    stats.set(id, { ...s, sends: s.sends + 1 })
  }
  const { data: clicks } = await supabase.from('email_clicks').select('variant_id')
  for (const r of clicks ?? []) {
    const s = stats.get(r.variant_id) ?? { sends: 0, clicks: 0 }
    stats.set(r.variant_id, { ...s, clicks: s.clicks + 1 })
  }
  return stats
}
function pickVariant(stats) {
  let best = 0, bestSample = -1
  for (let id = 0; id < VARIANTS.length; id++) {
    const s = stats.get(id) ?? { sends: 0, clicks: 0 }
    const sample = sampleBeta(s.clicks + 1, Math.max(s.sends - s.clicks, 0) + 1)
    if (sample > bestSample) { bestSample = sample; best = id }
  }
  return best
}

// ── EMAIL ─────────────────────────────────────────────────────────────────────

function buildEmail(nom, ville, leadId, variantId, hookText, ctaText) {
  const villeLabel = ville && ville !== 'France' ? ville : 'votre ville'
  const dest = `${APP_URL}?nom=${encodeURIComponent(nom)}&ville=${encodeURIComponent(villeLabel)}&utm_source=outreach&utm_medium=email&utm_campaign=cold&vid=${variantId}`
  const trackUrl = `${APP_URL}/api/track?lid=${leadId}&vid=${variantId}&url=${encodeURIComponent(dest)}`
  const hookHtml = hookText.replace(/\n/g, '<br>')
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#1a1a1a;font-size:15px;line-height:1.7;">
  <p style="margin:0 0 20px;">Bonjour,</p>
  <p style="margin:0 0 28px;color:#374151;">${hookHtml}</p>
  <p style="margin:0 0 32px;"><a href="${trackUrl}" style="display:inline-block;background:#16a34a;color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;padding:11px 22px;border-radius:6px;text-decoration:none;">${ctaText}</a></p>
  <p style="margin:0;font-size:14px;color:#374151;">Brian<br><span style="color:#9ca3af;font-size:12px;">LocalBoost · contact@thelocalboost.fr</span></p>
  <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0 16px;">
  <p style="color:#d1d5db;font-size:11px;margin:0;">Vous recevez cet email car votre établissement est référencé sur Google Maps. · <a href="mailto:contact@thelocalboost.fr?subject=désinscription" style="color:#d1d5db;">Se désinscrire</a></p>
</div>`
}

// ── BATCH ─────────────────────────────────────────────────────────────────────

async function runBatch(batchSize, testMode = false) {
  const ts = new Date().toLocaleString('fr-FR')
  console.log(`\n📤 [${ts}] Envoi de ${batchSize} emails${testMode ? ' (TEST)' : ''}`)

  const [{ data: leads, error }, stats] = await Promise.all([
    supabase.from('leads')
      .select('id, nom, email, secteur, ville')
      .eq('sent', false)
      .not('email', 'is', null)
      .or('email_status.is.null,email_status.neq.invalid')
      .limit(batchSize),
    loadStats(),
  ])

  if (error) { console.error('❌ Supabase:', error.message); return }
  if (!leads?.length) { console.log('ℹ️  Aucun lead disponible.'); return }
  console.log(`📋 ${leads.length} leads chargés`)

  let sent = 0, errors = 0

  for (const lead of leads) {
    const nom     = lead.nom     || 'votre établissement'
    const ville   = lead.ville   || ''
    const secteur = lead.secteur || 'commerce'
    const v       = ville || 'votre ville'

    const variantId = pickVariant(stats)
    const variant   = VARIANTS[variantId % VARIANTS.length]
    const subject   = testMode ? `[TEST] ${variant.subject(nom, secteur, v)}` : variant.subject(nom, secteur, v)
    const html      = buildEmail(nom, ville, lead.id, variantId, variant.hook(nom, secteur, v), variant.cta(nom, secteur, v))
    const to        = testMode ? CONFIG.adminEmail : lead.email

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
        body: JSON.stringify({
          sender: { name: 'Brian de LocalBoost', email: 'contact@thelocalboost.fr' },
          to: [{ email: to, name: nom }],
          subject, htmlContent: html,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).message)

      if (!testMode) {
        await supabase.from('leads')
          .update({ sent: true, sent_at: new Date().toISOString(), subject_variant: String(variantId) })
          .eq('id', lead.id)
        const s = stats.get(variantId) ?? { sends: 0, clicks: 0 }
        stats.set(variantId, { ...s, sends: s.sends + 1 })
      }
      sent++
      process.stdout.write(`\r  ✅ ${sent}/${leads.length}...`)
    } catch (e) {
      errors++
      console.error(`\n  ❌ ${lead.email}: ${e.message}`)
    }
  }

  console.log(`\n\n✅ ${sent} envoyés · ${errors} erreurs`)

  // Top variantes
  const top = [...stats.entries()].filter(([,s]) => s.sends >= 3)
    .sort((a,b) => (b[1].clicks/b[1].sends) - (a[1].clicks/a[1].sends)).slice(0,3)
  if (top.length) {
    console.log('🧠 Thompson Sampling top variantes :')
    for (const [id, s] of top)
      console.log(`   #${id} — ${s.sends} envois · CTR ${((s.clicks/s.sends)*100).toFixed(1)}%`)
  }
}

// ── PLANIFICATEUR ─────────────────────────────────────────────────────────────

function msUntilNext() {
  const now = new Date(), next = new Date()
  next.setHours(CONFIG.hour, CONFIG.minute, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  while (!CONFIG.days.includes(next.getDay())) next.setDate(next.getDate() + 1)
  return next - now
}

function fmt(ms) {
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000)
  return `${h}h${String(m).padStart(2,'0')}min`
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

const DAYS_FR = ['dim','lun','mar','mer','jeu','ven','sam']
const args = process.argv.slice(2)

if (args.includes('--test')) {
  console.log('🧪 Test → 1 email vers', CONFIG.adminEmail)
  await runBatch(1, true)
  process.exit(0)
}

if (args.includes('--now')) {
  const limit = await getDailyLimit()
  await runBatch(limit)
  process.exit(0)
}

// Planificateur
console.log('\n📅 LocalBoost — Planificateur démarré')
console.log(`   Jours  : ${CONFIG.days.map(d => DAYS_FR[d]).join(', ')}`)
console.log(`   Heure  : ${CONFIG.hour}h${String(CONFIG.minute).padStart(2,'0')}`)
console.log(`   Warming: ${CONFIG.warming.map(w => `S${w.week}→${w.limit}/j`).join(' · ')}`)

async function scheduleNext() {
  const ms = msUntilNext()
  const nextDate = new Date(Date.now() + ms)
  console.log(`\n⏰ Prochain envoi : ${nextDate.toLocaleString('fr-FR')} (dans ${fmt(ms)})`)
  setTimeout(async () => {
    const limit = await getDailyLimit()
    await runBatch(limit)
    scheduleNext()
  }, ms)
}

scheduleNext()
