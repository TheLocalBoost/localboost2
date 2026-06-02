import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTransactional } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { userId, commerce_name, city, commerce_type, prenom, nom } = await req.json()
  if (!userId || !commerce_name || !city) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  // Profil merchant (ancien système)
  await supabase.from('merchant_profiles').upsert({
    id:            userId,
    commerce_name,
    city,
    commerce_type: commerce_type || '',
    specialties:   '',
    tone:          'chaleureux',
    updated_at:    new Date().toISOString(),
  }, { onConflict: 'id' })

  // Profil subscription — trial 7 jours sans CB
  await supabase.from('profiles').upsert({
    id:                  userId,
    subscription_status: 'trialing',
    trial_ends_at:       new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at:          new Date().toISOString(),
  }, { onConflict: 'id' })

  // Email de bienvenue
  const { data: userData } = await supabase.auth.admin.getUserById(userId)
  const email = userData?.user?.email
  if (email) {
    await sendTransactional({
      to:      email,
      toName:  prenom ? `${prenom} ${nom}` : commerce_name,
      subject: `Bienvenue sur LocalBoost — votre essai de 7 jours commence maintenant`,
      html: `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
  <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">Bonjour ${prenom || commerce_name} 👋</h2>
  <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
    Votre compte LocalBoost est prêt — accès gratuit, sans carte bancaire.
  </p>
  <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
    LocalBoost va analyser votre fiche Google et vous montrer les 3 actions prioritaires pour attirer plus de clients.
  </p>
  <div style="text-align:center;margin:32px 0;">
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/localboost/setup"
       style="display:inline-block;background:#2563eb;color:white;font-weight:700;padding:16px 36px;border-radius:10px;text-decoration:none;font-size:15px;">
      Configurer ma fiche Google →
    </a>
  </div>
  <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:0;">
    Accès gratuit illimité au diagnostic. Les actions IA sont disponibles en version Pro à partir de 29€/mois.
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;">
  <p style="color:#9ca3af;font-size:12px;margin:0;">LocalBoost · contact@thelocalboost.fr</p>
</div>`,
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
