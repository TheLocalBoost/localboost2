import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('k')
  if (key !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const [sends, opens, clicks, bounces] = await Promise.all([
    supabase.from('outreach_events').select('*', { count: 'exact', head: true }).eq('event', 'sent'),
    supabase.from('outreach_events').select('*', { count: 'exact', head: true }).eq('event', 'open'),
    supabase.from('outreach_events').select('*', { count: 'exact', head: true }).eq('event', 'click'),
    supabase.from('outreach_events').select('*', { count: 'exact', head: true }).eq('event', 'bounce'),
  ])

  const totalSends   = sends.count   ?? 0
  const totalOpens   = opens.count   ?? 0
  const totalClicks  = clicks.count  ?? 0
  const totalBounces = bounces.count ?? 0

  // Stats par variant
  const { data: byVariant } = await supabase
    .from('outreach_events')
    .select('variant, event')
    .not('variant', 'is', null)
    .limit(100000)

  const variantStats: Record<string, { sends: number; opens: number; clicks: number }> = {}
  for (const row of byVariant ?? []) {
    const v = row.variant ?? 'unknown'
    if (!variantStats[v]) variantStats[v] = { sends: 0, opens: 0, clicks: 0 }
    if (row.event === 'sent')  variantStats[v].sends++
    if (row.event === 'open')  variantStats[v].opens++
    if (row.event === 'click') variantStats[v].clicks++
  }

  // Stats par sender (adresse expéditrice)
  const { data: bySender } = await supabase
    .from('outreach_events')
    .select('sender, event')
    .not('sender', 'is', null)
    .limit(100000)

  const senderStats: Record<string, { sends: number; opens: number }> = {}
  for (const row of bySender ?? []) {
    const s = row.sender ?? 'unknown'
    if (!senderStats[s]) senderStats[s] = { sends: 0, opens: 0 }
    if (row.event === 'sent') senderStats[s].sends++
    if (row.event === 'open') senderStats[s].opens++
  }

  return NextResponse.json({
    global: {
      sends:      totalSends,
      opens:      totalOpens,
      clicks:     totalClicks,
      bounces:    totalBounces,
      open_rate:  totalSends > 0 ? `${((totalOpens / totalSends) * 100).toFixed(1)}%` : '—',
      click_rate: totalSends > 0 ? `${((totalClicks / totalSends) * 100).toFixed(1)}%` : '—',
      bounce_rate: totalSends > 0 ? `${((totalBounces / totalSends) * 100).toFixed(1)}%` : '—',
    },
    by_variant: Object.entries(variantStats)
      .map(([v, s]) => ({
        variant:    v,
        sends:      s.sends,
        opens:      s.opens,
        clicks:     s.clicks,
        open_rate:  s.sends > 0 ? `${((s.opens / s.sends) * 100).toFixed(1)}%` : '—',
        click_rate: s.sends > 0 ? `${((s.clicks / s.sends) * 100).toFixed(1)}%` : '—',
      }))
      .sort((a, b) => b.sends - a.sends),
    by_sender: Object.entries(senderStats)
      .map(([s, v]) => ({ sender: s, sends: v.sends, opens: v.opens }))
      .sort((a, b) => b.sends - a.sends)
      .slice(0, 20),
  })
}
