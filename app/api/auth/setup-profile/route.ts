import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { userId, commerce_name, city, commerce_type } = await req.json()
  if (!userId || !commerce_name || !city) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  // Profil merchant
  const { error: merchantError } = await supabase.from('merchant_profiles').upsert({
    id:            userId,
    commerce_name,
    city,
    commerce_type: commerce_type || '',
    specialties:   '',
    tone:          'chaleureux',
    updated_at:    new Date().toISOString(),
  }, { onConflict: 'id' })

  if (merchantError) {
    console.error('setup-profile merchant error:', merchantError)
    return NextResponse.json({ error: 'Erreur profil merchant' }, { status: 500 })
  }

  // Profil subscription — inactif par défaut, actif après paiement Stripe
  const { error: profileError } = await supabase.from('profiles').upsert({
    id:                  userId,
    subscription_status: 'inactive',
    onboarded:           false,
    updated_at:          new Date().toISOString(),
  }, { onConflict: 'id' })

  if (profileError) {
    console.error('setup-profile profiles error:', profileError)
    return NextResponse.json({ error: 'Erreur profil subscription' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, redirect: '/pricing' })
}
