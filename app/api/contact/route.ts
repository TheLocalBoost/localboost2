import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json()

  if (!name?.trim() || !email?.includes('@') || !message?.trim()) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  const { error } = await supabase.from('contact_messages').insert({
    name:    name.trim(),
    email:   email.trim().toLowerCase(),
    message: message.trim(),
  })

  if (error) {
    console.error('contact insert error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
