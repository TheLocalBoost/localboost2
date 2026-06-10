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
    const email: string = (ev.email ?? '').toLowerCase().trim()
    if (!email) continue

    // ── Hard bounce / Soft bounce → bloquer définitivement les hard bounces
    if (ev.event === 'hard_bounce' || ev.event === 'invalid_email') {
      await supabase
        .from('leads')
        .update({ email_status: 'bounced', sent: true })
        .eq('email', email)
      continue
    }

    // ── Unsubscribe
    if (ev.event === 'unsubscribe') {
      await supabase
        .from('leads')
        .update({ email_status: 'unsubscribed' })
        .eq('email', email)
      continue
    }

    // ── Spam complaint
    if (ev.event === 'spam') {
      await supabase
        .from('leads')
        .update({ email_status: 'unsubscribed' })
        .eq('email', email)
      continue
    }

    // ── Click
    if (ev.event === 'click') {
      const link: string = ev.link ?? ev.url ?? ''
      const vidMatch = link.match(/[?&]vid=(\d+)/)
                    ?? link.match(/utm_campaign=v(\d+)/)
                    ?? link.match(/utm_campaign%3Dv(\d+)/)
      if (!vidMatch) continue

      const variantId = parseInt(vidMatch[1])
      const clickedAt = new Date(((ev.ts_event ?? ev.ts ?? Date.now() / 1000) as number) * 1000).toISOString()

      const { data: lead } = await supabase
        .from('leads')
        .select('id')
        .eq('email', email)
        .single()

      // Anti-bot : ignorer si plus de 3 clics dans les 5 dernières minutes pour ce lead
      if (lead?.id) {
        const since = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const { count } = await supabase
          .from('email_clicks')
          .select('id', { count: 'exact', head: true })
          .eq('lead_id', lead.id)
          .gte('clicked_at', since)
        if ((count ?? 0) >= 3) continue
      }

      await supabase.from('email_clicks').insert({
        variant_id: variantId,
        clicked_at: clickedAt,
        lead_id:    lead?.id ?? null,
      })
    }
  }

  return NextResponse.json({ ok: true })
}
