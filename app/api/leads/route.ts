import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTransactional } from '@/lib/email'
import { generateAuditEmail } from '@/lib/email-templates'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_URL ?? 'https://www.thelocalboost.fr'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, establishmentName, score, city, category } = body as {
    email: string
    establishmentName: string
    score: number
    city: string
    category: string
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
  }

  const planUrl = `${APP_URL}/pricing?city=${encodeURIComponent(city)}&category=${encodeURIComponent(category)}&score=${score}`

  // 1. Envoi email J+0
  try {
    await sendTransactional({
      to:      email,
      subject: `Votre score LocalBoost : ${score}/100 — 3 actions pour cette semaine`,
      html:    generateAuditEmail({ establishmentName, score, city, category, planUrl }),
    })
  } catch (err) {
    console.error('leads email error:', err)
    // On ne bloque pas même si l'email échoue
  }

  // 2. Insertion dans email_leads pour la séquence J+2 / J+5
  const nextSendAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
  await supabase.from('email_leads').upsert({
    email,
    establishment_name: establishmentName,
    score,
    city,
    category,
    sequence_step: 1,
    next_send_at:  nextSendAt,
    converted:     false,
  }, { onConflict: 'email' })

  return NextResponse.json({ ok: true })
}
