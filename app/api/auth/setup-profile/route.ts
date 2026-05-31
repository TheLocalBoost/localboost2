import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { userId, commerce_name, city, commerce_type, prenom, nom } = await req.json()
  if (!userId || !commerce_name || !city) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  const { error } = await supabase.from('merchant_profiles').upsert({
    id:            userId,
    commerce_name,
    city,
    commerce_type: commerce_type || '',
    specialties:   '',
    tone:          'chaleureux',
    updated_at:    new Date().toISOString(),
  }, { onConflict: 'id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
