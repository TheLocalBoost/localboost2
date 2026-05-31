import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getDevice(ua: string): string {
  if (/Mobile|Android|iPhone|iPod/.test(ua)) return 'mobile'
  if (/iPad|Tablet/.test(ua)) return 'tablet'
  return 'desktop'
}

function getCountry(req: NextRequest): string {
  return (
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('cf-ipcountry') ||
    'XX'
  )
}

function isBot(ua: string): boolean {
  return /bot|crawl|spider|slurp|facebookexternalhit|Googlebot|bingbot/i.test(ua)
}

export async function POST(req: NextRequest) {
  try {
    const { path, referrer, utm_source, utm_medium } = await req.json()
    const ua = req.headers.get('user-agent') || ''

    if (isBot(ua) || !path) return NextResponse.json({ ok: true })

    await supabase.from('page_views').insert({
      path,
      referrer:   referrer   || null,
      country:    getCountry(req),
      device:     getDevice(ua),
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
