import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendTransactional } from '@/lib/email'

// Cron J+3 — relance si pas d'avis
// vercel.json : { "path": "/api/localboost/avis-relance", "schedule": "0 9 * * *" }

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = await createClient()
  const j3ago    = new Date(Date.now() - 3 * 86400000).toISOString()
  const j5ago    = new Date(Date.now() - 5 * 86400000).toISOString()

  // Demandes envoyées il y a 3–5 jours, pas encore relancées, pas encore done
  const { data: requests } = await supabase
    .from('localboost_review_requests')
    .select('*, localboost_profiles!inner(business_name, google_review_link)')
    .eq('status', 'sent')
    .gte('created_at', j5ago)
    .lte('created_at', j3ago)
    .is('reminded_at', null)

  if (!requests?.length) return NextResponse.json({ processed: 0 })

  let processed = 0

  for (const r of requests) {
    try {
      const companyName  = (r as any).localboost_profiles?.business_name ?? 'Votre prestataire'
      const reviewLink   = (r as any).localboost_profiles?.google_review_link ?? r.review_link

      const html = `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
  <h2 style="font-size:18px;font-weight:700;margin:0 0 16px;">Bonjour ${r.client_name},</h2>

  <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 16px;">
    Je me permets de vous relancer concernant votre avis Google.
    ${r.prestation ? `Vous m'avez confié <strong>${r.prestation}</strong> il y a quelques jours.` : ''}
  </p>

  <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 24px;">
    Si vous avez été satisfait(e), un avis en ligne m'aiderait vraiment — cela prend
    <strong>moins de 30 secondes</strong> et compte beaucoup pour mon activité.
  </p>

  <div style="text-align:center;margin:28px 0;">
    <a href="${reviewLink}"
       style="display:inline-block;background:#4285F4;color:white;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:14px;">
      ⭐ Laisser mon avis Google
    </a>
  </div>

  <p style="color:#9ca3af;font-size:12px;margin:0;">
    C'est mon dernier message à ce sujet. Merci pour votre temps.
    <br>${companyName}
  </p>
</div>`

      await sendTransactional({
        to:      r.client_email,
        toName:  r.client_name,
        subject: `Dernier rappel — votre avis sur ${companyName}`,
        html,
      })

      await supabase
        .from('localboost_review_requests')
        .update({ status: 'reminded', reminded_at: new Date().toISOString() })
        .eq('id', r.id)

      processed++
    } catch (err) {
      console.error(`Erreur relance avis ${r.id}:`, err)
    }
  }

  return NextResponse.json({ processed, total: requests.length })
}
