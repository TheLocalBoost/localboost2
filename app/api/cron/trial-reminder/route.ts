import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTransactional } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Cron J+6 — rappel 24h avant expiration du trial
// vercel.json : { "path": "/api/cron/trial-reminder", "schedule": "0 9 * * *" }

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStart = new Date(tomorrow); tomorrowStart.setHours(0, 0, 0, 0)
  const tomorrowEnd   = new Date(tomorrow); tomorrowEnd.setHours(23, 59, 59, 999)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, trial_ends_at')
    .eq('subscription_status', 'trialing')
    .gte('trial_ends_at', tomorrowStart.toISOString())
    .lte('trial_ends_at', tomorrowEnd.toISOString())

  if (!profiles?.length) return NextResponse.json({ processed: 0 })

  let processed = 0

  for (const profile of profiles) {
    const { data: userData } = await supabase.auth.admin.getUserById(profile.id)
    const email = userData?.user?.email
    if (!email) continue

    const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pricing`

    await sendTransactional({
      to:      email,
      toName:  email,
      subject: 'Votre essai LocalBoost se termine demain',
      html: `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
  <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">Votre essai se termine demain</h2>
  <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
    Votre accès gratuit à LocalBoost expire dans <strong>24 heures</strong>.
  </p>
  <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
    Pour continuer à recevoir vos priorités IA, collecter des avis et analyser votre fiche Google,
    choisissez votre abonnement — <strong>à partir de 29€/mois, sans engagement.</strong>
  </p>
  <div style="text-align:center;margin:32px 0;">
    <a href="${checkoutUrl}"
       style="display:inline-block;background:#2563eb;color:white;font-weight:700;padding:16px 36px;border-radius:10px;text-decoration:none;font-size:15px;">
      Continuer avec LocalBoost →
    </a>
  </div>
  <p style="color:#6b7280;font-size:13px;text-align:center;margin:0 0 24px;">
    Tarif fondateur — 29€/mois · Sans engagement · Annulation en 1 clic
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;">
  <p style="color:#9ca3af;font-size:12px;margin:0;">LocalBoost · contact@thelocalboost.fr</p>
</div>`,
    }).catch(() => {})

    processed++
  }

  return NextResponse.json({ processed, total: profiles.length })
}
