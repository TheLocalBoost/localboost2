// Cron J+1 — rappel aux leads qui ont visité /pricing mais pas payé
// Source : table waitlist (source = 'outreach_click') sans stripe_customer_id

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

const supabase   = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const BREVO_KEY  = process.env.BREVO_API_KEY!
const APP_URL    = process.env.NEXT_PUBLIC_URL ?? 'https://www.thelocalboost.fr'

function buildEmail(email: string, nom: string, ville: string, score: number) {
  const pricingUrl = `${APP_URL}/pricing?nom=${encodeURIComponent(nom)}&ville=${encodeURIComponent(ville)}&score=${score}&email=${encodeURIComponent(email)}&utm_source=brevo&utm_medium=reminder_j1`

  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#1a1a1a;font-size:15px;line-height:1.7;">
  <p style="margin:0 0 20px;">Bonjour,</p>
  <p style="margin:0 0 20px;color:#374151;">Hier, vous avez regardé l'analyse de la fiche Google de <strong>${nom}</strong> à <strong>${ville}</strong>.</p>
  <p style="margin:0 0 20px;color:#374151;">Score actuel : <strong>${score}/100</strong>. Votre fiche perd des appels chaque jour où elle reste dans cet état.</p>
  <p style="margin:0 0 28px;color:#374151;">Votre accès est encore disponible. Un clic, et on s'en occupe dès aujourd'hui.</p>
  <p style="margin:0 0 32px;"><a href="${pricingUrl}" style="display:inline-block;background:#2563eb;color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;padding:11px 22px;border-radius:6px;text-decoration:none;">Activer mon accès — 29€/mois →</a></p>
  <p style="margin:0;font-size:14px;color:#374151;">Brian<br><span style="color:#9ca3af;font-size:12px;">LocalBoost · contact@thelocalboost.fr</span></p>
  <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0 16px;">
  <p style="color:#d1d5db;font-size:11px;margin:0;">· <a href="mailto:contact@thelocalboost.fr?subject=désinscription" style="color:#d1d5db;">Se désinscrire</a></p>
</div>`
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  // Leads qui ont visité depuis hier (via outreach), pas encore payé, pas déjà relancé
  const { data: leads } = await supabase
    .from('waitlist')
    .select('email, commerce_name, city, score, reminded_j1')
    .eq('source', 'outreach_click')
    .gte('created_at', twoDaysAgo)
    .lte('created_at', yesterday)
    .not('reminded_j1', 'is', true)
    .not('email', 'is', null)
    .limit(100)

  if (!leads?.length) return NextResponse.json({ sent: 0 })

  let sent = 0, errors = 0
  for (const lead of leads) {
    const nom   = lead.commerce_name || 'votre établissement'
    const ville = lead.city          || ''
    const score = parseInt(lead.score ?? '0') || 35

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': BREVO_KEY },
        body: JSON.stringify({
          sender:      { name: 'Brian de LocalBoost', email: 'contact@thelocalboost.fr' },
          to:          [{ email: lead.email, name: nom }],
          subject:     `${nom} — votre accès est encore disponible`,
          htmlContent: buildEmail(lead.email, nom, ville, score),
        }),
      })
      if (!res.ok) throw new Error(((await res.json()) as { message: string }).message)

      await supabase.from('waitlist').update({ reminded_j1: true }).eq('email', lead.email)
      sent++
    } catch { errors++ }
  }

  return NextResponse.json({ sent, errors })
}
