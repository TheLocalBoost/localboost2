import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTransactional } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_EMAIL = 'mandartbrian68@gmail.com'

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json()

  if (!name?.trim() || !email?.includes('@') || !message?.trim()) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  const cleanName    = name.trim()
  const cleanEmail   = email.trim().toLowerCase()
  const cleanMessage = message.trim()

  // 1. Écriture en base — source de vérité, doit réussir avant toute autre chose.
  const { error } = await supabase.from('contact_messages').insert({
    name:    cleanName,
    email:   cleanEmail,
    message: cleanMessage,
  })

  if (error) {
    console.error('contact insert error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  // 2. Notification admin — best effort, ne bloque jamais la réponse (déjà en base).
  sendTransactional({
    to:      ADMIN_EMAIL,
    subject: `Nouveau message de contact — ${cleanName}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.6;">
      <p><strong>${cleanName}</strong> (${cleanEmail})</p>
      <p style="white-space:pre-wrap;">${cleanMessage}</p>
    </div>`,
  }).catch(err => console.error('[contact] notification email failed (message déjà enregistré)', err))

  return NextResponse.json({ ok: true })
}
