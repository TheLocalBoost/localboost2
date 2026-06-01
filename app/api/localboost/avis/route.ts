import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendTransactional } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thelocalboost.fr'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data } = await supabase
    .from('localboost_review_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { client_name, client_email, prestation } = await req.json()
  if (!client_name || !client_email) {
    return NextResponse.json({ error: 'Nom et email requis' }, { status: 400 })
  }

  // Récupérer le profil LocalBoost pour le lien d'avis
  const [{ data: lbProfile }, { data: dbProfile }] = await Promise.all([
    supabase.from('localboost_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('devisboost_profiles').select('company_name, email, phone').eq('user_id', user.id).single(),
  ])

  if (!lbProfile?.google_review_link) {
    return NextResponse.json({ error: 'Fiche Google non configurée' }, { status: 400 })
  }

  const reviewLink   = lbProfile.google_review_link
  const companyName  = dbProfile?.company_name ?? 'Votre prestataire'
  const companyEmail = dbProfile?.email ?? ''

  // Email au client
  const html = `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
  <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">Bonjour ${client_name},</h2>

  <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
    ${prestation
      ? `Merci de m'avoir fait confiance pour <strong>${prestation}</strong>.`
      : `Merci pour votre confiance.`}
    Votre satisfaction est ma priorité.
  </p>

  <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
    Si vous êtes satisfait(e) de la prestation, un avis Google m'aiderait énormément
    à me faire connaître auprès de nouveaux clients. Cela prend moins de <strong>30 secondes</strong>.
  </p>

  <div style="text-align:center;margin:32px 0;">
    <a href="${reviewLink}"
       style="display:inline-block;background:#4285F4;color:white;font-weight:700;padding:16px 36px;border-radius:10px;text-decoration:none;font-size:15px;">
      ⭐ Laisser un avis Google
    </a>
  </div>

  <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:0;">
    Vous n'êtes pas obligé(e) — mais chaque avis compte vraiment. Merci d'avance !
  </p>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;">
  <p style="color:#9ca3af;font-size:12px;margin:0;">
    ${companyName}${companyEmail ? ` · ${companyEmail}` : ''}
  </p>
</div>`

  await sendTransactional({
    to:      client_email,
    toName:  client_name,
    subject: `${companyName} — Un avis de votre part ?`,
    html,
  })

  // Sauvegarder en base
  const { data: created, error } = await supabase
    .from('localboost_review_requests')
    .insert({
      user_id:     user.id,
      client_name,
      client_email,
      prestation:  prestation ?? null,
      review_link: reviewLink,
      status:      'sent',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(created)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id, status } = await req.json()

  const { data, error } = await supabase
    .from('localboost_review_requests')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
