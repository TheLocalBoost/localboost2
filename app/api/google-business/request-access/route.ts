import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendTransactional } from '@/lib/email'

const ADMIN_EMAIL = process.env.BREVO_ADMIN_EMAIL ?? 'mansartbrian68@gmail.com'
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localboost2.vercel.app'

// POST — soumet une demande d'accès Google Business
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { google_email } = await req.json()
  if (!google_email?.trim()) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

  const email = google_email.trim().toLowerCase()

  // Sauvegarder l'email demandé dans le profil
  await supabase.from('localboost_profiles').upsert({
    user_id:                    user.id,
    google_requested_email:     email,
    google_access_approved:     false,
    updated_at:                 new Date().toISOString(),
  }, { onConflict: 'user_id' })

  // Notifier l'admin
  await sendTransactional({
    to:      ADMIN_EMAIL,
    subject: `[LocalBoost] Demande d'accès Google Business — ${email}`,
    html: `
<div style="font-family:Arial,sans-serif;max-width:520px;color:#1a1a1a;padding:24px;">
  <h2 style="margin:0 0 16px;">Nouvelle demande d'accès Google Business</h2>
  <p><strong>User ID :</strong> ${user.id}</p>
  <p><strong>Email compte :</strong> ${user.email}</p>
  <p><strong>Email Google à ajouter :</strong> <strong style="color:#2563eb;">${email}</strong></p>
  <hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb;">
  <p style="font-size:14px;color:#374151;">
    <strong>Action requise :</strong><br>
    1. Va sur <a href="https://console.cloud.google.com/auth/clients">Google Cloud Console → OAuth → Utilisateurs test</a><br>
    2. Ajoute l'email : <strong>${email}</strong><br>
    3. Reviens ici et marque l'utilisateur comme approuvé dans Supabase :<br>
    <code style="background:#f3f4f6;padding:4px 8px;border-radius:4px;font-size:12px;">
      UPDATE localboost_profiles SET google_access_approved = true WHERE user_id = '${user.id}';
    </code>
  </p>
  <a href="${APP_URL}/admin" style="display:inline-block;margin-top:16px;background:#1a1a1a;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;">
    Ouvrir le dashboard admin →
  </a>
</div>`,
  }).catch(console.error)

  return NextResponse.json({ success: true })
}

// PATCH — admin approuve l'accès (marque comme prêt à connecter)
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const secret  = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const userId = searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'user_id requis' }, { status: 400 })

  const supabase = createClient as any
  const sb = (await import('@supabase/supabase-js')).createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await sb
    .from('localboost_profiles')
    .select('google_requested_email')
    .eq('user_id', userId)
    .single()

  await sb.from('localboost_profiles')
    .update({ google_access_approved: true, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  // Notifier l'utilisateur
  const { data: authUser } = await sb.auth.admin.getUserById(userId)
  const userEmail = authUser?.user?.email
  if (userEmail) {
    await sendTransactional({
      to:      userEmail,
      subject: 'Votre accès Google Business est prêt ✓',
      html: `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
  <h2 style="font-size:20px;font-weight:700;margin:0 0 16px;">Votre accès Google Business est activé</h2>
  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;">
    Vous pouvez maintenant connecter votre compte Google Business à LocalBoost et publier directement sur votre fiche Google.
  </p>
  <a href="${APP_URL}/localboost/connect" style="display:inline-block;background:#2563eb;color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;">
    Connecter Google Business →
  </a>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;">
  <p style="color:#9ca3af;font-size:12px;margin:0;">LocalBoost · contact@thelocalboost.fr</p>
</div>`,
    }).catch(console.error)
  }

  return NextResponse.json({ success: true, notified: userEmail })
}
