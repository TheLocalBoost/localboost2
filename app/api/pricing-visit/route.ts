import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, nom, ville } = await req.json()
    if (!email || !email.includes('@')) return NextResponse.json({ ok: false })

    const normalizedEmail = email.toLowerCase().trim()
    const now = new Date().toISOString()

    // Cherche une entrée active (pas encore envoyée) pour cet email
    const { data: existing } = await sb
      .from('pricing_exits')
      .select('id')
      .eq('email', normalizedEmail)
      .eq('followup_sent', false)
      .eq('converted', false)
      .order('first_visit_at', { ascending: false })
      .limit(1)
      .single()

    if (existing) {
      await sb.from('pricing_exits')
        .update({ last_visit_at: now })
        .eq('id', existing.id)
    } else {
      await sb.from('pricing_exits').insert({
        email: normalizedEmail,
        nom:   nom  || null,
        ville: ville || null,
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
