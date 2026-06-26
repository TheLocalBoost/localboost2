import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const t   = req.nextUrl.searchParams.get('t')
  const u   = req.nextUrl.searchParams.get('u')
  const dest = u ? decodeURIComponent(u) : 'https://thelocalboost.fr'

  if (t && u) {
    try {
      const [email, variant, sender] = Buffer.from(t, 'base64url').toString('utf8').split('|')
      if (email?.includes('@')) {
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
