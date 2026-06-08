import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { sendTransactional }         from '@/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const APP_URL = process.env.NEXT_PUBLIC_URL!

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}))
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

  // Vérifier que l'utilisateur a un abonnement actif
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
  const user = listData?.users.find(u => u.email === email)
  if (!user) return NextResponse.json({ error: 'Aucun compte trouvé pour cet email.' }, { status: 404 })

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.subscription_status !== 'active') {
    return NextResponse.json({ error: 'Aucun abonnement actif trouvé.' }, { status: 403 })
  }

  // Générer un nouveau magic link (admin — n'envoie pas d'email Supabase)
  const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
    type:    'magiclink',
    email,
    options: { redirectTo: `${APP_URL}/auth/callback?next=${encodeURIComponent('/localboost/dashboard')}` },
  })
  const magicLink = linkData?.properties?.action_link ?? `${APP_URL}/login`

  // Envoyer notre email français custom
  await sendTransactional({
    to:      email,
    subject: 'Votre nouveau lien de connexion LocalBoost',
    html: `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
  <h2 style="font-size:20px;font-weight:700;margin:0 0 16px;">Votre lien de connexion</h2>
  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;">
    Cliquez sur le bouton ci-dessous pour accéder à votre tableau de bord LocalBoost.
  </p>
  <div style="text-align:center;margin:28px 0;">
    <a href="${magicLink}" style="display:inline-block;background:#2563eb;color:#fff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">
      Accéder à mon tableau de bord →
    </a>
    <p style="font-size:12px;color:#9ca3af;margin:10px 0 0;">Ce lien est valable 1h · Un seul clic suffit</p>
  </div>
  <p style="color:#374151;font-size:14px;margin:0;">Questions ? Répondez directement à cet email.<br>À bientôt,<br><strong>L'équipe LocalBoost</strong></p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;">
  <p style="color:#9ca3af;font-size:12px;margin:0;">LocalBoost · contact@thelocalboost.fr</p>
</div>`,
  })

  return NextResponse.json({ ok: true })
}
