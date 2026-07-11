import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL  = process.env.NEXT_PUBLIC_URL ?? 'https://www.thelocalboost.fr'
const FROM     = 'contact@thelocalboost.fr'
const DELAY_MS = 20 * 60 * 1000  // 20 minutes

function buildTransporter() {
  return nodemailer.createTransport({
    host: 'ssl0.ovh.net', port: 587, secure: false, requireTLS: true,
    auth: { user: FROM, pass: process.env.OVH_TLB_PASSWORD },
    tls: { rejectUnauthorized: false },
    pool: true, maxConnections: 1,
  })
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // En pause — plus de page pricing publique à prix fixe à relancer (vente
  // négociée au cas par cas désormais). Retirer ce garde-fou pour réactiver.
  return NextResponse.json({ sent: 0, paused: true })

  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const cutoff20m = new Date(Date.now() - DELAY_MS).toISOString()

  // Entrées éligibles : visite > 20 min, pas encore envoyé, pas converti
  const { data: candidates } = await sb
    .from('pricing_exits')
    .select('id, email, nom, ville, unsub_token, followup_sent_at')
    .eq('followup_sent', false)
    .eq('converted', false)
    .lte('last_visit_at', cutoff20m)
    .limit(50)

  if (!candidates?.length) return NextResponse.json({ sent: 0 })

  // Cooldown : exclure les emails qui ont reçu un followup dans les 24h
  const { data: recentlySent } = await sb
    .from('pricing_exits')
    .select('email')
    .eq('followup_sent', true)
    .gte('followup_sent_at', cutoff24h)

  const recentEmails = new Set(recentlySent?.map(r => r.email) ?? [])

  // Exclure les désinscrits
  const emailsToCheck = candidates.map(c => c.email)
  const { data: unsubData } = await sb
    .from('unsubscribed')
    .select('email')
    .in('email', emailsToCheck)

  const unsubEmails = new Set(unsubData?.map(u => u.email) ?? [])

  const eligible = candidates.filter(c =>
    !recentEmails.has(c.email) && !unsubEmails.has(c.email)
  )

  if (!eligible.length) return NextResponse.json({ sent: 0, reason: 'cooldown or unsubscribed' })

  const transporter = buildTransporter()
  let sent = 0

  for (const row of eligible) {
    // Re-vérifier converted juste avant envoi (protection race condition Stripe)
    const { data: fresh } = await sb
      .from('pricing_exits')
      .select('converted')
      .eq('id', row.id)
      .single()

    if (fresh?.converted) continue

    const nom        = row.nom   || 'votre établissement'
    const ville      = row.ville || 'votre ville'
    const pricingUrl = `${APP_URL}/pricing?email=${encodeURIComponent(row.email)}&nom=${encodeURIComponent(nom)}&city=${encodeURIComponent(ville)}`
    const unsubUrl   = `${APP_URL}/api/unsub-pricing/${row.unsub_token}`

    const subject = `${nom} — votre rapport vous attend`
    const body = `Bonjour,

Vous avez consulté le tarif du rapport pour ${nom} à ${ville} il y a peu.

Si vous avez une question avant de valider — sur ce qui est inclus, le délai, ou autre chose — répondez directement à cet email, je réponds personnellement.

Sinon, le rapport reste disponible ici : ${pricingUrl}

Brian

---
Vous ne souhaitez plus recevoir ces emails ? Se désinscrire : ${unsubUrl}`

    try {
      await transporter.sendMail({
        from:    `"Brian" <${FROM}>`,
        to:      nom !== 'votre établissement' ? `"${nom}" <${row.email}>` : row.email,
        replyTo: FROM,
        subject,
        text:    body,
        headers: {
          'List-Unsubscribe':      `<${unsubUrl}>, <mailto:${FROM}?subject=unsubscribe>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })

      await sb.from('pricing_exits')
        .update({ followup_sent: true, followup_sent_at: new Date().toISOString() })
        .eq('id', row.id)

      // PostHog — event de tracking
      if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        await fetch(`${process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com'}/capture/`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key:    process.env.NEXT_PUBLIC_POSTHOG_KEY,
            event:      'pricing_followup_sent',
            distinct_id: row.email,
            properties: { nom, ville, email: row.email },
          }),
        }).catch(() => {})
      }

      sent++
    } catch (err) {
      console.error('pricing followup error', row.email, err)
    }
  }

  return NextResponse.json({ sent })
}
