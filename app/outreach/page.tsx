import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const revalidate = 60

// Depuis la dernière grosse refonte (daemon continu + dossier enrichi)
const SINCE = '2026-07-02T00:00:00.000Z'

// Sujets réels des variantes dans send_ovh.mjs
const SUBJECTS: Record<string, string> = {
  '0': 'une observation sur la fiche de {nom}',
  '1': "ce que voit un client avant d'appeler {nom}",
  '2': 'pourquoi certains {s}s à {ville} reçoivent plus d\'appels',
  '3': 'quelque chose de prêt pour {nom}',
  '4': "donner plus envie d'appeler {nom}",
  '5': 'ce que nous avons trouvé sur la fiche de {nom}',
  '6': 'nous avons fait quelque chose en quelques secondes pour {nom}',
  '7': '30 secondes pour {nom} à {ville}',
  '8': 'nous avons commencé à préparer quelque chose pour {nom}',
}

function pct(n: number, d: number) {
  return d === 0 ? '—' : (n / d * 100).toFixed(1) + '%'
}

async function getData() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const FUNNEL_SINCE = '2026-07-02T00:00:00.000Z'

  const [
    // outreach_events — source réelle des envois (send_ovh.mjs)
    { count: sends },
    { count: opens },
    { count: clicks },
    { count: bounces },
    { data: byVariant },
    { data: bySender },
    // Envois récents depuis outreach_events
    { data: recentRaw },
    // Ventes et waitlist depuis profiles/waitlist
    { count: sales },
    { count: waitlist },
    // Funnel analyser depuis analytics_events
    { count: evLanded },
    { count: evAnalysed },
    { count: evDesc },
    { count: evCta },
    { count: evCtaClick },
    { count: evPriority },
    // Activité par jour (depuis outreach_events)
    { data: dailyRaw },
  ] = await Promise.all([
    sb.from('outreach_events').select('*', { count: 'exact', head: true }).eq('event', 'sent').gte('created_at', SINCE),
    sb.from('outreach_events').select('*', { count: 'exact', head: true }).eq('event', 'open').gte('created_at', SINCE),
    sb.from('outreach_events').select('*', { count: 'exact', head: true }).eq('event', 'click').gte('created_at', SINCE),
    sb.from('outreach_events').select('*', { count: 'exact', head: true }).eq('event', 'bounce').gte('created_at', SINCE),
    sb.from('outreach_events').select('variant, event').not('variant', 'is', null).gte('created_at', SINCE),
    sb.from('outreach_events').select('sender, event').not('sender', 'is', null).gte('created_at', SINCE),
    sb.from('outreach_events').select('email, variant, created_at').eq('event', 'sent').gte('created_at', SINCE).order('created_at', { ascending: false }).limit(15),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    sb.from('waitlist').select('*', { count: 'exact', head: true }),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'email_click_landed').gte('created_at', FUNNEL_SINCE),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'analyzer_result').gte('created_at', FUNNEL_SINCE),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'saw_description').gte('created_at', FUNNEL_SINCE),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'saw_cta').gte('created_at', FUNNEL_SINCE),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'cta_click_subscribe').gte('created_at', FUNNEL_SINCE),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'priority_selected').gte('created_at', FUNNEL_SINCE),
    sb.from('outreach_events').select('created_at').eq('event', 'sent').gte('created_at', sevenDaysAgo),
  ])

  // Stats par variante
  const vm: Record<string, { sends: number; opens: number; clicks: number }> = {}
  for (const r of byVariant ?? []) {
    const v = r.variant ?? 'unknown'
    if (!vm[v]) vm[v] = { sends: 0, opens: 0, clicks: 0 }
    if (r.event === 'sent')  vm[v].sends++
    if (r.event === 'open')  vm[v].opens++
    if (r.event === 'click') vm[v].clicks++
  }
  const variants = Object.entries(vm)
    .map(([v, s]) => ({ v, subject: SUBJECTS[v] ?? `v${v}`, ...s }))
    .filter(x => x.sends > 0)
    .sort((a, b) => b.sends - a.sends)

  // Stats par expéditeur
  const sm: Record<string, { sends: number; opens: number }> = {}
  for (const r of bySender ?? []) {
    const s = r.sender ?? 'unknown'
    if (!sm[s]) sm[s] = { sends: 0, opens: 0 }
    if (r.event === 'sent') sm[s].sends++
    if (r.event === 'open') sm[s].opens++
  }
  const senders = Object.entries(sm)
    .map(([s, v]) => ({ s, ...v }))
    .sort((a, b) => b.sends - a.sends)
    .slice(0, 10)

  // Activité 7 jours
  const dailyCounts: Record<string, number> = {}
  for (const r of dailyRaw ?? []) {
    const d = (r.created_at ?? '').slice(0, 10)
    if (d) dailyCounts[d] = (dailyCounts[d] ?? 0) + 1
  }
  const daily = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000)
    const key = d.toISOString().slice(0, 10)
    return { date: key.slice(5), count: dailyCounts[key] ?? 0 }
  })

  return {
    sends: sends ?? 0,
    opens: opens ?? 0,
    clicks: clicks ?? 0,
    bounces: bounces ?? 0,
    sales: sales ?? 0,
    waitlist: waitlist ?? 0,
    variants,
    senders,
    daily,
    recent: recentRaw ?? [],
    funnel: {
      landed: evLanded ?? 0,
      analysed: evAnalysed ?? 0,
      sawDesc: evDesc ?? 0,
      sawCta: evCta ?? 0,
      ctaClick: evCtaClick ?? 0,
      priority: evPriority ?? 0,
    },
  }
}

export default async function OutreachPage({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const { k } = await searchParams
  if (k !== process.env.ADMIN_SECRET_KEY) {
    return <div style={{ fontFamily: 'monospace', padding: 40, color: '#ef4444' }}>401 — clé invalide</div>
  }

  const d = await getData()

  const th = (t: string) => (
    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{t}</th>
  )
  const td = (t: string | number, opts: { bold?: boolean; color?: string } = {}) => (
    <td style={{ padding: '10px 14px', fontSize: 13, color: opts.color ?? (opts.bold ? '#111827' : '#374151'), fontWeight: opts.bold ? 700 : 400, borderBottom: '1px solid #f3f4f6' }}>{t}</td>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif', padding: '32px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827' }}>📬 Stats Cold Email — thelocalboost.fr</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>Source : outreach_events + analytics_events · actualisé toutes les 60s</p>
        </div>

        {/* Cartes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Envois', val: d.sends.toLocaleString('fr'), sub: '', color: '#1d4ed8' },
            { label: 'Ouvertures', val: d.opens.toLocaleString('fr'), sub: pct(d.opens, d.sends) + ' taux ouv.', color: '#16a34a' },
            { label: 'Clics email', val: d.clicks.toLocaleString('fr'), sub: pct(d.clicks, d.sends) + ' CTR', color: '#7c3aed' },
            { label: 'Bounces', val: d.bounces, sub: pct(d.bounces, d.sends), color: '#dc2626' },
            { label: 'Ventes (one-shot)', val: d.sales, sub: d.sales > 0 ? `~${d.sales * 39}€ CA` : 'aucune vente', color: d.sales > 0 ? '#16a34a' : '#9ca3af' },
            { label: 'Waitlist', val: d.waitlist, sub: '', color: '#d97706' },
          ].map(({ label, val, sub, color }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
              <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</p>
              <p style={{ margin: '5px 0 0', fontSize: 26, fontWeight: 800, color }}>{val}</p>
              {sub && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>{sub}</p>}
            </div>
          ))}
        </div>

        {/* Funnel */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 20, padding: '20px 24px' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Funnel analyser</h2>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: '#9ca3af' }}>Depuis le 29/06 21h (nouveau funnel) · analytics_events</p>
          <div style={{ display: 'flex', gap: 0 }}>
            {[
              { label: 'Email → /analyser', n: d.funnel.landed, ref: d.sends, color: '#3b82f6' },
              { label: 'Analyse réussie', n: d.funnel.analysed, ref: d.funnel.landed, color: '#8b5cf6' },
              { label: 'Vu description', n: d.funnel.sawDesc, ref: d.funnel.analysed, color: '#f59e0b' },
              { label: 'Vu CTA', n: d.funnel.sawCta, ref: d.funnel.analysed, color: '#f97316' },
              { label: 'Clic CTA', n: d.funnel.ctaClick, ref: d.funnel.sawCta, color: '#ef4444' },
              { label: 'Ventes', n: d.sales, ref: d.funnel.ctaClick, color: '#10b981' },
            ].map(({ label, n, ref, color }) => (
              <div key={label} style={{ flex: 1, textAlign: 'center', borderRight: '1px solid #f3f4f6', padding: '0 8px' }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color }}>{n}</p>
                <p style={{ margin: '2px 0 4px', fontSize: 11, color: '#9ca3af' }}>{pct(n, ref)}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#6b7280', lineHeight: 1.3 }}>{label}</p>
              </div>
            ))}
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#9ca3af' }}>Priorité choisie pendant chargement : {d.funnel.priority}</p>
        </div>

        {/* Graphique 7j */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 20, padding: '20px 24px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Envois / 7 jours</h2>
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

        {/* Variantes */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 20 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Variantes — Thompson Sampling</h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9ca3af' }}>Source : outreach_events (vrais envois OVH)</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{th('v')}{th('Sujet')}{th('Envois')}{th('Ouvertures')}{th('Taux ouv.')}{th('Clics')}{th('CTR')}</tr></thead>
            <tbody>
              {d.variants.map(v => (
                <tr key={v.v}>
                  {td(`v${v.v}`, { bold: true })}
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #f3f4f6', maxWidth: 300 }}>{v.subject}</td>
                  {td(v.sends)}
                  {td(v.opens)}
                  {td(pct(v.opens, v.sends), { color: '#16a34a' })}
                  {td(v.clicks)}
                  {td(v.sends > 0 ? pct(v.clicks, v.sends) : '—', { color: v.clicks > 0 ? '#7c3aed' : undefined })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top expéditeurs */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 20 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Top expéditeurs</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{th('Adresse')}{th('Envois')}{th('Ouvertures')}{th('Taux ouv.')}</tr></thead>
            <tbody>
              {d.senders.map(s => (
                <tr key={s.s}>
                  {td(s.s, { bold: true })}
                  {td(s.sends)}
                  {td(s.opens)}
                  {td(pct(s.opens, s.sends), { color: '#16a34a' })}
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
            <thead><tr>{th('Email')}{th('Variante')}{th('Date')}</tr></thead>
            <tbody>
              {d.recent.map((r: { email: string; variant: string; created_at: string }, i) => (
                <tr key={i}>
                  {td(r.email, { bold: true })}
                  {td(r.variant ? `v${r.variant} — ${(SUBJECTS[r.variant] ?? '').slice(0, 40)}` : '—')}
                  {td(r.created_at ? new Date(r.created_at).toLocaleString('fr', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—')}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
