import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BOT_UA = /bot|crawl|spider|scan|preview|proxy|fetcher|validator|check|curl|wget|python|java|ruby|go-http|okhttp|axios|node-fetch|microsoft.*safety|google.*image|yahoo.*mail|apple.*mail|thunderbird|mailchimp|sendgrid|sparkpost|outlook.*clp|barracuda|proofpoint|mimecast|symantec|sophos|trustwave|ironport/i

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ua = req.headers.get('user-agent') ?? ''
  const isBot = BOT_UA.test(ua)

  const { data } = await sb
    .from('outreach_links')
    .select('email, nom, ville, variant, sender')
    .eq('id', slug)
    .single()

  if (!data) return NextResponse.redirect('https://thelocalboost.fr')

  const { email, nom, ville, variant, sender } = data

  if (!isBot && email?.includes('@')) {
    sb.from('outreach_events').insert({
      email:   email.toLowerCase().trim(),
      event:   'click',
      variant,
      sender,
      url:     `https://thelocalboost.fr/voir/${slug}`,
    }).then(() => {})
  }

  const dest = new URL('https://thelocalboost.fr/analyser')
  dest.searchParams.set('nom',          nom      ?? '')
  dest.searchParams.set('ville',        ville    ?? '')
  dest.searchParams.set('email',        email    ?? '')
  dest.searchParams.set('utm_source',   'ovh')
  dest.searchParams.set('utm_medium',   'email')
  dest.searchParams.set('utm_campaign', `v${variant ?? '0'}`)

  return NextResponse.redirect(dest.toString())
}
