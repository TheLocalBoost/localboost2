import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const revalidate = 60

const TRACKING_START = '2026-06-06T00:00:00.000Z'
const VARIANT_SUBJECTS: Record<number, string> = {
  0: 'une observation sur la fiche de {nom}',
  1: "ce que voit un client avant d'appeler {nom}",
  2: 'pourquoi certains {s}s à {ville} reçoivent plus d\'appels',
  3: 'quelque chose de prêt pour {nom}',
  4: "donner plus envie d'appeler {nom}",
  5: 'ce que nous avons trouvé sur la fiche de {nom}',
  6: 'nous avons fait quelque chose en quelques secondes pour {nom}',
  7: '30 secondes pour {nom} à {ville}',
  8: 'nous avons commencé à préparer quelque chose pour {nom}',
}

function pct(n: number, d: number) {
  return d === 0 ? '—' : (n / d * 100).toFixed(1) + '%'
}

async function getData() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [
    { count: sentTracked },
    { count: sentTotal },
    { count: bounces },
    { data: variantData },
    { data: clickData },
    { data: dailyData },
    { data: recentSends },
    { count: sales },
    { count: waitlist },
    // Funnel events
    { count: evLanded },
    { count: evAnalyse },
    { count: evDescription },
    { count: evCTA },
    { count: evCtaClick },
    { count: evPriority },
  ] = await Promise.all([
    sb.from('leads').select('*', { count: 'exact', head: true }).eq('sent', true).gte('sent_at', TRACKING_START),
    sb.from('leads').select('*', { count: 'exact', head: true }).eq('sent', true),
    sb.from('leads').select('*', { count: 'exact', head: true }).eq('email_status', 'bounced'),
    sb.from('leads').select('subject_variant').eq('sent', true).gte('sent_at', TRACKING_START),
    sb.from('email_clicks').select('variant_id').gte('clicked_at', TRACKING_START),
    sb.from('leads').select('sent_at').eq('sent', true).gte('sent_at', sevenDaysAgo),
    sb.from('leads').select('nom, email, secteur, ville, sent_at').eq('sent', true).gte('sent_at', TRACKING_START).order('sent_at', { ascending: false }).limit(10),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    sb.from('waitlist').select('*', { count: 'exact', head: true }),
    // Funnel (depuis le nouveau funnel 29/06)
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'email_click_landed').gte('created_at', '2026-06-29T21:00:00Z'),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'analyzer_result').gte('created_at', '2026-06-29T21:00:00Z'),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'saw_description').gte('created_at', '2026-06-29T21:00:00Z'),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'saw_cta').gte('created_at', '2026-06-29T21:00:00Z'),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'cta_click_subscribe').gte('created_at', '2026-06-29T21:00:00Z'),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'priority_selected').gte('created_at', '2026-06-29T21:00:00Z'),
  ])

  // Variants
  const sendsByV: Record<number, number> = {}
  variantData?.forEach(r => {
    const id = parseInt(r.subject_variant ?? '')
    if (!isNaN(id)) sendsByV[id] = (sendsByV[id] ?? 0) + 1
  })
  const clicksByV: Record<number, number> = {}
  clickData?.forEach(r => { clicksByV[r.variant_id] = (clicksByV[r.variant_id] ?? 0) + 1 })

  const variants = Array.from(new Set([...Object.keys(sendsByV), ...Object.keys(clicksByV)].map(Number)))
    .map(id => ({
      id,
      subject: VARIANT_SUBJECTS[id] ?? `v${id}`,
      sends: sendsByV[id] ?? 0,
      clicks: clicksByV[id] ?? 0,
    }))
    .sort((a, b) => b.sends - a.sends)

  // Daily sends (7j)
  const dailyCounts: Record<string, number> = {}
  dailyData?.forEach(r => {
    const d = r.sent_at?.split('T')[0] ?? ''
    if (d) dailyCounts[d] = (dailyCounts[d] ?? 0) + 1
  })
  const daily = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000)
    const key = d.toISOString().split('T')[0]
    return { date: key.slice(5), count: dailyCounts[key] ?? 0 }
  })

  return {
    sentTracked: sentTracked ?? 0,
    sentTotal: sentTotal ?? 0,
    bounces: bounces ?? 0,
    totalClicks: clickData?.length ?? 0,
    sales: sales ?? 0,
    waitlist: waitlist ?? 0,
    variants,
    daily,
    recentSends: recentSends ?? [],
    funnel: {
      landed: evLanded ?? 0,
      analysed: evAnalyse ?? 0,
      sawDescription: evDescription ?? 0,
      sawCta: evCTA ?? 0,
      ctaClick: evCtaClick ?? 0,
      priority: evPriority ?? 0,
    },
  }
}

function Card({ label, value, sub, color = '#1d4ed8' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      <p style={{ margin: 0, fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</p>
      <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 800, color }}>{value}</p>
      {sub && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9ca3af' }}>{sub}</p>}
    </div>
  )
}

export default async function OutreachPage({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const { k } = await searchParams
  if (k !== process.env.ADMIN_SECRET_KEY) {
    return <div style={{ fontFamily: 'monospace', padding: 40, color: '#ef4444' }}>401 — clé invalide</div>
  }

  const d = await getData()
  const ctrGlobal = d.sentTracked > 0 ? pct(d.totalClicks, d.sentTracked) : '—'

  const th = (t: string) => (
    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{t}</th>
  )
  const td = (t: string | number, bold = false, color?: string) => (
    <td style={{ padding: '10px 14px', fontSize: 13, color: color ?? (bold ? '#111827' : '#374151'), fontWeight: bold ? 700 : 400, borderBottom: '1px solid #f3f4f6' }}>{t}</td>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif', padding: '32px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827' }}>📬 Stats Cold Email — thelocalboost.fr</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>mis à jour toutes les 60s</p>
        </div>

        {/* Cartes globales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 28 }}>
          <Card label="Envoyés (tracké)" value={d.sentTracked.toLocaleString('fr')} sub={`${d.sentTotal.toLocaleString('fr')} total`} />
          <Card label="Clics email" value={d.totalClicks} sub={ctrGlobal + ' CTR'} color="#7c3aed" />
          <Card label="Ventes" value={d.sales} sub={`${d.sales * 39}€ MRR`} color="#16a34a" />
          <Card label="Waitlist" value={d.waitlist} color="#d97706" />
          <Card label="Bounces" value={d.bounces} sub={pct(d.bounces, d.sentTotal)} color="#dc2626" />
        </div>

        {/* Funnel analyser */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 20, padding: '20px 24px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Funnel analyser (depuis le 29/06)</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0 }}>
            {[
              { label: 'Email → analyser', n: d.funnel.landed, pctOf: d.sentTracked, color: '#3b82f6' },
              { label: 'Analyse réussie', n: d.funnel.analysed, pctOf: d.funnel.landed, color: '#8b5cf6' },
              { label: 'Vu description', n: d.funnel.sawDescription, pctOf: d.funnel.analysed, color: '#f59e0b' },
              { label: 'Vu CTA', n: d.funnel.sawCta, pctOf: d.funnel.analysed, color: '#f97316' },
              { label: 'Clic CTA', n: d.funnel.ctaClick, pctOf: d.funnel.sawCta, color: '#ef4444' },
              { label: 'Ventes', n: d.sales, pctOf: d.funnel.ctaClick, color: '#10b981' },
            ].map(({ label, n, pctOf, color }) => (
              <div key={label} style={{ flex: 1, textAlign: 'center', borderRight: '1px solid #f3f4f6', padding: '0 8px' }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color }}>{n}</p>
                <p style={{ margin: '2px 0 4px', fontSize: 11, color: '#9ca3af' }}>{pct(n, pctOf)}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#6b7280', lineHeight: 1.3 }}>{label}</p>
              </div>
            ))}
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#9ca3af' }}>
            Priorité sélectionnée pendant chargement : {d.funnel.priority}
          </p>
        </div>

        {/* Envois / 7 jours */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 20, padding: '20px 24px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Envois / 7 derniers jours</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
            {d.daily.map(({ date, count }) => {
              const max = Math.max(...d.daily.map(x => x.count), 1)
              const h = Math.round((count / max) * 70)
              return (
                <div key={date} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ height: 70, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div style={{ width: '70%', height: h || 2, background: count > 0 ? '#3b82f6' : '#e5e7eb', borderRadius: 4 }} />
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 10, color: '#9ca3af' }}>{date}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 11, fontWeight: 600, color: '#374151' }}>{count}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Variants */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 20 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Variantes (Thompson Sampling)</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{th('v')}{th('Sujet')}{th('Envois')}{th('Clics email')}{th('CTR clic')}</tr></thead>
            <tbody>
              {d.variants.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Aucune donnée</td></tr>
              )}
              {d.variants.map(v => (
                <tr key={v.id}>
                  {td(`v${v.id}`, true)}
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #f3f4f6', maxWidth: 300 }}>{v.subject}</td>
                  {td(v.sends)}
                  {td(v.clicks)}
                  {td(v.sends > 0 ? pct(v.clicks, v.sends) : '—', false, v.clicks > 0 ? '#16a34a' : undefined)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Derniers envois */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Derniers envois</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{th('Établissement')}{th('Email')}{th('Secteur')}{th('Ville')}{th('Date')}</tr></thead>
            <tbody>
              {d.recentSends.map((s: { nom: string; email: string; secteur: string; ville: string; sent_at: string }, i) => (
                <tr key={i}>
                  {td(s.nom, true)}
                  {td(s.email)}
                  {td(s.secteur)}
                  {td(s.ville)}
                  {td(s.sent_at ? new Date(s.sent_at).toLocaleString('fr', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—')}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
