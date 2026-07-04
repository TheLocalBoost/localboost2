import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GIF 1x1 transparent
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

const BOT_UA = /bot|crawl|spider|scan|preview|proxy|fetcher|validator|check|curl|wget|python|java|ruby|go-http|okhttp|axios|node-fetch|microsoft.*safety|google.*image|yahoo.*mail|apple.*mail|thunderbird|mailchimp|sendgrid|sparkpost|outlook.*clp|barracuda|proofpoint|mimecast|symantec|sophos|trustwave|ironport/i

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ua = req.headers.get('user-agent') ?? ''
  const isBot = BOT_UA.test(ua)

  if (!isBot) {
    const { data } = await sb
      .from('outreach_links')
      .select('email, variant, sender')
      .eq('id', id)
      .single()

    if (data?.email?.includes('@')) {
      sb.from('outreach_events').insert({
        email:   data.email.toLowerCase().trim(),
        event:   'open',
        variant: data.variant,
        sender:  data.sender,
        url:     `https://thelocalboost.fr/api/o/${id}`,
      }).then(() => {})
    }
  }

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      'Content-Type':  'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma':        'no-cache',
    },
  })
}
