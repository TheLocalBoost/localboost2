import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 1x1 transparent GIF
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

const BOT_UA = /bot|crawl|spider|scan|preview|proxy|fetcher|validator|check|curl|wget|python|java|ruby|go-http|okhttp|axios|node-fetch|microsoft.*safety|google.*image|googleimageproxy|yahoomail|apple.*mail|thunderbird.*feed|mailchimp|sendgrid|sparkpost|outlook.*clp/i

const OWNER_IPS = (process.env.OWNER_IPS ?? '').split(',').map(s => s.trim()).filter(Boolean)

export async function GET(req: NextRequest) {
  const t  = req.nextUrl.searchParams.get('t')
  const ua = req.headers.get('user-agent') ?? ''
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const isOwner = OWNER_IPS.some(o => ip.startsWith(o))

  if (t && !BOT_UA.test(ua) && !isOwner) {
    try {
      const [email, variant, sender] = Buffer.from(t, 'base64url').toString('utf8').split('|')
      if (email?.includes('@')) {
        // Anti-doublon : max 1 open unique par token dans les 10 dernières minutes
        const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
        const { count } = await supabase
          .from('outreach_events')
          .select('id', { count: 'exact', head: true })
          .eq('email', email.toLowerCase().trim())
          .eq('event', 'open')
          .gte('created_at', since)

        if ((count ?? 0) === 0) {
          supabase.from('outreach_events').insert({
            email:   email.toLowerCase().trim(),
            event:   'open',
            variant: variant ?? null,
            sender:  sender ?? null,
          }).then(() => {})
        }
      }
    } catch {}
  }

  return new NextResponse(PIXEL, {
    headers: {
      'Content-Type':  'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma':        'no-cache',
    },
  })
}
