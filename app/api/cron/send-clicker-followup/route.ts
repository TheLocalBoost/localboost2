// Cron — relance ciblée des leads qui ont CLIQUÉ dans un email cold
// Angle : ils ont vu le rapport mais n'ont pas converti → push direct vers l'offre

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BREVO_KEY   = process.env.BREVO_API_KEY!
const APP_URL     = process.env.NEXT_PUBLIC_URL ?? 'https://www.thelocalboost.fr'
const DAILY_LIMIT = 200

const VARIANTS = [
  {
    subject: (n: string) => `Vous avez regardé le rapport de ${n} — une question`,
    body: (n: string, v: string, score: number) => `
Vous avez cliqué sur notre email et consulté l'analyse de la fiche Google de <strong>${n}</strong>.<br><br>
Vous avez vu les problèmes — score de <strong>${score}/100</strong> et les appels manqués qui vont avec.<br><br>
Ma question : qu'est-ce qui vous a retenu ?<br><br>
Si c'est le temps ou les compétences techniques, c'est exactement pour ça qu'on existe. Je m'occupe de tout : corrections, photos, réponses aux avis, optimisation continue — <strong>29€/mois</strong>, sans engagement.`,
    cta: 'Commencer maintenant →',
  },
  {
    subject: (n: string) => `${n} — vous avez vu le diagnostic, voici la solution`,
    body: (n: string, v: string, score: number) => `
Votre fiche Google à <strong>${v}</strong> a un score de <strong>${score}/100</strong>. Vous l'avez vu.<br><br>
La plupart des commerçants dans votre situation nous disent la même chose : "je sais qu'il faut le faire, mais je n'ai pas le temps".<br><br>
C'est normal. Vous avez un commerce à faire tourner.<br><br>
Pour <strong>29€/mois</strong>, on s'en occupe à votre place — corrections, optimisation, suivi mensuel. Résultats visibles en 3 semaines.`,
    cta: 'Je veux que ce soit géré →',
  },
  {
    subject: (n: string) => `Votre fiche Google à ${n} — on peut corriger ça cette semaine`,
    body: (n: string, v: string, score: number) => `
Vous avez consulté le diagnostic de <strong>${n}</strong>.<br><br>
Le score de ${score}/100 n'est pas une fatalité — les corrections sont précises et rapides à appliquer si on s'y met.<br><br>
Je peux m'en occuper cette semaine. <strong>29€/mois</strong>, annulable à tout moment, premier mois remboursé si vous n'êtes pas satisfait.`,
    cta: 'Essayer un mois →',
  },
]

function buildEmail(nom: string, ville: string, score: number, leadId: string, variantIdx: number, email: string) {
  const v    = ville && ville !== 'France' ? ville : 'votre ville'
  const vnt  = VARIANTS[variantIdx % VARIANTS.length]
  const dest = `${APP_URL}/pricing?nom=${encodeURIComponent(nom)}&score=${score}&ville=${encodeURIComponent(v)}&email=${encodeURIComponent(email)}&utm_source=brevo&utm_medium=clicker_followup&utm_campaign=v${variantIdx}`
  const trackUrl = `${APP_URL}/api/track?lid=${leadId}&vid=cf${variantIdx}&url=${encodeURIComponent(dest)}`

  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#1a1a1a;font-size:15px;line-height:1.7;">
  <p style="margin:0 0 20px;">Bonjour,</p>
  <p style="margin:0 0 28px;color:#374151;">${vnt.body(nom, v, score)}</p>
  <p style="margin:0 0 32px;"><a href="${trackUrl}" style="display:inline-block;background:#2563eb;color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;padding:11px 22px;border-radius:6px;text-decoration:none;">${vnt.cta}</a></p>
  <p style="margin:0;font-size:14px;color:#374151;">Brian<br><span style="color:#9ca3af;font-size:12px;">LocalBoost · contact@thelocalboost.fr</span></p>
  <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0 16px;">
  <p style="color:#d1d5db;font-size:11px;margin:0;">Vous recevez cet email car vous avez consulté une analyse LocalBoost. · <a href="mailto:contact@thelocalboost.fr?subject=désinscription" style="color:#d1d5db;">Se désinscrire</a></p>
</div>`
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // 1. Récupérer les lead_ids des cliqueurs
  const { data: clicks } = await supabase
    .from('email_clicks')
    .select('lead_id')
    .not('lead_id', 'is', null)

  const clickerIds = [...new Set((clicks ?? []).map((c: { lead_id: number }) => c.lead_id))]
  if (!clickerIds.length) return NextResponse.json({ sent: 0, reason: 'no clickers in DB' })

  // 2. Leads cliqueurs pas encore relancés
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, nom, email, ville, secteur')
    .in('id', clickerIds)
    .not('email_status', 'in', '("bounced","unsubscribed","clicker_followup")')
    .not('email', 'is', null)
    .limit(DAILY_LIMIT)

  if (error || !leads?.length) {
    return NextResponse.json({ sent: 0, reason: error?.message ?? 'no clickers to followup' })
  }

  // Score par secteur (reprend SCORE_MOYEN de merge_serpapi.js)
  const SCORE: Record<string, number> = {
    coiffeur: 41, barbier: 38, plombier: 34, garagiste: 45,
    restaurant: 52, boulanger: 48, fleuriste: 39, serrurier: 31,
    electricien: 36, pharmacie: 67, opticien: 58, peintre: 29, carreleur: 27,
  }

  let sent = 0, errors = 0
  for (let i = 0; i < leads.length; i++) {
    const lead  = leads[i]
    const nom   = lead.nom   || 'votre établissement'
    const ville = lead.ville || ''
    const score = SCORE[lead.secteur] ?? 35

    try {
      const vnt = VARIANTS[i % VARIANTS.length]
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': BREVO_KEY },
        body: JSON.stringify({
          sender:      { name: 'Brian de LocalBoost', email: 'contact@thelocalboost.fr' },
          to:          [{ email: lead.email, name: nom }],
          subject:     vnt.subject(nom),
          htmlContent: buildEmail(nom, ville, score, lead.id, i, lead.email),
        }),
      })
      if (!res.ok) throw new Error(((await res.json()) as { message: string }).message)

      await supabase.from('leads').update({ email_status: 'clicker_followup' }).eq('id', lead.id)
      sent++
    } catch { errors++ }
  }

  return NextResponse.json({ sent, errors, total_clickers: leads.length })
}
