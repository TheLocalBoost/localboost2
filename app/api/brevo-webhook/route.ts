import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'Config' }, { status: 500 })

  const supabase = createClient(supabaseUrl, supabaseKey)

  const body = await req.json()
  const events = Array.isArray(body) ? body : [body]

  for (const ev of events) {
    if (ev.event !== 'click') continue

    const link: string  = ev.link ?? ev.url ?? ''
    const email: string = (ev.email ?? '').toLowerCase().trim()

    // Extraire vid depuis ?vid=X (lien /api/track) ou utm_campaign=vX (lien direct)
    const vidMatch = link.match(/[?&]vid=(\d+)/)
                  ?? link.match(/utm_campaign=v(\d+)/)
                  ?? link.match(/utm_campaign%3Dv(\d+)/)   // URL-encodé
    if (!vidMatch) continue

    const variantId = parseInt(vidMatch[1])
    const clickedAt = new Date(((ev.ts_event ?? ev.ts ?? Date.now() / 1000) as number) * 1000).toISOString()

    // Chercher le lead correspondant à cet email
    let leadId: number | null = null
    if (email) {
      const { data: lead } = await supabase
        .from('leads')
        .select('id')
        .eq('email', email)
        .single()
      leadId = lead?.id ?? null
    }

    await supabase.from('email_clicks').insert({
      variant_id: variantId,
      clicked_at: clickedAt,
      lead_id:    leadId,
    })
  }

  return NextResponse.json({ ok: true })
}
