'use client'

import { useState } from 'react'

interface VariantCTR {
  id: number; sends: number; clicks: number; ctr: number; subjectLabel: string; hookIdx: number
}
interface RecentClick {
  variant_id: number; clicked_at: string; lead: { nom: string; email: string; secteur: string } | null
}
interface Stats {
  total: number; sent: number; remaining: number
  totalClicks: number; ctrGlobal: string
  waitlistCount: number; activeSubscribers: number; trialingSubscribers: number; estimatedMRR: number
  bySector: [string, number][]
  byVariantCTR: VariantCTR[]
  recentSends: { nom: string; email: string; secteur: string; ville: string; sent_at: string; subject_variant: string }[]
  recentClicks: RecentClick[]
  dailySends: { date: string; count: number }[]
  todayQuota: number
}

const DAILY_LIMIT = 350

export default function AdminPage() {
  const [key, setKey]       = useState('')
  const [authed, setAuthed] = useState(false)
  const [stats, setStats]   = useState<Stats | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [sending, setSending]   = useState(false)
  const [sendProgress, setSendProgress] = useState(0)
  const [limit, setLimit]       = useState(50)
  const [secteurFilter, setSecteurFilter] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [sendResult, setSendResult] = useState<any>(null)
  const [preview, setPreview]   = useState<{ available: number; sectors: [string,number][]; cities: [string,number][] } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [cronRunning, setCronRunning] = useState(false)
  const [cronResult, setCronResult]   = useState<any>(null)
  const [reviewsRunning, setReviewsRunning] = useState(false)
  const [reviewsResult, setReviewsResult]   = useState<any>(null)

  async function fetchStats(k = key) {
    setLoading(true); setError('')
    const res = await fetch('/api/admin/stats', { headers: { 'x-admin-key': k } })
    if (res.status === 401) { setError('Clé invalide'); setLoading(false); return }
    setStats(await res.json()); setAuthed(true); setLoading(false)
  }

  async function loadPreview() {
    setPreviewLoading(true); setPreview(null); setSendResult(null)
    const res = await fetch('/api/admin/preview', {
      method: 'POST',
      headers: { 'x-admin-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit, secteur: secteurFilter || undefined }),
    })
    setPreview(await res.json()); setPreviewLoading(false); setShowConfirm(true)
  }

  async function sendBatch() {
    setShowConfirm(false); setSending(true); setSendResult(null); setSendProgress(0)
    // Animation de progression simulée pendant l'envoi
    const interval = setInterval(() => setSendProgress(p => Math.min(p + 2, 90)), 300)
    const res = await fetch('/api/admin/send', {
      method: 'POST',
      headers: { 'x-admin-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit, secteur: secteurFilter || undefined, testEmail: testEmail || undefined }),
    })
    clearInterval(interval); setSendProgress(100)
    setSendResult(await res.json()); setSending(false); setPreview(null)
    setTimeout(() => setSendProgress(0), 2000)
    fetchStats()
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

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xl">🚀</span>
            <h1 className="text-lg font-bold text-gray-900">LocalBoost Admin</h1>
          </div>
          <input
            type="password"
            placeholder="Clé admin"
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchStats()}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            onClick={() => fetchStats()}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Vérification...' : 'Accéder →'}
          </button>
        </div>
      </div>
    )
  }

  const s = stats
  const sentPct  = s ? Math.round((s.sent / Math.max(s.total, 1)) * 100) : 0
  const clickPct = s ? Math.round((s.totalClicks / Math.max(s.sent, 1)) * 100) : 0
  const maxDay   = s ? Math.max(...s.dailySends.map(d => d.count), 1) : 1
  const quotaPct = Math.round((s?.todayQuota ?? 0) / DAILY_LIMIT * 100)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🚀 Outreach Admin</h1>
          <div className="flex gap-3">
            <button onClick={() => fetchStats()} className="text-sm text-green-600 hover:underline">↻ Rafraîchir</button>
            <button onClick={() => { setAuthed(false); setStats(null) }} className="text-sm text-gray-400 hover:text-gray-600">Déconnexion</button>
          </div>
        </div>

        {/* KPIs */}
        {s && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Total leads',   value: s.total.toLocaleString(),          color: 'text-gray-900'   },
              { label: 'Envoyés',       value: s.sent.toLocaleString(),           color: 'text-blue-600'   },
              { label: 'Clics',         value: s.totalClicks.toLocaleString(),    color: 'text-green-600'  },
              { label: 'CTR global',    value: `${s.ctrGlobal}%`,                color: 'text-amber-600'  },
              { label: `${s.activeSubscribers} abonnés · ${s.trialingSubscribers} essai`,
                value: `${s.estimatedMRR}€/mois`,                                color: 'text-purple-600' },
            ].map((k, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-gray-500 mt-1">{k.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Funnel + Quota */}
        {s && (
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {/* Funnel */}
            <div className="sm:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4 text-sm">Entonnoir de conversion</h2>
              {[
                { label: 'Leads total',    count: s.total,       pct: 100,     color: 'bg-gray-200'  },
                { label: 'Emails envoyés', count: s.sent,        pct: sentPct, color: 'bg-blue-400'  },
                { label: 'Clics reçus',   count: s.totalClicks, pct: clickPct,color: 'bg-green-500' },
                { label: 'Inscrits waitlist', count: s.waitlistCount, pct: Math.round(s.waitlistCount / Math.max(s.totalClicks, 1) * clickPct), color: 'bg-amber-400' },
              ].map((f, i) => (
                <div key={i} className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{f.label}</span>
                    <span className="font-semibold">{f.count.toLocaleString()} <span className="text-gray-400">({f.pct}%)</span></span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${f.color}`} style={{ width: `${f.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Quota + Waitlist */}
            <div className="flex flex-col gap-3">
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex-1">
                <h2 className="font-semibold text-gray-900 mb-3 text-sm">Quota Google Places</h2>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-2xl font-bold text-gray-900">{s.todayQuota}</span>
                  <span className="text-gray-400 text-sm mb-0.5">/ {DAILY_LIMIT}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${quotaPct > 80 ? 'bg-red-500' : quotaPct > 50 ? 'bg-amber-400' : 'bg-green-500'}`} style={{ width: `${Math.min(quotaPct, 100)}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{DAILY_LIMIT - (s.todayQuota)} restants aujourd'hui</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <p className="text-xs text-gray-500">Waitlist inscrits</p>
                <p className="text-2xl font-bold text-amber-600">{s.waitlistCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* Activité 7j */}
        {s && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-6">
            <h2 className="font-semibold text-gray-900 mb-4 text-sm">Activité — 7 derniers jours</h2>
            <div className="flex items-end gap-2 h-20">
              {s.dailySends.map((d, i) => {
                const h = Math.max(Math.round((d.count / maxDay) * 100), d.count > 0 ? 8 : 0)
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-gray-700">{d.count || ''}</span>
                    <div className="w-full flex items-end" style={{ height: '56px' }}>
                      <div className="w-full rounded-t bg-green-500 opacity-80" style={{ height: `${h}%` }} />
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Modale de confirmation */}
        {showConfirm && preview && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Confirmer l'envoi</h3>
              <p className="text-sm text-gray-500 mb-5">Vérifiez les détails avant de lancer.</p>

              <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Emails à envoyer</span>
                  <span className="font-bold text-gray-900">{preview.available.toLocaleString()}</span>
                </div>
                {secteurFilter && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Secteur ciblé</span>
                    <span className="font-semibold capitalize text-blue-600">{secteurFilter}</span>
                  </div>
                )}
                {preview.sectors.length > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-600">Secteurs : </span>
                    <span className="text-gray-700">{preview.sectors.map(([s, c]) => `${s} (${c})`).join(', ')}</span>
                  </div>
                )}
                {preview.cities.length > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-600">Villes : </span>
                    <span className="text-gray-700">{preview.cities.map(([c]) => c).join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowConfirm(false); setPreview(null) }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={sendBatch}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Envoyer {preview.available} emails →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Envoyer + Secteurs */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {/* Batch */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 text-sm">Envoyer un batch</h2>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-20">Secteur</label>
                <select
                  value={secteurFilter}
                  onChange={e => { setSecteurFilter(e.target.value); setPreview(null); setSendResult(null) }}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Tous les secteurs</option>
                  {s?.bySector.map(([sec]) => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-20">Quantité</label>
                <input
                  type="number" value={limit}
                  onChange={e => { setLimit(Number(e.target.value)); setPreview(null); setSendResult(null) }}
                  min={1} max={500}
                  className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-20">Test email</label>
                <input
                  type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)}
                  placeholder="preview@email.com"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Barre de progression */}
            {sending && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Envoi en cours...</span>
                  <span>{sendProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${sendProgress}%` }} />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {testEmail && (
                <button
                  onClick={sendBatch} disabled={sending}
                  className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-gray-600 hover:bg-gray-700 disabled:opacity-50"
                >
                  {sending ? 'Envoi...' : `Envoyer aperçu à ${testEmail.split('@')[0]}@... →`}
                </button>
              )}
              <button
                onClick={loadPreview} disabled={sending || previewLoading}
                className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {previewLoading ? 'Vérification...' : sending ? 'Envoi en cours...' : `🚀 Lancer la campagne — ${limit} emails →`}
              </button>
            </div>

            {sendResult && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${sendResult.errors?.length ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>
                {sendResult.test
                  ? <p className="font-semibold">✅ Email test envoyé — variante #{sendResult.preview?.variantId}</p>
                  : <p className="font-semibold">✅ {sendResult.sent} emails envoyés</p>
                }
                {sendResult.top_variants?.map((v: any, i: number) => (
                  <p key={i} className="text-xs mt-0.5">#{v.variant} → {v.sent} envois · CTR {v.ctr}</p>
                ))}
                {sendResult.errors?.map((e: string, i: number) => (
                  <p key={i} className="text-xs mt-1 text-red-500">{e}</p>
                ))}
              </div>
            )}
          </div>

          {/* Par secteur */}
          {s?.bySector && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4 text-sm">Leads par secteur</h2>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {s.bySector.map(([sector, count]) => {
                  const pct = Math.round((count / s.sent) * 100)
                  return (
                    <div key={sector}>
                      <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                        <span className="capitalize">{sector}</span>
                        <span className="font-semibold">{count.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Thompson Sampling leaderboard */}
        {s?.byVariantCTR && s.byVariantCTR.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 text-sm">🧠 Thompson Sampling — Top variantes</h2>
              <span className="text-xs text-gray-400">100 variantes actives · apprentissage automatique</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b">
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">Sujet</th>
                    <th className="pb-2 font-medium">Accroche</th>
                    <th className="pb-2 font-medium text-right">Envois</th>
                    <th className="pb-2 font-medium text-right">Clics</th>
                    <th className="pb-2 font-medium text-right">CTR</th>
                    <th className="pb-2 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {s.byVariantCTR.map((v, i) => (
                    <tr key={v.id} className="border-b last:border-0">
                      <td className="py-2 text-gray-400 text-xs">
                        {i === 0 && v.sends >= 3 ? '🏆' : `${v.id}`}
                      </td>
                      <td className="py-2 text-gray-700 text-xs max-w-[160px] truncate">{v.subjectLabel}</td>
                      <td className="py-2 text-gray-400 text-xs">Accroche {v.hookIdx + 1}</td>
                      <td className="py-2 text-right text-gray-600 text-xs">{v.sends}</td>
                      <td className="py-2 text-right text-gray-600 text-xs">{v.clicks}</td>
                      <td className={`py-2 text-right font-bold text-xs ${v.ctr > 10 ? 'text-green-600' : v.ctr > 5 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {v.sends >= 3 ? `${v.ctr}%` : '—'}
                      </td>
                      <td className="py-2 pl-2">
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(v.ctr * 5, 100)}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 mt-3">CTR affiché uniquement après 3 envois. Le système favorise automatiquement les meilleures variantes.</p>
            </div>
          </div>
        )}

        {/* Clics récents + Envois récents */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {/* Clics récents */}
          {s?.recentClicks && s.recentClicks.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4 text-sm">🖱️ Derniers clics</h2>
              <div className="space-y-2">
                {s.recentClicks.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.lead?.nom ?? 'Inconnu'}</p>
                      <p className="text-xs text-gray-400">{c.lead?.secteur ?? ''} · variante #{c.variant_id}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(c.clicked_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Envois récents */}
          {s?.recentSends && s.recentSends.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4 text-sm">📤 Derniers envois</h2>
              <div className="space-y-2">
                {s.recentSends.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[180px]">{r.nom}</p>
                      <p className="text-xs text-gray-400">{r.secteur} · {r.ville} · v{r.subject_variant}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(r.sent_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Outils automatiques */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-1 text-sm">📧 Email hebdomadaire</h2>
            <p className="text-xs text-gray-400 mb-3">Chaque lundi 8h. Post Google + score pour chaque abonné actif.</p>
            <button onClick={triggerCron} disabled={cronRunning}
              className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50">
              {cronRunning ? 'En cours...' : 'Lancer maintenant'}
            </button>
            {cronResult && (
              <p className="mt-2 text-sm text-green-700">{cronResult.sent} envoyés · {cronResult.skipped} ignorés</p>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-1 text-sm">⭐ Alertes avis</h2>
            <p className="text-xs text-gray-400 mb-3">1×/jour. Détecte les nouveaux avis et envoie 3 réponses générées.</p>
            <button onClick={triggerReviews} disabled={reviewsRunning}
              className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
              {reviewsRunning ? 'Vérification...' : 'Vérifier maintenant'}
            </button>
            {reviewsResult && (
              <p className="mt-2 text-sm text-green-700">{reviewsResult.checked} vérifiées · {reviewsResult.sent} alertes</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
