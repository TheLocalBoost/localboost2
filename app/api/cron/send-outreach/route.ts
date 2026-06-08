// Cron quotidien — envoie le batch de nouveaux leads (ex: 100/jour en semaine 2)
// Même logique que send_local.mjs --now, mais en API route Vercel

import { NextRequest, NextResponse } from 'next/server'
import { createClient }               from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BREVO_KEY = process.env.BREVO_API_KEY!
const APP_URL   = process.env.NEXT_PUBLIC_URL ?? 'https://www.thelocalboost.fr'

// Warming : limite par semaine de campagne
const WARMING = [
  { week: 1, limit:  50 },
  { week: 2, limit: 100 },
  { week: 3, limit: 200 },
  { week: 4, limit: 300 },
]

async function getDailyLimit(): Promise<number> {
  const { data } = await supabase.from('leads').select('sent_at')
    .eq('sent', true).not('sent_at', 'is', null)
    .order('sent_at', { ascending: true }).limit(1)
  if (!data?.length) return WARMING[0].limit
  const days = Math.floor((Date.now() - new Date(data[0].sent_at).getTime()) / 86400000)
  const week = Math.floor(days / 7) + 1
  const s = [...WARMING].reverse().find(w => w.week <= week)
  return s ? s.limit : WARMING.at(-1)!.limit
}

const VARIANTS = [
  { subject: (n: string, s: string, v: string) => `${n} — quelques pistes sur votre fiche Google`,     hook: (n: string, _s: string, v: string) => `J'ai pris quelques minutes pour consulter la fiche Google de <strong>${n}</strong> à <strong>${v}</strong>.\nQuelques ajustements simples pourraient améliorer sa visibilité.`, cta: () => `Voir les améliorations →` },
  { subject: (n: string, s: string, v: string) => `${n} — des opportunités sur votre fiche Google`,    hook: (n: string, _s: string, v: string) => `La fiche Google de <strong>${n}</strong> contient déjà de bons éléments.\nJ'ai identifié plusieurs opportunités pour ressortir davantage sur Google Maps.`,                         cta: () => `Voir lesquelles →` },
  { subject: (_n: string, s: string, v: string) => `En cherchant ${s} à ${v}...`,                      hook: (n: string, _s: string, v: string) => `En recherchant des commerces à <strong>${v}</strong>, je suis tombé sur la fiche de <strong>${n}</strong>.\nJ'ai remarqué quelques points faciles à optimiser.`,                              cta: () => `Voir les recommandations →` },
  { subject: (n: string, _s: string, _v: string) => `Ce que vos clients voient sur Google — ${n}`,    hook: (n: string, _s: string, v: string) => `La plupart des commerçants ignorent ce que leurs clients voient sur Google.\nJ'ai regardé la fiche de <strong>${n}</strong> à <strong>${v}</strong>.`,                                         cta: () => `Voir le diagnostic →` },
  { subject: (n: string, _s: string, _v: string) => `${n} mérite plus de visibilité`,                 hook: (n: string, _s: string, v: string) => `<strong>${n}</strong> mérite d'être plus visible sur Google Maps à <strong>${v}</strong>.\nJ'ai relevé quelques pistes d'amélioration concrètes.`,                                             cta: () => `Voir les détails →` },
  { subject: (n: string, _s: string, _v: string) => `${n} — votre fiche peut faire plus`,             hook: (n: string, _s: string, v: string) => `La fiche Google de <strong>${n}</strong> est déjà en place — mais elle pourrait travailler davantage pour vous à <strong>${v}</strong>.`,                                                       cta: () => `Voir lesquelles →` },
  { subject: (n: string, _s: string, v: string) => `Votre fiche Google à ${v} — observations`,        hook: (n: string, _s: string, v: string) => `Une recherche sur Google Maps à <strong>${v}</strong> m'a amené sur la fiche de <strong>${n}</strong>.\nJ'y ai repéré des éléments optimisables.`,                                             cta: () => `Voir les opportunités →` },
  { subject: (n: string, _s: string, _v: string) => `${n} — analyse rapide de votre fiche`,           hook: (n: string, _s: string, v: string) => `J'analyse régulièrement des fiches Google en France.\nCelle de <strong>${n}</strong> à <strong>${v}</strong> présente des leviers intéressants.`,                                             cta: () => `Les consulter →` },
  { subject: (n: string, _s: string, _v: string) => `${n} — un rapide aperçu Google`,                 hook: (n: string, _s: string, v: string) => `Quelques détails sur la fiche de <strong>${n}</strong> pourraient influencer vos futurs clients à <strong>${v}</strong>.`,                                                                       cta: () => `Voir l'analyse →` },
  { subject: (n: string, _s: string, _v: string) => `Avez-vous vérifié votre fiche Google ?`,         hook: (n: string, _s: string, v: string) => `Ce que vos clients voient sur Google avant de venir — avez-vous vérifié récemment ?\nJ'ai consulté la fiche de <strong>${n}</strong> à <strong>${v}</strong>.`,                               cta: () => `Voir l'analyse →` },
]

function buildEmail(nom: string, ville: string, leadId: string, variantId: number, hook: string, cta: string) {
  const v        = ville && ville !== 'France' ? ville : 'votre ville'
  const dest     = `${APP_URL}?nom=${encodeURIComponent(nom)}&ville=${encodeURIComponent(v)}&utm_source=outreach&utm_medium=email&utm_campaign=cold&vid=${variantId}`
  const trackUrl = `${APP_URL}/api/track?lid=${leadId}&vid=${variantId}&url=${encodeURIComponent(dest)}`
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#1a1a1a;font-size:15px;line-height:1.7;">
  <p style="margin:0 0 20px;">Bonjour,</p>
  <p style="margin:0 0 28px;color:#374151;">${hook.replace(/\n/g, '<br>')}</p>
  <p style="margin:0 0 32px;"><a href="${trackUrl}" style="display:inline-block;background:#16a34a;color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;padding:11px 22px;border-radius:6px;text-decoration:none;">${cta}</a></p>
  <p style="margin:0;font-size:14px;color:#374151;">Brian<br><span style="color:#9ca3af;font-size:12px;">LocalBoost · contact@thelocalboost.fr</span></p>
  <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0 16px;">
  <p style="color:#d1d5db;font-size:11px;margin:0;">Vous recevez cet email car votre établissement est référencé sur Google Maps. · <a href="mailto:contact@thelocalboost.fr?subject=désinscription" style="color:#d1d5db;">Se désinscrire</a></p>
</div>`
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const limit = await getDailyLimit()

  const { data: leads, error } = await supabase.from('leads')
    .select('id, nom, email, secteur, ville')
    .eq('sent', false)
    .not('email', 'is', null)
    .or('email_status.is.null,email_status.neq.invalid')
    .limit(limit)

  if (error || !leads?.length) return NextResponse.json({ sent: 0, reason: error?.message ?? 'no leads' })

  // Stats Thompson Sampling
  const { data: sentRows } = await supabase.from('leads').select('subject_variant').eq('sent', true).not('subject_variant', 'is', null)
  const { data: clickRows } = await supabase.from('email_clicks').select('variant_id')
  const stats = new Map<number, { sends: number; clicks: number }>()
  for (const r of sentRows ?? []) {
    const id = parseInt(r.subject_variant); if (isNaN(id)) continue
    const s = stats.get(id) ?? { sends: 0, clicks: 0 }; stats.set(id, { ...s, sends: s.sends + 1 })
  }
  for (const r of clickRows ?? []) {
    const s = stats.get(r.variant_id) ?? { sends: 0, clicks: 0 }; stats.set(r.variant_id, { ...s, clicks: s.clicks + 1 })
  }

  // Thompson sampling
  function pickVariant() {
    let best = 0, bestS = -1
    for (let i = 0; i < VARIANTS.length; i++) {
      const s = stats.get(i) ?? { sends: 0, clicks: 0 }
      const g1 = Math.random() ** (1 / (s.clicks + 1)), g2 = Math.random() ** (1 / Math.max(s.sends - s.clicks, 0) + 1)
      const sample = g1 / (g1 + g2)
      if (sample > bestS) { bestS = sample; best = i }
    }
    return best
  }

  let sent = 0, errors = 0
  for (const lead of leads) {
    const nom  = lead.nom   || 'votre établissement'
    const v    = lead.ville || ''
    const s    = lead.secteur || 'commerce'
    const vid  = pickVariant()
    const vnt  = VARIANTS[vid % VARIANTS.length]

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': BREVO_KEY },
        body: JSON.stringify({
          sender: { name: 'Brian de LocalBoost', email: 'contact@thelocalboost.fr' },
          to: [{ email: lead.email, name: nom }],
          subject: vnt.subject(nom, s, v || 'votre ville'),
          htmlContent: buildEmail(nom, v, lead.id, vid, vnt.hook(nom, s, v || 'votre ville'), vnt.cta()),
        }),
      })
      if (!res.ok) throw new Error((await res.json() as { message: string }).message)
      await supabase.from('leads').update({ sent: true, sent_at: new Date().toISOString(), subject_variant: String(vid) }).eq('id', lead.id)
      sent++
    } catch { errors++ }
  }

  return NextResponse.json({ sent, errors, limit })
}
