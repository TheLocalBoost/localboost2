import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BOT_UA = /bot|crawl|spider|scan|preview|proxy|fetcher|validator|check|curl|wget|python|java|ruby|go-http|okhttp|axios|node-fetch|microsoft.*safety|google.*image|yahoo.*mail|apple.*mail|thunderbird|mailchimp|sendgrid|sparkpost|outlook.*clp|barracuda|proofpoint|mimecast|symantec|sophos|trustwave|ironport/i

export async function GET(req: NextRequest) {
  const t   = req.nextUrl.searchParams.get('t')
  const u   = req.nextUrl.searchParams.get('u')
  const ua  = req.headers.get('user-agent') ?? ''
  const dest = u ? decodeURIComponent(u) : 'https://thelocalboost.fr'

  if (t && u && !BOT_UA.test(ua)) {
    try {
      const [email, variant, sender] = Buffer.from(t, 'base64url').toString('utf8').split('|')
      if (email?.includes('@') && email.length < 100) {
        supabase.from('outreach_events').insert({
          email:   email.toLowerCase().trim(),
          event:   'click',
          variant: variant ?? null,
          sender:  sender ?? null,
          url:     dest,
        }).then(() => {})
      }
    } catch {}
  }

  return NextResponse.redirect(dest)
}
