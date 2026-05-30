import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300 // Pro/Enterprise uniquement — ignoré sur Hobby (max 10s)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = 'https://thelocalboost.fr'

// ── 20 variantes — 4 angles × 5 emails ──────────────────────────────────────

type Fn = (nom: string, secteur: string, ville: string) => string

interface Variant { subject: Fn; hook: Fn; cta: Fn }

const VARIANTS: Variant[] = [
  {
    subject: (n, s, v) => `${n} — quelques pistes sur votre fiche Google`,
    hook: (n, s, v) => `J'ai pris quelques minutes pour consulter la fiche Google de <strong>${n}</strong> à <strong>${v}</strong>.\nQuelques ajustements simples pourraient améliorer sa visibilité auprès de vos futurs clients.`,
    cta: () => `Voir les améliorations possibles →`,
  },
  {
    subject: (n, s, v) => `${n} — des opportunités sur votre fiche Google`,
    hook: (n, s, v) => `La fiche Google de <strong>${n}</strong> contient déjà de bons éléments.\nJ'ai toutefois identifié plusieurs opportunités qui pourraient l'aider à ressortir davantage sur Google Maps.`,
    cta: () => `Voir lesquelles →`,
  },
  {
    subject: (n, s, v) => `En cherchant ${s} à ${v}...`,
    hook: (n, s, v) => `En recherchant des commerces de votre secteur à <strong>${v}</strong>, je suis tombé sur la fiche de <strong>${n}</strong>.\nJ'ai remarqué quelques points faciles à optimiser pour gagner en visibilité.`,
    cta: () => `Découvrir les recommandations →`,
  },
  {
    subject: (n, s, v) => `Ce que vos clients voient sur Google — ${n}`,
    hook: (n, s, v) => `La plupart des commerçants ignorent ce que leurs clients voient réellement sur Google.\nJ'ai regardé la fiche de <strong>${n}</strong> à <strong>${v}</strong> — et j'ai identifié plusieurs points faciles à améliorer.`,
    cta: () => `Voir le diagnostic →`,
  },
  {
    subject: (n, s, v) => `${n} — quelques optimisations à portée de main`,
    hook: (n, s, v) => `J'ai passé quelques minutes sur la présence Google de <strong>${n}</strong> à <strong>${v}</strong>.\nIl y a plusieurs petites optimisations qui pourraient avoir un impact réel sur vos résultats.`,
    cta: () => `Les découvrir →`,
  },
  {
    subject: (n, s, v) => `${n} mérite plus de visibilité à ${v}`,
    hook: (n, s, v) => `<strong>${n}</strong> mérite probablement d'être plus visible qu'aujourd'hui sur Google Maps à <strong>${v}</strong>.\nJ'ai relevé quelques pistes d'amélioration concrètes sur votre fiche.`,
    cta: () => `Voir les détails →`,
  },
  {
    subject: (n, s, v) => `Votre fiche Google à ${v} — quelques observations`,
    hook: (n, s, v) => `Une simple recherche sur Google Maps à <strong>${v}</strong> m'a amené sur la fiche de <strong>${n}</strong>.\nJ'y ai repéré plusieurs éléments qui pourraient être optimisés rapidement.`,
    cta: () => `Voir les opportunités →`,
  },
  {
    subject: (n, s, v) => `${n} — analyse rapide de votre fiche Google`,
    hook: (n, s, v) => `J'analyse régulièrement des fiches Google de commerces locaux en France.\nCelle de <strong>${n}</strong> à <strong>${v}</strong> présente quelques leviers intéressants à exploiter.`,
    cta: () => `Les consulter →`,
  },
  {
    subject: (n, s, v) => `${n} — un rapide aperçu Google`,
    hook: (n, s, v) => `Quelques détails sur la fiche Google de <strong>${n}</strong> pourraient influencer la décision de vos futurs clients à <strong>${v}</strong>.\nJe vous ai préparé un rapide aperçu.`,
    cta: () => `Voir l'analyse →`,
  },
  {
    subject: (n, s, v) => `${n} — votre fiche peut faire plus`,
    hook: (n, s, v) => `La fiche Google de <strong>${n}</strong> est déjà en place — mais elle pourrait probablement travailler davantage pour vous.\nJ'ai identifié plusieurs pistes concrètes pour <strong>${v}</strong>.`,
    cta: () => `Voir lesquelles →`,
  },
  {
    subject: (n, s, v) => `Avez-vous vérifié votre fiche Google récemment ?`,
    hook: (n, s, v) => `Ce que vos clients voient sur Google avant de venir chez vous — avez-vous vérifié récemment ?\nJ'ai consulté la fiche de <strong>${n}</strong> à <strong>${v}</strong> et j'ai quelques observations à partager.`,
    cta: () => `Voir l'analyse →`,
  },
  {
    subject: (n, s, v) => `${n} à ${v} — quelques idées Google Maps`,
    hook: (n, s, v) => `À <strong>${v}</strong>, les recherches Google vers des commerces comme <strong>${n}</strong> sont quotidiennes.\nJ'ai regardé votre fiche — quelques améliorations simples pourraient faire une vraie différence.`,
    cta: () => `Découvrir lesquelles →`,
  },
  {
    subject: (n, s, v) => `${n} — votre fiche pourrait convertir davantage`,
    hook: (n, s, v) => `J'ai consulté la fiche Google de <strong>${n}</strong> ce matin.\nElle est visible — mais elle pourrait convertir bien davantage de curieux en clients réels à <strong>${v}</strong>.`,
    cta: () => `Voir comment →`,
  },
  {
    subject: (n, s, v) => `Ce que voient vos clients sur Google Maps`,
    hook: (n, s, v) => `Savez-vous ce qu'un client potentiel voit en cherchant <strong>${n}</strong> sur Google Maps à <strong>${v}</strong> ?\nJ'ai regardé — et j'ai identifié plusieurs points qui méritent attention.`,
    cta: () => `Voir le rapport →`,
  },
  {
    subject: (n, s, v) => `${n} — quelques ajustements à ${v}`,
    hook: (n, s, v) => `La fiche Google de <strong>${n}</strong> existe. C'est déjà bien.\nMais à <strong>${v}</strong>, quelques ajustements simples pourraient lui donner beaucoup plus de portée.`,
    cta: () => `Voir les pistes →`,
  },
  {
    subject: (n, s, v) => `Quelques observations sur ${n}`,
    hook: (n, s, v) => `En parcourant les fiches Google de commerces à <strong>${v}</strong>, j'ai noté plusieurs choses sur <strong>${n}</strong>.\nCertaines optimisations sont rapides à mettre en place et peuvent avoir un impact direct.`,
    cta: () => `Les voir maintenant →`,
  },
  {
    subject: (n, s, v) => `Vos futurs clients vous cherchent sur Google`,
    hook: (n, s, v) => `Chaque semaine, des clients potentiels cherchent des commerces comme <strong>${n}</strong> sur Google à <strong>${v}</strong>.\nVotre fiche leur donne-t-elle envie de venir ? J'ai quelques observations.`,
    cta: () => `Voir l'analyse →`,
  },
  {
    subject: (n, s, v) => `${n} sur Google Maps — quelques points`,
    hook: (n, s, v) => `J'ai regardé comment <strong>${n}</strong> apparaît sur Google Maps à <strong>${v}</strong>.\nIl y a quelques points simples qui, une fois corrigés, pourraient améliorer nettement votre visibilité.`,
    cta: () => `Voir les détails →`,
  },
  {
    subject: (n, s, v) => `Une fiche Google qui travaille pour vous — ${n}`,
    hook: (n, s, v) => `Une fiche Google bien entretenue peut faire une différence réelle pour un commerce comme <strong>${n}</strong> à <strong>${v}</strong>.\nJ'ai identifié quelques opportunités sur la vôtre.`,
    cta: () => `Les découvrir →`,
  },
  {
    subject: (n, s, v) => `${n} à ${v} — mes recommandations Google`,
    hook: (n, s, v) => `Je travaille sur la visibilité Google des commerces locaux en France.\nJ'ai regardé la fiche de <strong>${n}</strong> à <strong>${v}</strong> — et j'ai quelques recommandations concrètes à vous partager.`,
    cta: () => `Voir les recommandations →`,
  },
]

const N_VARIANTS = VARIANTS.length // 100

function getVariant(variantId: number) {
  return VARIANTS[variantId % N_VARIANTS]
}

// ── Thompson Sampling ────────────────────────────────────────────────────────

function normalRandom(): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function gammaRandom(shape: number): number {
  if (shape < 1) return gammaRandom(1 + shape) * Math.pow(Math.random(), 1 / shape)
  const d = shape - 1 / 3
  const c = 1 / Math.sqrt(9 * d)
  while (true) {
    let x: number, v: number
    do { x = normalRandom(); v = 1 + c * x } while (v <= 0)
    v = v ** 3
    const u = Math.random()
    if (u < 1 - 0.0331 * x ** 4) return d * v
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v
  }
}

function sampleBeta(alpha: number, beta: number): number {
  const g1 = gammaRandom(Math.max(alpha, 0.01))
  const g2 = gammaRandom(Math.max(beta, 0.01))
  return g1 / (g1 + g2)
}

async function pickVariant(stats: Map<number, { sends: number; clicks: number }>): Promise<number> {
  let best = 0
  let bestSample = -1
  for (let id = 0; id < N_VARIANTS; id++) {
    const s = stats.get(id) ?? { sends: 0, clicks: 0 }
    const alpha = s.clicks + 1
    const beta  = Math.max(s.sends - s.clicks, 0) + 1
    const sample = sampleBeta(alpha, beta)
    if (sample > bestSample) { bestSample = sample; best = id }
  }
  return best
}

// ── Chargement des stats ─────────────────────────────────────────────────────

async function loadStats(): Promise<Map<number, { sends: number; clicks: number }>> {
  const stats = new Map<number, { sends: number; clicks: number }>()

  // Envois par variante depuis leads
  const { data: sendData } = await supabase
    .from('leads')
    .select('subject_variant')
    .eq('sent', true)
    .not('subject_variant', 'is', null)

  for (const row of sendData ?? []) {
    const id = parseInt(row.subject_variant)
    if (isNaN(id) || id >= N_VARIANTS) continue
    const s = stats.get(id) ?? { sends: 0, clicks: 0 }
    stats.set(id, { ...s, sends: s.sends + 1 })
  }

  // Clics par variante depuis email_clicks
  const { data: clickData } = await supabase
    .from('email_clicks')
    .select('variant_id')

  for (const row of clickData ?? []) {
    const id = row.variant_id
    if (id === undefined || id >= N_VARIANTS) continue
    const s = stats.get(id) ?? { sends: 0, clicks: 0 }
    stats.set(id, { ...s, clicks: s.clicks + 1 })
  }

  return stats
}

// ── Template email ───────────────────────────────────────────────────────────

function buildEmail(nom: string, ville: string, secteur: string, leadId: number, variantId: number, hookText: string, ctaText: string): string {
  const villeLabel = ville && ville !== 'France' ? ville : 'votre ville'
  const dest = `${APP_URL}?nom=${encodeURIComponent(nom)}&ville=${encodeURIComponent(villeLabel)}&utm_source=outreach&utm_medium=email&utm_campaign=cold&vid=${variantId}`
  const trackUrl = `${APP_URL}/api/track?lid=${leadId}&vid=${variantId}&url=${encodeURIComponent(dest)}`

  const hookHtml = hookText.replace(/\n/g, '<br>')

  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#1a1a1a;font-size:15px;line-height:1.7;">

  <p style="margin:0 0 20px;">Bonjour,</p>

  <p style="margin:0 0 28px;color:#374151;">${hookHtml}</p>

  <p style="margin:0 0 32px;">
    <a href="${trackUrl}" style="display:inline-block;background:#16a34a;color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;padding:11px 22px;border-radius:6px;text-decoration:none;">${ctaText}</a>
  </p>

  <p style="margin:0;font-size:14px;color:#374151;">Brian<br>
  <span style="color:#9ca3af;font-size:12px;">LocalBoost · <a href="mailto:contact@thelocalboost.fr" style="color:#9ca3af;text-decoration:none;">contact@thelocalboost.fr</a></span></p>

  <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0 16px;">
  <p style="color:#d1d5db;font-size:11px;margin:0;">
    Vous recevez cet email car votre établissement est référencé sur Google Maps. ·
    <a href="mailto:contact@thelocalboost.fr?subject=désinscription" style="color:#d1d5db;">Se désinscrire</a>
  </p>

</div>`
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-key') !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { limit = 50, secteur, testEmail } = await req.json()

  let query = supabase
    .from('leads')
    .select('id, nom, email, secteur, ville')
    .eq('sent', false)
    .not('email', 'is', null)
    .or('email_status.is.null,email_status.neq.invalid')
    .limit(limit)

  if (secteur) query = query.eq('secteur', secteur)

  const [{ data: leads, error }, stats] = await Promise.all([query, loadStats()])

  // Mode test : envoie un seul email de démo à l'adresse fournie
  if (testEmail) {
    const lead = leads?.[0] ?? { id: 0, nom: 'Boulangerie Exemple', ville: 'Paris', secteur: 'boulangerie' }
    const variantId = await pickVariant(stats)
    const variant = getVariant(variantId)
    const nom = lead.nom || 'votre établissement'
    const ville = lead.ville || ''
    const secteurLead = lead.secteur || 'commerce'
    const v = ville || 'votre ville'
    const html = buildEmail(nom, ville, secteurLead, lead.id, variantId, variant.hook(nom, secteurLead, v), variant.cta(nom, secteurLead, v))
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
      body: JSON.stringify({
        sender: { name: 'Brian de LocalBoost', email: 'contact@thelocalboost.fr' },
        to: [{ email: testEmail }],
        subject: `[TEST] ${variant.subject(nom, secteurLead, v)}`,
        htmlContent: html,
      }),
    })
    return NextResponse.json({ sent: 0, test: true, preview: { nom, secteur: secteurLead, variantId } })
  }

  if (error || !leads?.length) {
    return NextResponse.json({ sent: 0, message: 'Aucun lead à envoyer' })
  }

  let sent = 0
  const errors: string[] = []
  const variantCounts: Record<number, number> = {}

  for (const lead of leads) {
    const nom    = lead.nom   || 'votre établissement'
    const ville  = lead.ville || ''
    const secteur = lead.secteur || 'commerce'

    const variantId = await pickVariant(stats)
    const variant = getVariant(variantId)
    const v = ville || 'votre ville'
    const subjectText = variant.subject(nom, secteur, v)
    const hookText    = variant.hook(nom, secteur, v)
    const ctaText     = variant.cta(nom, secteur, v)

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
        body: JSON.stringify({
          sender:      { name: 'Brian de LocalBoost', email: 'contact@thelocalboost.fr' },
          to:          [{ email: lead.email, name: nom }],
          subject:     subjectText,
          htmlContent: buildEmail(nom, ville, secteur, lead.id, variantId, hookText, ctaText),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        errors.push(`${lead.email}: ${err.message}`)
        continue
      }

      await supabase
        .from('leads')
        .update({ sent: true, sent_at: new Date().toISOString(), subject_variant: String(variantId) })
        .eq('id', lead.id)

      // Mettre à jour les stats en mémoire pour que les prochains envois du batch bénéficient du même Thompson Sampling
      const s = stats.get(variantId) ?? { sends: 0, clicks: 0 }
      stats.set(variantId, { ...s, sends: s.sends + 1 })

      variantCounts[variantId] = (variantCounts[variantId] ?? 0) + 1
      sent++
    } catch (e: any) {
      errors.push(`${lead.email}: ${e.message}`)
    }
  }

  // Résumé des variantes utilisées
  const topVariants = Object.entries(variantCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => {
      const s = stats.get(Number(id))
      const ctr = s && s.sends > 0 ? ((s.clicks / s.sends) * 100).toFixed(1) : '0.0'
      return { variant: Number(id), sent: count, ctr: `${ctr}%` }
    })

  return NextResponse.json({ sent, top_variants: topVariants, errors: errors.length ? errors : undefined })
}
