import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SUBJECT_LABELS = [
  '{nom} — votre fiche Google',
  '{nom} sur Google Maps',
  'Votre visibilité à {ville}',
  'Une remarque sur votre fiche Google',
  '{nom} : j\'ai regardé votre position',
  'Votre concurrent vous devance sur Google',
  '{secteur} à {ville} — quelque chose à vous montrer',
  'Question rapide, {nom}',
  'Votre fiche Google perd des clients',
  '{nom} — audit Google gratuit',
]

export async function GET(req: NextRequest) {
  if (req.headers.get('x-admin-key') !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: total },
    { count: sent },
    { count: waitlistCount },
    { data: subscriberData },
    { data: variantRaw },
    { data: clickRaw },
    { data: recentSends },
    { data: recentClicksRaw },
    { data: dailyRaw },
    { data: quotaRaw },
    { data: availableSectorsRaw },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('sent', true),
    supabase.from('waitlist').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('subscription_status').or('subscription_status.eq.active,subscription_status.eq.trialing'),
    supabase.from('leads').select('subject_variant, secteur').eq('sent', true),
    supabase.from('email_clicks').select('variant_id'),
    supabase.from('leads').select('nom, email, secteur, ville, sent_at, subject_variant').eq('sent', true).order('sent_at', { ascending: false }).limit(10),
    supabase.from('email_clicks').select('variant_id, lead_id, clicked_at').order('clicked_at', { ascending: false }).limit(10),
    supabase.from('leads').select('sent_at').eq('sent', true).gte('sent_at', sevenDaysAgo),
    supabase.from('api_quota').select('count, date').order('date', { ascending: false }).limit(7),
    supabase.from('leads').select('secteur').eq('sent', false).not('email', 'is', null).or('email_status.is.null,email_status.neq.invalid').limit(2000),
  ])

  // ── Secteurs (envoyés) ──────────────────────────────────────────────────────
  const sectorCounts: Record<string, number> = {}
  variantRaw?.forEach(r => {
    if (r.secteur) sectorCounts[r.secteur] = (sectorCounts[r.secteur] || 0) + 1
  })
  const bySector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])

  // ── Secteurs disponibles (non envoyés) ──────────────────────────────────────
  const availableSectorCounts: Record<string, number> = {}
  availableSectorsRaw?.forEach(r => {
    if (r.secteur) availableSectorCounts[r.secteur] = (availableSectorCounts[r.secteur] || 0) + 1
  })
  const availableSectors = Object.entries(availableSectorCounts).sort((a, b) => b[1] - a[1])

  // ── Variantes avec CTR ──────────────────────────────────────────────────────
  const sendsByVariant: Record<number, number> = {}
  variantRaw?.forEach(r => {
    const id = parseInt(r.subject_variant ?? '')
    if (!isNaN(id)) sendsByVariant[id] = (sendsByVariant[id] || 0) + 1
  })

  const clicksByVariant: Record<number, number> = {}
  clickRaw?.forEach(r => {
    clicksByVariant[r.variant_id] = (clicksByVariant[r.variant_id] || 0) + 1
  })

  const totalClicks = clickRaw?.length ?? 0
  const ctrGlobal   = sent && sent > 0 ? ((totalClicks / sent) * 100).toFixed(1) : '0.0'

  const allVariantIds = new Set([
    ...Object.keys(sendsByVariant).map(Number),
    ...Object.keys(clicksByVariant).map(Number),
  ])
  const byVariantCTR = Array.from(allVariantIds)
    .map(id => {
      const sends  = sendsByVariant[id] || 0
      const clicks = clicksByVariant[id] || 0
      const ctr    = sends > 0 ? (clicks / sends) * 100 : 0
      const sIdx   = Math.floor(id / 10)
      const hIdx   = id % 10
      return { id, sends, clicks, ctr: parseFloat(ctr.toFixed(1)), subjectLabel: SUBJECT_LABELS[sIdx] ?? `Sujet ${sIdx}`, hookIdx: hIdx }
    })
    .sort((a, b) => {
      if (b.sends < 3 && a.sends < 3) return b.sends - a.sends
      if (b.sends < 3) return -1
      if (a.sends < 3) return 1
      return b.ctr - a.ctr
    })
    .slice(0, 20)

  // ── Abonnés ─────────────────────────────────────────────────────────────────
  const activeSubscribers  = subscriberData?.filter(p => p.subscription_status === 'active').length ?? 0
  const trialingSubscribers = subscriberData?.filter(p => p.subscription_status === 'trialing').length ?? 0

  // ── Activité journalière ────────────────────────────────────────────────────
  const dailyCounts: Record<string, number> = {}
  dailyRaw?.forEach(r => {
    const day = r.sent_at?.split('T')[0] ?? ''
    if (day) dailyCounts[day] = (dailyCounts[day] || 0) + 1
  })
  const dailySends = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000)
    const key = d.toISOString().split('T')[0]
    return { date: key, count: dailyCounts[key] || 0 }
  })

  // ── Clics récents ───────────────────────────────────────────────────────────
  const leadIds = [...new Set(recentClicksRaw?.map(c => c.lead_id).filter(Boolean) ?? [])]
  const { data: clickLeads } = leadIds.length
    ? await supabase.from('leads').select('id, nom, email, secteur').in('id', leadIds)
    : { data: [] }
  const leadById: Record<number, any> = {}
  clickLeads?.forEach(l => { leadById[l.id] = l })

  const recentClicks = recentClicksRaw?.map(c => ({
    variant_id: c.variant_id,
    clicked_at: c.clicked_at,
    lead: leadById[c.lead_id] ?? null,
  })) ?? []

  // ── Quota API ───────────────────────────────────────────────────────────────
  const todayQuota = quotaRaw?.[0]?.count ?? 0

  return NextResponse.json({
    total:     total || 0,
    sent:      sent  || 0,
    remaining: (total || 0) - (sent || 0),
    totalClicks,
    ctrGlobal,
    waitlistCount: waitlistCount || 0,
    activeSubscribers,
    trialingSubscribers,
    estimatedMRR: activeSubscribers * 59,
    bySector,
    availableSectors,
    byVariantCTR,
    recentSends,
    recentClicks,
    dailySends,
    todayQuota,
  })
}
