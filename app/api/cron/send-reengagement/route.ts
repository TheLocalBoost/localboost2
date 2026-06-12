// Cron quotidien — re-contacte les leads déjà envoyés (angle différent)
// Utilise email_status='reengaged' pour ne pas envoyer deux fois

import { NextRequest, NextResponse } from 'next/server'
import { createClient }               from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BREVO_KEY  = process.env.BREVO_API_KEY!
const APP_URL    = process.env.NEXT_PUBLIC_URL ?? 'https://www.thelocalboost.fr'
const DAILY_LIMIT = 300

const VARIANTS = [
  {
    subject: (n: string) => `Votre fiche Google — les 3 corrections prioritaires`,
    body: (n: string, v: string) => `Il y a quelques jours, vous avez reçu notre analyse de la fiche Google de <strong>${n}</strong> à <strong>${v}</strong>.<br><br>Voici les 3 corrections qui ont le plus d'impact :<br><br><strong>1.</strong> Ajouter au moins 5 photos récentes — les fiches avec photos reçoivent 42% de demandes en plus.<br><strong>2.</strong> Renseigner des horaires complets — les clients ne rappellent pas si Google dit "horaires inconnus".<br><strong>3.</strong> Répondre aux avis — améliore votre note perçue.`,
    cta: 'Voir mon diagnostic →',
  },
  {
    subject: (n: string) => `${n} — ce que vous perdez chaque semaine sur Google`,
    body: (n: string, v: string) => `Une fiche Google incomplète n'est pas neutre — elle coûte activement des clients.<br><br>Pour un commerce comme <strong>${n}</strong> à <strong>${v}</strong>, les lacunes courantes représentent en moyenne <strong>6 à 12 appels perdus par mois</strong>.<br><br>Le diagnostic est gratuit et prend 2 minutes.`,
    cta: 'Voir mon diagnostic gratuit →',
  },
  {
    subject: (n: string) => `Suite — votre fiche Google`,
    body: (n: string, v: string) => `Je reviens vers vous suite à l'analyse de la fiche Google de <strong>${n}</strong>.<br><br>Cliquez sur le lien ci-dessous — votre fiche est pré-chargée, vous voyez en 30 secondes les 2 ou 3 points à corriger en priorité.`,
    cta: 'Voir les priorités →',
  },
  {
    subject: (n: string) => `Un client sur 3 choisit sur Google Maps`,
    body: (n: string, v: string) => `Aujourd'hui, <strong>1 client sur 3</strong> choisit son prestataire directement depuis Google Maps.<br><br>J'ai regardé comment <strong>${n}</strong> apparaît à <strong>${v}</strong> dans ces recherches. Il y a des leviers simples à activer.`,
    cta: 'Voir le rapport →',
  },
  {
    subject: (n: string) => `2 minutes pour améliorer votre visibilité`,
    body: (n: string, v: string) => `Les changements les plus efficaces sur une fiche Google se font en quelques minutes.<br><br>J'ai identifié les points spécifiques à corriger sur la fiche de <strong>${n}</strong> à <strong>${v}</strong>.`,
    cta: 'Accéder à mon rapport →',
  },
]

function buildEmail(nom: string, ville: string, leadId: string, variantIdx: number, email: string) {
  const v        = ville && ville !== 'France' ? ville : 'votre ville'
  const vnt      = VARIANTS[variantIdx % VARIANTS.length]
  const dest     = `${APP_URL}/analyser?nom=${encodeURIComponent(nom)}&ville=${encodeURIComponent(v)}&email=${encodeURIComponent(email)}&utm_source=brevo&utm_medium=reengagement`
  const trackUrl = `${APP_URL}/api/track?lid=${leadId}&vid=re${variantIdx}&url=${encodeURIComponent(dest)}`
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#1a1a1a;font-size:15px;line-height:1.7;">
  <p style="margin:0 0 20px;">Bonjour,</p>
  <p style="margin:0 0 28px;color:#374151;">${vnt.body(nom, v)}</p>
  <p style="margin:0 0 32px;"><a href="${trackUrl}" style="display:inline-block;background:#2563eb;color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;padding:11px 22px;border-radius:6px;text-decoration:none;">${vnt.cta}</a></p>
  <p style="margin:0;font-size:14px;color:#374151;">Brian<br><span style="color:#9ca3af;font-size:12px;">LocalBoost · contact@thelocalboost.fr</span></p>
  <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0 16px;">
  <p style="color:#d1d5db;font-size:11px;margin:0;">Vous recevez cet email car votre établissement est référencé sur Google Maps. · <a href="mailto:contact@thelocalboost.fr?subject=désinscription" style="color:#d1d5db;">Se désinscrire</a></p>
</div>`
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: leads, error } = await supabase.from('leads')
    .select('id, nom, email, secteur, ville')
    .eq('sent', true)
    .not('email', 'is', null)
    .not('email_status', 'in', '("invalid","bounced","unsubscribed","reengaged")')
    .limit(DAILY_LIMIT)

  if (error || !leads?.length) return NextResponse.json({ sent: 0, reason: error?.message ?? 'no leads' })

  let sent = 0, errors = 0
  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i]
    const nom  = lead.nom   || 'votre établissement'
    const v    = lead.ville || ''

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': BREVO_KEY },
        body: JSON.stringify({
          sender: { name: 'Brian de LocalBoost', email: 'contact@thelocalboost.fr' },
          to: [{ email: lead.email, name: nom }],
          subject: VARIANTS[i % VARIANTS.length].subject(nom),
          htmlContent: buildEmail(nom, v, lead.id, i, lead.email),
        }),
      })
      if (!res.ok) throw new Error((await res.json() as { message: string }).message)
      await supabase.from('leads').update({ email_status: 'reengaged' }).eq('id', lead.id)
      sent++
    } catch { errors++ }
  }

  return NextResponse.json({ sent, errors })
}
