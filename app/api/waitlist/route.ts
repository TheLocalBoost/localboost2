import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = 'https://www.thelocalboost.fr'

function buildReportEmail(commerce_name: string, city: string, score: number, gaps: string[], sector: { label: string; average: number } | null) {
  const scoreColor = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626'
  const scoreLabel = score >= 70 ? '✅ Bonne visibilité' : score >= 40 ? '⚠️ Visibilité insuffisante' : '🚨 Fiche Google inactive'
  const sectorData = sector || { label: 'Commerce local', average: 60 }
  const diff = score - sectorData.average
  const diffText = diff >= 0
    ? `+${diff} pts au-dessus de la moyenne ${sectorData.label}`
    : `${diff} pts en dessous de la moyenne ${sectorData.label}`

  const gapsHtml = gaps.length > 0 ? `
    <div style="background:#fff7f7;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="font-weight:700;color:#b91c1c;margin:0 0 10px;font-size:14px;">CE QUI PÉNALISE VOTRE FICHE</p>
      <ul style="margin:0;padding-left:18px;color:#374151;font-size:14px;line-height:1.9;">
        ${gaps.map(g => `<li>${g}</li>`).join('')}
      </ul>
    </div>` : ''

  return `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:36px 24px;color:#1a1a1a;">

  <div style="text-align:center;margin-bottom:28px;">
    <img src="${APP_URL}/logo.png.png" alt="LocalBoost" style="height:48px;width:auto;" />
  </div>

  <p style="font-size:13px;color:#888;margin:0 0 20px;">
    Rapport de visibilité Google — ${commerce_name}${city ? ', ' + city : ''}
  </p>

  <!-- Score -->
  <div style="background:#f9fafb;border-radius:14px;padding:24px;margin-bottom:24px;text-align:center;">
    <p style="font-size:13px;color:#888;margin:0 0 8px;">Score de visibilité Google</p>
    <div style="display:inline-flex;align-items:baseline;gap:6px;">
      <span style="font-size:64px;font-weight:800;color:${scoreColor};line-height:1;">${score}</span>
      <span style="font-size:20px;color:#9ca3af;">/100</span>
    </div>
    <p style="font-weight:700;color:${scoreColor};margin:8px 0 4px;">${scoreLabel}</p>
    <p style="font-size:13px;color:${diff >= 0 ? '#16a34a' : '#dc2626'};margin:0;">${diffText}</p>
  </div>

  ${gapsHtml}

  <div style="text-align:center;margin:28px 0;">
    <a href="${APP_URL}/signup" style="background:#16a34a;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
      Corriger ces problèmes automatiquement →
    </a>
    <p style="font-size:12px;color:#9ca3af;margin:8px 0 0;">7 jours gratuits · Sans engagement · Annulation en 1 clic</p>
  </div>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;">
  <p style="color:#bbb;font-size:12px;margin:0;text-align:center;">
    LocalBoost · contact@thelocalboost.fr ·
    <a href="mailto:contact@thelocalboost.fr?subject=désabonnement" style="color:#bbb;">Se désabonner</a>
  </p>

</div>`
}

export async function POST(req: NextRequest) {
  try {
    const { email, commerce_name, city, score, gaps, sector } = await req.json()

    await supabaseAdmin.from('waitlist').insert({
      email,
      commerce_name,
      city,
      created_at: new Date().toISOString(),
    })

    const hasScore = typeof score === 'number'
    const html = hasScore
      ? buildReportEmail(commerce_name, city, score, gaps || [], sector || null)
      : buildReportEmail(commerce_name, city, 0, [], null)

    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: { name: 'LocalBoost', email: 'contact@thelocalboost.fr' },
        to: [{ email, name: commerce_name || '' }],
        subject: `📊 Votre score de visibilité Google — ${commerce_name || 'votre commerce'}`,
        htmlContent: html,
      }),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Waitlist error:', err)
    return NextResponse.json({ success: true })
  }
}
