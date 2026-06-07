'use client'

import { useState } from 'react'

interface Stats {
  sent: number
  remaining: number
  totalLeads: number
  bounces: number
  totalClicks: number
  ctrGlobal: string
  waitlistCount: number
  activeSubscribers: number
  trialingSubscribers: number
  mrr: number
  bySector: [string, number][]
  availableSectors: [string, number][]
  byVariantCTR: { id: number; subject: string; sends: number; clicks: number; ctr: number }[]
  recentClicks: { variant_id: number; clicked_at: string; nom: string | null; secteur: string | null }[]
  recentSends: { nom: string; email: string; secteur: string; ville: string; sent_at: string }[]
  dailySends: { date: string; count: number }[]
}

interface Analytics {
  totalViews: number
  emailClicks: { total: number }
  eventCounts: Record<string, number>
  topSources: [string, number][]
  topPages: [string, number][]
}

export default function AdminPage() {
  const [key, setKey]             = useState('')
  const [authed, setAuthed]       = useState(false)
  const [stats, setStats]         = useState<Stats | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [cronRunning, setCronRunning]       = useState(false)
  const [cronResult, setCronResult]         = useState<any>(null)
  const [reviewsRunning, setReviewsRunning] = useState(false)
  const [reviewsResult, setReviewsResult]   = useState<any>(null)

  async function fetchAll(k = key) {
    setLoading(true); setError('')
    const [sRes, aRes] = await Promise.all([
      fetch('/api/admin/stats',            { headers: { 'x-admin-key': k } }),
      fetch('/api/admin/analytics?days=30',{ headers: { 'x-admin-key': k } }),
    ])
    if (sRes.status === 401) { setError('Clé invalide'); setLoading(false); return }
    setStats(await sRes.json())
    setAnalytics(await aRes.json())
    setAuthed(true); setLoading(false)
  }

  async function triggerCron() {
    setCronRunning(true); setCronResult(null)
    const res = await fetch('/api/cron/weekly', { headers: { 'x-admin-key': key } })
    setCronResult(await res.json()); setCronRunning(false)
  }

  async function triggerReviews() {
    setReviewsRunning(true); setReviewsResult(null)
    const res = await fetch('/api/cron/reviews', { headers: { 'x-admin-key': key } })
    setReviewsResult(await res.json()); setReviewsRunning(false)
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
          <h1 className="text-lg font-bold text-gray-900 mb-6">LocalBoost Admin</h1>
          <input type="password" placeholder="Clé admin" value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchAll()}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <button onClick={() => fetchAll()} disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Chargement...' : 'Accéder →'}
          </button>
        </div>
      </div>
    )
  }

  const s   = stats
  const maxDay = s ? Math.max(...s.dailySends.map(d => d.count), 1) : 1
  const bounceRate = s && s.sent > 0 ? ((s.bounces / s.sent) * 100).toFixed(1) : '0.0'

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">LocalBoost — Admin</h1>
          <div className="flex gap-3 text-sm">
            <button onClick={() => fetchAll()} className="text-blue-600 hover:underline">↻ Rafraîchir</button>
            <a href="/admin/analytics" className="text-gray-500 hover:text-gray-800">Analytics</a>
            <a href="/admin/contacts"  className="text-gray-500 hover:text-gray-800">Messages</a>
            <button onClick={() => { setAuthed(false); setStats(null) }} className="text-gray-400 hover:text-gray-600">Déconnexion</button>
          </div>
        </div>

        {/* ── KPIs ────────────────────────────────────────────────────────── */}
        {s && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Emails envoyés',    value: s.sent.toLocaleString('fr'),        sub: `${s.remaining.toLocaleString('fr')} restants`,      color: 'text-blue-600'   },
              { label: 'Clics trackés',     value: s.totalClicks.toString(),            sub: `CTR ${s.ctrGlobal}%`,                               color: 'text-green-600'  },
              { label: 'Bounces',           value: s.bounces.toString(),               sub: `${bounceRate}% du total`,                           color: 'text-red-500'    },
              { label: 'MRR',               value: `${s.mrr}€/mois`,                  sub: `${s.activeSubscribers} actifs · ${s.trialingSubscribers} essai`, color: 'text-purple-600' },
            ].map((k, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-gray-500 mt-1">{k.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Entonnoir + Activité ─────────────────────────────────────────── */}
        {s && (
          <div className="grid sm:grid-cols-2 gap-4 mb-5">

            {/* Entonnoir */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Entonnoir</h2>
              {[
                { label: 'Leads total',    n: s.totalLeads,    ref: s.totalLeads,    color: 'bg-gray-300'  },
                { label: 'Envoyés',        n: s.sent,          ref: s.totalLeads,    color: 'bg-blue-400'  },
                { label: 'Clics',          n: s.totalClicks,   ref: s.sent,          color: 'bg-green-500' },
                { label: 'Waitlist',       n: s.waitlistCount, ref: s.totalClicks,   color: 'bg-amber-400' },
                { label: 'Abonnés actifs', n: s.activeSubscribers, ref: s.waitlistCount, color: 'bg-purple-500' },
              ].map((row, i) => {
                const pct = row.ref > 0 ? Math.round((row.n / row.ref) * 100) : 0
                return (
                  <div key={i} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{row.label}</span>
                      <span className="font-semibold">{row.n.toLocaleString('fr')}
                        {i > 0 && <span className="text-gray-400 ml-1">({pct}%)</span>}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${row.color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Activité 7j */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Envois — 7 derniers jours</h2>
              <div className="flex items-end gap-1.5 h-24">
                {s.dailySends.map((d, i) => {
                  const h = Math.max(Math.round((d.count / maxDay) * 100), d.count > 0 ? 6 : 0)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-gray-700 h-4">{d.count || ''}</span>
                      <div className="w-full flex items-end" style={{ height: '56px' }}>
                        <div className="w-full rounded-t bg-blue-500 opacity-80" style={{ height: `${h}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Variantes (20) ──────────────────────────────────────────────── */}
        {s && s.byVariantCTR.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Thompson Sampling — 20 variantes</h2>
              <span className="text-xs text-gray-400">apprentissage automatique sur clics réels</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-400 border-b">
                    <th className="pb-2 font-medium w-6">#</th>
                    <th className="pb-2 font-medium">Sujet</th>
                    <th className="pb-2 font-medium text-right w-16">Envois</th>
                    <th className="pb-2 font-medium text-right w-12">Clics</th>
                    <th className="pb-2 font-medium text-right w-14">CTR</th>
                    <th className="pb-2 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {s.byVariantCTR.map((v, i) => (
                    <tr key={v.id} className="border-b last:border-0">
                      <td className="py-2 text-gray-400">{i === 0 && v.sends >= 10 ? '🏆' : `${v.id}`}</td>
                      <td className="py-2 text-gray-700 max-w-[260px] truncate">{v.subject}</td>
                      <td className="py-2 text-right text-gray-600">{v.sends}</td>
                      <td className="py-2 text-right text-gray-600">{v.clicks}</td>
                      <td className={`py-2 text-right font-bold ${v.ctr > 2 ? 'text-green-600' : v.ctr > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                        {v.sends >= 5 ? `${v.ctr}%` : '—'}
                      </td>
                      <td className="py-2 pl-2">
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(v.ctr * 20, 100)}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 mt-2">CTR affiché après 5 envois minimum.</p>
            </div>
          </div>
        )}

        {/* ── Clics récents + Envois récents ──────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-4 mb-5">

          {/* Clics récents */}
          {s && s.recentClicks.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Derniers clics</h2>
              <div className="space-y-2">
                {s.recentClicks.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.nom ?? '—'}</p>
                      <p className="text-xs text-gray-400">{c.secteur ?? ''} · variante #{c.variant_id}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {new Date(c.clicked_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Envois récents */}
          {s && s.recentSends.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Derniers envois</h2>
              <div className="space-y-2">
                {s.recentSends.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[180px]">{r.nom}</p>
                      <p className="text-xs text-gray-400">{r.secteur} · {r.ville}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {new Date(r.sent_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Leads par secteur ────────────────────────────────────────────── */}
        {s && (
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Envoyés par secteur</h2>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {s.bySector.map(([sec, n]) => (
                  <div key={sec}>
                    <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                      <span className="capitalize">{sec}</span>
                      <span className="font-semibold">{n.toLocaleString('fr')}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${Math.round(n / Math.max(s.sent, 1) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Disponibles par secteur</h2>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {s.availableSectors.length === 0
                  ? <p className="text-xs text-gray-400">Aucun lead disponible dans Supabase.</p>
                  : s.availableSectors.map(([sec, n]) => (
                    <div key={sec} className="flex justify-between text-xs">
                      <span className="capitalize text-gray-600">{sec}</span>
                      <span className="font-semibold text-gray-900">{n}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* ── Analytics site ───────────────────────────────────────────────── */}
        {analytics && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Analytics — 30 jours</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Pages vues',   value: analytics.totalViews,                            color: 'text-blue-600'   },
                { label: 'Clics emails', value: analytics.emailClicks?.total ?? 0,               color: 'text-green-600'  },
                { label: 'Analyses',     value: analytics.eventCounts?.['analyzer_search'] ?? 0, color: 'text-amber-600'  },
                { label: 'Signups',      value: analytics.eventCounts?.['signup'] ?? 0,          color: 'text-purple-600' },
              ].map((k, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Sources</p>
                <div className="space-y-1">
                  {analytics.topSources?.slice(0, 6).map(([src, n]) => (
                    <div key={src} className="flex justify-between text-xs">
                      <span className="text-gray-500 truncate max-w-[140px]">{src || 'direct'}</span>
                      <span className="font-semibold text-gray-800">{n}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Top pages</p>
                <div className="space-y-1">
                  {analytics.topPages?.slice(0, 6).map(([path, n]) => (
                    <div key={path} className="flex justify-between text-xs">
                      <span className="text-gray-500 truncate max-w-[140px]">{path || '/'}</span>
                      <span className="font-semibold text-gray-800">{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Pipeline outreach ────────────────────────────────────────────── */}
        <div className="bg-gray-900 rounded-xl p-5 text-white mb-5">
          <h2 className="text-sm font-semibold mb-3 text-gray-200">Pipeline outreach local</h2>
          <div className="font-mono text-xs space-y-1 text-gray-400">
            <p><span className="text-green-400">1.</span> node scripts/outreach/harvest_all.js</p>
            <p><span className="text-green-400">2.</span> node scripts/outreach/merge_serpapi.mjs</p>
            <p><span className="text-green-400">3.</span> cp scripts/outreach/leads_new.csv scripts/outreach/leads_ready.csv</p>
            <p><span className="text-green-400">4.</span> node scripts/outreach/send.js <span className="text-amber-400">200</span></p>
          </div>
          <p className="text-xs text-gray-500 mt-3">Serper quotas reset chaque nuit à minuit UTC.</p>
        </div>

        {/* ── Crons ────────────────────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Email hebdomadaire abonnés</h2>
            <p className="text-xs text-gray-400 mb-3">Lundi 8h — post Google + score pour chaque abonné actif.</p>
            <button onClick={triggerCron} disabled={cronRunning}
              className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50">
              {cronRunning ? 'En cours...' : 'Lancer maintenant'}
            </button>
            {cronResult && <p className="mt-2 text-xs text-green-700">{cronResult.sent} envoyés · {cronResult.skipped} ignorés</p>}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Alertes avis</h2>
            <p className="text-xs text-gray-400 mb-3">Détecte les nouveaux avis Google et envoie 3 réponses suggérées.</p>
            <button onClick={triggerReviews} disabled={reviewsRunning}
              className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
              {reviewsRunning ? 'Vérification...' : 'Vérifier maintenant'}
            </button>
            {reviewsResult && <p className="mt-2 text-xs text-green-700">{reviewsResult.checked} vérifiées · {reviewsResult.sent} alertes</p>}
          </div>
        </div>

      </div>
    </div>
  )
}
