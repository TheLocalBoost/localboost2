import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const revalidate = 60

// Depuis switch texte pur + URL courte (03/07 20h)
const SINCE        = '2026-07-03T20:00:00.000Z'
const FUNNEL_SINCE = '2026-07-05T14:38:00.000Z'

const SUBJECTS: Record<string, string> = {
  '0': 'un habitant de {ville} cherche un {s} demain',
  '1': 'ce que verront vos prochains clients sur Google',
  '2': 'avant que vos prochains clients ne cherchent un {s} à {ville}',
  '3': 'votre dossier Google est déjà prêt',
  '4': '6 heures de travail déjà faites pour {nom}',
  '5': 'nous avons commencé à travailler sur la fiche de {nom}',
  '6': "pourquoi certains {s}s à {ville} reçoivent plus d'appels",
  '7': "votre fiche peut donner envie d'appeler davantage de personnes",
  '8': 'un {s} moins bien noté que vous reçoit vos prochains clients',
}

function pct(n: number, d: number) {
  return d === 0 ? '—' : (n / d * 100).toFixed(1) + '%'
}

async function getData() {
  const [
    { count: sends },
    { count: clicks },
    { count: bounces },
    { count: unsubs },
    { data: byVariant },
    { count: sales },
    { count: waitlist },
    { count: evLanded },
    { count: evAnalysed },
    { count: evDiag },
    { count: evTemps },
    { count: evProb },
    { count: evTravail },
    { count: evLivr },
    { count: evCta },
    { count: evCtaClick },
    { count: evSkipped },
    { data: recentRaw },
    { data: dailyRaw },
  ] = await Promise.all([
    sb.from('outreach_events').select('*', { count: 'exact', head: true }).eq('event', 'sent').gte('created_at', SINCE),
    sb.from('outreach_events').select('*', { count: 'exact', head: true }).eq('event', 'click').gte('created_at', SINCE),
    sb.from('outreach_events').select('*', { count: 'exact', head: true }).eq('event', 'bounce').gte('created_at', SINCE),
    sb.from('unsubscribed').select('*', { count: 'exact', head: true }),
    sb.from('outreach_events').select('variant, event').not('variant', 'is', null).gte('created_at', SINCE).limit(100000),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active').not('stripe_customer_id', 'is', null),
    sb.from('waitlist').select('*', { count: 'exact', head: true }),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'email_click_landed').gte('created_at', FUNNEL_SINCE),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'analyzer_result').gte('created_at', FUNNEL_SINCE),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'saw_diagnostic').gte('created_at', FUNNEL_SINCE),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'saw_temps').gte('created_at', FUNNEL_SINCE),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'saw_problemes').gte('created_at', FUNNEL_SINCE),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'saw_travail').gte('created_at', FUNNEL_SINCE),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'saw_livrables').gte('created_at', FUNNEL_SINCE),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'saw_cta').gte('created_at', FUNNEL_SINCE),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'cta_click_subscribe').gte('created_at', FUNNEL_SINCE),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('name', 'skipped_to_cta').gte('created_at', FUNNEL_SINCE),
    sb.from('outreach_events').select('email, variant, created_at').eq('event', 'sent').gte('created_at', SINCE).order('created_at', { ascending: false }).limit(15),
    sb.from('outreach_events').select('created_at').eq('event', 'sent').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
  ])

  const vm: Record<string, { sends: number; clicks: number }> = {}
  for (const r of byVariant ?? []) {
    const v = r.variant ?? 'unknown'
    if (!vm[v]) vm[v] = { sends: 0, clicks: 0 }
    if (r.event === 'sent')  vm[v].sends++
    if (r.event === 'click') vm[v].clicks++
  }
  const variants = Object.entries(vm)
    .map(([v, s]) => ({ v, subject: SUBJECTS[v] ?? `v${v}`, ...s }))
    .filter(x => x.sends > 0)
    .sort((a, b) => b.sends - a.sends)

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
    sends:   sends   ?? 0,
    clicks:  clicks  ?? 0,
    bounces: bounces ?? 0,
    unsubs:  unsubs  ?? 0,
    sales:   sales   ?? 0,
    waitlist: waitlist ?? 0,
    variants,
    daily,
    recent: recentRaw ?? [],
    funnel: {
      landed:   evLanded   ?? 0,
      analysed: evAnalysed ?? 0,
      diag:     evDiag     ?? 0,
      temps:    evTemps    ?? 0,
      prob:     evProb     ?? 0,
      travail:  evTravail  ?? 0,
      livr:     evLivr     ?? 0,
      cta:      evCta      ?? 0,
      ctaClick: evCtaClick ?? 0,
      skipped:  evSkipped  ?? 0,
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
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827' }}>📬 Stats Cold Email</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>Depuis le 03/07 20h (texte pur · URL courte · unsub one-click) · actualisé toutes les 60s</p>
        </div>

        {/* Cartes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Envois', val: d.sends.toLocaleString('fr'), sub: '', color: '#1d4ed8' },
            { label: 'Clics', val: d.clicks.toLocaleString('fr'), sub: pct(d.clicks, d.sends) + ' CTR', color: '#7c3aed' },
            { label: 'Bounces', val: d.bounces, sub: pct(d.bounces, d.sends), color: d.bounces > 0 ? '#dc2626' : '#9ca3af' },
            { label: 'Désinscrits', val: d.unsubs, sub: '', color: '#f59e0b' },
            { label: 'Ventes', val: d.sales, sub: d.sales > 0 ? `${d.sales * 39}€ MRR` : 'aucune', color: d.sales > 0 ? '#16a34a' : '#9ca3af' },
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
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 20 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Funnel — 6 écrans</h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9ca3af' }}>email → analyse → diagnostic → CTA · depuis FUNNEL_SINCE</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{th('Étape')}{th('N')}{th('vs précédent')}{th('vs envois')}</tr></thead>
            <tbody>
              {[
                { label: 'Clic email',          n: d.funnel.landed,   ref: d.sends,          top: d.sends },
                { label: 'Analyse complète',     n: d.funnel.analysed, ref: d.funnel.landed,  top: d.sends },
                { label: '1 — Diagnostic',       n: d.funnel.diag,     ref: d.funnel.analysed,top: d.sends },
                { label: '2 — Temps',            n: d.funnel.temps,    ref: d.funnel.diag,    top: d.sends },
                { label: '3 — Problèmes',        n: d.funnel.prob,     ref: d.funnel.temps,   top: d.sends },
                { label: '4 — Travail',          n: d.funnel.travail,  ref: d.funnel.prob,    top: d.sends },
                { label: '5 — Livrables',        n: d.funnel.livr,     ref: d.funnel.travail, top: d.sends },
                { label: '6 — CTA affiché',      n: d.funnel.cta,      ref: d.funnel.livr,    top: d.sends },
                { label: 'Clic achat',           n: d.funnel.ctaClick, ref: d.funnel.cta,     top: d.sends },
              ].map(({ label, n, ref, top }) => (
                <tr key={label}>
                  {td(label)}
                  {td(n, { bold: true })}
                  {td(pct(n, ref), { color: n > 0 ? '#7c3aed' : undefined })}
                  {td(pct(n, top), { color: '#9ca3af' })}
                </tr>
              ))}
              <tr>
                <td style={{ padding: '8px 14px', fontSize: 12, color: '#9ca3af', fontStyle: 'italic', borderTop: '1px solid #e5e7eb' }} colSpan={2}>
                  Skip direct vers CTA
                </td>
                <td style={{ padding: '8px 14px', fontSize: 13, fontWeight: 700, color: '#f59e0b', borderTop: '1px solid #e5e7eb' }}>
                  {d.funnel.skipped}
                </td>
                <td style={{ padding: '8px 14px', fontSize: 12, color: '#9ca3af', borderTop: '1px solid #e5e7eb' }}>
                  {pct(d.funnel.skipped, d.funnel.analysed)} des analyses
                </td>
              </tr>
            </tbody>
          </table>
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
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9ca3af' }}>Métrique : CTR (clics / envois) — ouvertures non trackées depuis 03/07</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{th('v')}{th('Sujet')}{th('Envois')}{th('Clics')}{th('CTR')}</tr></thead>
            <tbody>
              {d.variants.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Pas encore de données depuis le 03/07 20h</td></tr>
              )}
              {d.variants.map(v => (
                <tr key={v.v}>
                  {td(`v${v.v}`, { bold: true })}
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #f3f4f6', maxWidth: 280 }}>{v.subject}</td>
                  {td(v.sends)}
                  {td(v.clicks)}
                  {td(pct(v.clicks, v.sends), { color: v.clicks > 0 ? '#7c3aed' : undefined })}
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
                  {td(new Date(r.created_at).toLocaleString('fr', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
