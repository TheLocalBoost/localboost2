'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'

const FLAG: Record<string, string> = {
  FR:'🇫🇷', BE:'🇧🇪', CH:'🇨🇭', LU:'🇱🇺', MA:'🇲🇦', SN:'🇸🇳', CI:'🇨🇮',
  CA:'🇨🇦', US:'🇺🇸', GB:'🇬🇧', DE:'🇩🇪', ES:'🇪🇸', IT:'🇮🇹', XX:'🌍',
}

function FunnelSection({ days }: { days: number }) {
  const supabase = createClient()
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const since = new Date(Date.now() - days * 86400_000).toISOString()
    supabase.from('analytics_events').select('event').gte('created_at', since)
      .then(({ data }) => {
        const map: Record<string, number> = {}
        data?.forEach(r => { map[r.event] = (map[r.event] ?? 0) + 1 })
        setCounts(map)
      })
  }, [days])

  const g = (e: string) => counts[e] ?? 0
  const pct = (a: number, b: number) => b > 0 ? `${Math.round(a / b * 100)}%` : '—'
  const top = g('analyzer_search')

  const steps = [
    { label: '🔍 Analyses lancées',   value: g('analyzer_search'),  from: null },
    { label: '📊 Résultats affichés', value: g('analyzer_result'),  from: top },
    { label: '📧 Emails capturés',    value: g('email_captured'),   from: g('analyzer_result') },
    { label: '💳 Clics pricing',      value: g('cta_click'),        from: g('email_captured') },
  ]

  if (top === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-6">
      <h2 className="font-semibold text-gray-900 mb-4 text-sm">🔬 Funnel /analyser</h2>
      <div className="space-y-3">
        {steps.map(({ label, value, from }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-44 text-xs text-gray-600 shrink-0">{label}</div>
            <div className="flex-1 bg-gray-100 rounded-full h-2.5">
              <div className="bg-blue-500 h-2.5 rounded-full transition-all"
                style={{ width: top > 0 ? `${Math.round(value / top * 100)}%` : '0%' }} />
            </div>
            <div className="text-sm font-bold text-gray-900 w-8 text-right">{value}</div>
            <div className="text-xs text-gray-400 w-10 text-right">
              {from !== null ? pct(value, from as number) : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [key, setKey]       = useState('')
  const [authed, setAuthed] = useState(false)
  const [days, setDays]     = useState(30)
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function load(k = key, d = days) {
    setLoading(true)
    const res = await fetch(`/api/admin/analytics?days=${d}`, { headers: { 'x-admin-key': k } })
    if (res.status === 401) { setLoading(false); return }
    setData(await res.json())
    setAuthed(true)
    setLoading(false)
  }

  useEffect(() => { if (authed) load(key, days) }, [days])

  const maxDay = data ? Math.max(...data.dailyViews.map((d: any) => d.count), 1) : 1

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <h1 className="text-lg font-bold text-gray-900 mb-4">📊 Analytics</h1>
        <input type="password" placeholder="Clé admin" value={key} onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={() => load()} disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Chargement...' : 'Accéder →'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📊 Analytics</h1>
            <p className="text-sm text-gray-400 mt-0.5">thelocalboost.fr</p>
          </div>
          <div className="flex items-center gap-3">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${days === d ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {d}j
              </button>
            ))}
          </div>
        </div>

        {/* Funnel analyzer — données temps réel depuis analytics_events */}
        {authed && <FunnelSection days={days} />}

        {!data ? (
          <div className="text-center py-20 text-gray-400">Chargement...</div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Pages vues',        value: data.totalViews.toLocaleString(),                         color: 'text-blue-600'  },
                { label: 'Clics emails',      value: (data.emailClicks?.total || 0).toLocaleString(),          color: 'text-green-600' },
                { label: 'Signups',           value: (data.eventCounts['signup']   || 0).toString(),           color: 'text-purple-600'},
                { label: 'Analyseur lancé',  value: (data.eventCounts['analyzer'] || 0).toString(),           color: 'text-amber-600' },
              ].map((k, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
                  <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{k.label}</p>
                </div>
              ))}
            </div>

            {/* Graphique journalier */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-6">
              <h2 className="font-semibold text-gray-900 mb-4 text-sm">Pages vues — {days} derniers jours</h2>
              <div className="flex items-end gap-1" style={{ height: '80px' }}>
                {data.dailyViews.map((d: any, i: number) => {
                  const h = Math.max(Math.round((d.count / maxDay) * 100), d.count > 0 ? 6 : 0)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                      <div className="w-full rounded-t bg-blue-500 opacity-80 hover:opacity-100 transition" style={{ height: `${h}%`, minHeight: d.count > 0 ? '4px' : 0 }} />
                      <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                        {new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} — {d.count} vues
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              {/* Top pages */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm">📄 Top pages</h2>
                <div className="space-y-2">
                  {data.topPages.length === 0 && <p className="text-xs text-gray-400">Aucune donnée</p>}
                  {data.topPages.map(([path, count]: [string, number], i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 truncate max-w-[140px]">{path || '/'}</span>
                      <span className="text-xs font-semibold text-gray-900 ml-2">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pays */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm">🌍 Pays</h2>
                <div className="space-y-2">
                  {data.topCountries.length === 0 && <p className="text-xs text-gray-400">Aucune donnée</p>}
                  {data.topCountries.map(([country, count]: [string, number], i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{FLAG[country] || '🌍'} {country}</span>
                      <span className="text-xs font-semibold text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sources */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm">🔗 Sources</h2>
                <div className="space-y-2">
                  {data.topSources.length === 0 && <p className="text-xs text-gray-400">Aucune donnée</p>}
                  {data.topSources.map(([src, count]: [string, number], i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 truncate max-w-[140px]">{src}</span>
                      <span className="text-xs font-semibold text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Appareils */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm">📱 Appareils</h2>
                <div className="space-y-3">
                  {Object.entries(data.deviceCounts).map(([device, count]: [string, any]) => {
                    const total = Object.values(data.deviceCounts).reduce((a: any, b: any) => a + b, 0) as number
                    const pct = Math.round((count / total) * 100)
                    const icon = device === 'mobile' ? '📱' : device === 'tablet' ? '📊' : '💻'
                    return (
                      <div key={device}>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>{icon} {device}</span>
                          <span className="font-semibold">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Événements */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm">⚡ Événements</h2>
                <div className="space-y-2">
                  {Object.entries(data.eventCounts).length === 0 && <p className="text-xs text-gray-400">Aucun événement tracké</p>}
                  {Object.entries(data.eventCounts).sort((a: any, b: any) => b[1] - a[1]).map(([name, count]: [string, any]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 capitalize">{name.replace(/_/g, ' ')}</span>
                      <span className="text-xs font-semibold text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Clics emails */}
            {data.emailClicks?.total > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-6">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm">📧 Clics emails — {data.emailClicks.total} total</h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Top variantes cliquées</p>
                    <div className="space-y-2">
                      {data.emailClicks.byVariant.map(([vid, count]: [string, number]) => (
                        <div key={vid} className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Variante #{vid}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-100 rounded-full h-1.5">
                              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.round((count / data.emailClicks.total) * 100)}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-gray-900 w-6 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Clics par jour</p>
                    <div className="space-y-1.5">
                      {Object.entries(data.emailClicks.daily)
                        .sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7)
                        .map(([date, count]: [string, any]) => (
                        <div key={date} className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            {new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-100 rounded-full h-1.5">
                              <div className="bg-green-400 h-1.5 rounded-full" style={{ width: `${Math.min(count * 10, 100)}%` }} />
                            </div>
                            <span className="font-semibold text-gray-900 w-4 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Visites récentes */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4 text-sm">🕐 Visites récentes</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-400 border-b">
                      <th className="pb-2 font-medium">Page</th>
                      <th className="pb-2 font-medium">Pays</th>
                      <th className="pb-2 font-medium">Appareil</th>
                      <th className="pb-2 font-medium">Heure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent?.map((r: any, i: number) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 text-gray-700 max-w-[200px] truncate">{r.path}</td>
                        <td className="py-2 text-gray-500">{FLAG[r.country] || '🌍'} {r.country}</td>
                        <td className="py-2 text-gray-500 capitalize">{r.device}</td>
                        <td className="py-2 text-gray-400">
                          {new Date(r.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
