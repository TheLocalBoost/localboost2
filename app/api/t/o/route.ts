import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 1x1 transparent GIF
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get('t')

  if (t) {
    try {
      const [email, variant, sender] = Buffer.from(t, 'base64url').toString('utf8').split('|')
      if (email?.includes('@')) {
        supabase.from('outreach_events').insert({
          email:   email.toLowerCase().trim(),
          event:   'open',
          variant: variant ?? null,
          sender:  sender ?? null,
        }).then(() => {})
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
