import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const revalidate = 60

async function getStats() {
  const [sends, opens, clicks, bounces, byVariantRaw, bySenderRaw] = await Promise.all([
    supabase.from('outreach_events').select('*', { count: 'exact', head: true }).eq('event', 'sent'),
    supabase.from('outreach_events').select('*', { count: 'exact', head: true }).eq('event', 'open'),
    supabase.from('outreach_events').select('*', { count: 'exact', head: true }).eq('event', 'click'),
    supabase.from('outreach_events').select('*', { count: 'exact', head: true }).eq('event', 'bounce'),
    supabase.from('outreach_events').select('variant, event').not('variant', 'is', null).limit(100000),
    supabase.from('outreach_events').select('sender, event').not('sender', 'is', null).limit(100000),
  ])

  const totalSends   = sends.count   ?? 0
  const totalOpens   = opens.count   ?? 0
  const totalClicks  = clicks.count  ?? 0
  const totalBounces = bounces.count ?? 0

  const variantMap: Record<string, { sends: number; opens: number; clicks: number }> = {}
  for (const row of byVariantRaw.data ?? []) {
    const v = row.variant ?? 'unknown'
    if (!variantMap[v]) variantMap[v] = { sends: 0, opens: 0, clicks: 0 }
    if (row.event === 'sent')  variantMap[v].sends++
    if (row.event === 'open')  variantMap[v].opens++
    if (row.event === 'click') variantMap[v].clicks++
  }

  const senderMap: Record<string, { sends: number; opens: number }> = {}
  for (const row of bySenderRaw.data ?? []) {
    const s = row.sender ?? 'unknown'
    if (!senderMap[s]) senderMap[s] = { sends: 0, opens: 0 }
    if (row.event === 'sent') senderMap[s].sends++
    if (row.event === 'open') senderMap[s].opens++
  }

  return {
    global: { sends: totalSends, opens: totalOpens, clicks: totalClicks, bounces: totalBounces },
    variants: Object.entries(variantMap).map(([v, s]) => ({ v, ...s })).sort((a, b) => b.sends - a.sends),
    senders: Object.entries(senderMap).map(([s, v]) => ({ s, ...v })).sort((a, b) => b.sends - a.sends).slice(0, 20),
  }
}

function pct(n: number, d: number) { return d === 0 ? '—' : (n / d * 100).toFixed(1) + '%' }

export default async function OutreachPage({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const { k } = await searchParams
  if (k !== process.env.ADMIN_SECRET_KEY) {
    return <div style={{ fontFamily: 'monospace', padding: 40, color: '#ef4444' }}>401 — clé invalide</div>
  }

  const { global: g, variants, senders } = await getStats()

  const card = (label: string, value: string | number, sub?: string, color = '#1d4ed8') => (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      <p style={{ margin: 0, fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{label}</p>
      <p style={{ margin: '6px 0 0', fontSize: 32, fontWeight: 800, color }}>{value}</p>
      {sub && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>{sub}</p>}
    </div>
  )

  const th = (t: string) => (
    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{t}</th>
  )
  const td = (t: string | number, bold = false) => (
    <td style={{ padding: '10px 14px', fontSize: 13, color: bold ? '#111827' : '#374151', fontWeight: bold ? 700 : 400, borderBottom: '1px solid #f3f4f6' }}>{t}</td>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif', padding: '32px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827' }}>📬 Stats Cold Email</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>fichelocal.net · mis à jour toutes les 60s</p>
        </div>

        {/* Cartes globales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {card('Envois', g.sends.toLocaleString('fr'))}
          {card('Ouvertures', g.opens, pct(g.opens, g.sends) + ' taux ouverture', '#16a34a')}
          {card('Clics', g.clicks, pct(g.clicks, g.sends) + ' taux clic', '#7c3aed')}
          {card('Bounces', g.bounces, pct(g.bounces, g.sends) + ' taux bounce', '#dc2626')}
        </div>

        {/* Par variante */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 20 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Par variante (Thompson Sampling)</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{th('Variante')}{th('Envois')}{th('Ouvertures')}{th('Taux ouv.')}{th('Clics')}{th('Taux clic')}</tr></thead>
            <tbody>
              {variants.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Aucune donnée</td></tr>
              )}
              {variants.map(v => (
                <tr key={v.v}>
                  {td(`v${v.v}`, true)}
                  {td(v.sends)}
                  {td(v.opens)}
                  {td(pct(v.opens, v.sends))}
                  {td(v.clicks)}
                  {td(pct(v.clicks, v.sends))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Par expéditeur */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Top expéditeurs (20)</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{th('Adresse')}{th('Envois')}{th('Ouvertures')}{th('Taux ouv.')}</tr></thead>
            <tbody>
              {senders.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Aucune donnée</td></tr>
              )}
              {senders.map(s => (
                <tr key={s.s}>
                  {td(s.s, true)}
                  {td(s.sends)}
                  {td(s.opens)}
                  {td(pct(s.opens, s.sends))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
