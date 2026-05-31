import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  if (req.headers.get('x-admin-key') !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const days = parseInt(req.nextUrl.searchParams.get('days') || '30')
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const [
    { count: totalViews },
    { data: byPath },
    { data: byCountry },
    { data: byDevice },
    { data: bySource },
    { data: daily },
    { data: events },
    { data: recent },
    { count: totalEmailClicks },
    { data: emailClicksByVariant },
    { data: emailClicksDaily },
  ] = await Promise.all([
    supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('page_views').select('path').gte('created_at', since),
    supabase.from('page_views').select('country').gte('created_at', since),
    supabase.from('page_views').select('device').gte('created_at', since),
    supabase.from('page_views').select('utm_source, referrer').gte('created_at', since),
    supabase.from('page_views').select('created_at').gte('created_at', since),
    supabase.from('analytics_events').select('name, created_at').gte('created_at', since),
    supabase.from('page_views').select('path, country, device, created_at').order('created_at', { ascending: false }).limit(20),
    supabase.from('email_clicks').select('*', { count: 'exact', head: true }),
    supabase.from('email_clicks').select('variant_id').order('variant_id'),
    supabase.from('email_clicks').select('clicked_at').order('clicked_at', { ascending: false }).limit(500),
  ])

  // Top pages
  const pathCounts: Record<string, number> = {}
  byPath?.forEach(r => { pathCounts[r.path] = (pathCounts[r.path] || 0) + 1 })
  const topPages = Object.entries(pathCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)

  // By country
  const countryCounts: Record<string, number> = {}
  byCountry?.forEach(r => { if (r.country) countryCounts[r.country] = (countryCounts[r.country] || 0) + 1 })
  const topCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // By device
  const deviceCounts: Record<string, number> = {}
  byDevice?.forEach(r => { if (r.device) deviceCounts[r.device] = (deviceCounts[r.device] || 0) + 1 })

  // By source
  const sourceCounts: Record<string, number> = {}
  bySource?.forEach(r => {
    const src = r.utm_source || (r.referrer ? new URL(r.referrer).hostname.replace('www.', '') : 'direct')
    sourceCounts[src] = (sourceCounts[src] || 0) + 1
  })
  const topSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Daily views (last N days)
  const dailyCounts: Record<string, number> = {}
  daily?.forEach(r => {
    const day = r.created_at.split('T')[0]
    dailyCounts[day] = (dailyCounts[day] || 0) + 1
  })
  const dailyViews = Array.from({ length: days <= 30 ? days : 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000)
    const key = d.toISOString().split('T')[0]
    return { date: key, count: dailyCounts[key] || 0 }
  })

  // Events
  const eventCounts: Record<string, number> = {}
  events?.forEach(r => { eventCounts[r.name] = (eventCounts[r.name] || 0) + 1 })

  // Email clicks par variante
  const variantCounts: Record<number, number> = {}
  emailClicksByVariant?.forEach(r => {
    variantCounts[r.variant_id] = (variantCounts[r.variant_id] || 0) + 1
  })
  const topVariantClicks = Object.entries(variantCounts)
    .sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 5)

  // Email clicks par jour
  const emailDailyCounts: Record<string, number> = {}
  emailClicksDaily?.forEach(r => {
    const day = r.clicked_at?.split('T')[0] ?? ''
    if (day) emailDailyCounts[day] = (emailDailyCounts[day] || 0) + 1
  })

  return NextResponse.json({
    totalViews: totalViews || 0,
    topPages,
    topCountries,
    deviceCounts,
    topSources,
    dailyViews,
    eventCounts,
    recent,
    emailClicks: {
      total: totalEmailClicks || 0,
      byVariant: topVariantClicks,
      daily: emailDailyCounts,
    },
  })
}
