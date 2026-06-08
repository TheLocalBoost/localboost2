import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code       = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type       = searchParams.get('type') as 'signup' | 'recovery' | 'email' | null

  const supabase = await createClient()

  let verified = false

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) verified = true
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) verified = true
  }

  if (!verified) {
    return NextResponse.redirect(new URL('/login?error=lien_invalide', origin))
  }

  // Email confirmé — créer le profil avec les metadata du signup
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const meta = user.user_metadata ?? {}
    await fetch(`${origin}/api/auth/setup-profile`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId:        user.id,
        commerce_name: meta.commerce ?? '',
        city:          meta.ville    ?? '',
        commerce_type: meta.secteur  ?? '',
        prenom:        meta.prenom   ?? '',
        nom:           meta.nom      ?? '',
      }),
    }).catch(() => {})
  }

  // Redirige vers le dashboard directement — session active
  const next = searchParams.get('next') ?? '/localboost/dashboard'
  return NextResponse.redirect(new URL(next, origin))
}
