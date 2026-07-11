import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTransactional } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_EMAIL = 'mandartbrian68@gmail.com'
const APP_URL     = process.env.NEXT_PUBLIC_URL ?? 'https://www.thelocalboost.fr'

// Point d'entrée unique du pipeline de vente (CTA de fin de funnel /analyser).
// La demande est écrite en base AVANT toute tentative d'envoi d'email — si la
// notification échoue (spam, panne SMTP...), le lead n'est jamais perdu : il
// reste consultable via /api/admin/report-requests.
export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const nom   = String(body.nom ?? '').trim()
  const ville = String(body.ville ?? '').trim()
  if (!nom || !ville) {
    return NextResponse.json({ error: 'nom et ville requis' }, { status: 400 })
  }

  const secteur              = (body.secteur ?? null) as string | null
  const email                = (body.email ?? null) as string | null
  const score                = typeof body.score === 'number' ? body.score : null
  const completenessPercent  = typeof body.completenessPercent === 'number' ? body.completenessPercent : null
  const placeId               = (body.placeId ?? null) as string | null
  const diagnosticUrl = `${APP_URL}/analyser?nom=${encodeURIComponent(nom)}&ville=${encodeURIComponent(ville)}`

  // 1. Écriture en base — source de vérité, doit réussir avant toute autre chose.
  const { data, error } = await supabase
    .from('report_requests')
    .insert({
      nom, ville, secteur, email, score,
      completeness_percent: completenessPercent,
      place_id: placeId,
      diagnostic_url: diagnosticUrl,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[report-requested] insert failed', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  // 2. Notification admin — best effort, ne bloque jamais la réponse (déjà en base).
  sendTransactional({
    to:      ADMIN_EMAIL,
    subject: `Nouvelle demande de rapport — ${nom} (${ville})`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.6;">
      <p><strong>${nom}</strong> — ${ville}${secteur ? ` · ${secteur}` : ''}</p>
      <p>Email : ${email ?? 'non renseigné'}</p>
      ${score !== null ? `<p>Score diagnostic : ${score}/100</p>` : ''}
      ${completenessPercent !== null ? `<p>Complétude fiche : ${completenessPercent}%</p>` : ''}
      <p><a href="${diagnosticUrl}">Revoir le diagnostic</a></p>
    </div>`,
  }).catch(err => console.error('[report-requested] notification email failed (lead déjà enregistré, id=' + data.id + ')', err))

  return NextResponse.json({ ok: true, id: data.id })
}
