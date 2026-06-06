import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Brevo envoie un tableau d'events ou un event unique
export async function POST(req: NextRequest) {
  // Vérification secret optionnelle
  const secret = process.env.BREVO_WEBHOOK_SECRET
  if (secret) {
    const sig = req.headers.get('x-brevo-signature') ?? req.headers.get('x-sib-signature')
    if (sig !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const events = Array.isArray(body) ? body : [body]

  for (const ev of events) {
    if (ev.event !== 'click') continue

    const link: string = ev.link ?? ev.url ?? ''
    const variantMatch = link.match(/utm_campaign=v(\d+)/)
    if (!variantMatch) continue

    const variantId = parseInt(variantMatch[1])

    await supabase.from('email_clicks').insert({
      variant_id: variantId,
      clicked_at: new Date((ev.ts_event ?? ev.ts ?? Date.now() / 1000) * 1000).toISOString(),
    })
  }

  return NextResponse.json({ ok: true })
}
