'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const LOADING_STEPS = [
  'Analyse de votre fiche Google...',
  'Comparaison avec les fiches similaires...',
  'Calcul de votre impact business...',
]

function AnalyzerInner() {
  const searchParams = useSearchParams()

  const [commerceName, setCommerceName] = useState('')
  const [city, setCity]                 = useState('')
  const [analyzing, setAnalyzing]       = useState(false)
  const [step, setStep]                 = useState(0)
  const [result, setResult]             = useState<any>(null)
  const [captureEmail, setCaptureEmail] = useState('')
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  useEffect(() => {
    const nom   = searchParams.get('nom')
    const ville = searchParams.get('ville')
    if (nom)   setCommerceName(nom)
    if (ville) setCity(ville)
    if (nom && ville) runAnalysis(nom, ville)
  }, [])

  const runAnalysis = async (name: string, ville: string) => {
    setAnalyzing(true)
    setResult(null)
    const interval = setInterval(() => setStep(s => (s + 1) % LOADING_STEPS.length), 2200)
    try {
      const res  = await fetch('/api/analyze-public', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ commerce_name: name, city: ville }),
      })
      const data = await res.json()
      setResult(data)
      setTimeout(() => document.getElementById('analyzer-result')?.scrollIntoView({ behavior: 'smooth' }), 100)
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'analyzer', path: '/', meta: { ville, score: data.score } }),
      }).catch(() => {})
    } catch {
      setResult({ error: true })
    } finally {
      clearInterval(interval)
      setStep(0)
      setAnalyzing(false)
    }
  }

  const getScoreColor = (s: number) => s >= 70 ? 'text-green-600' : s >= 40 ? 'text-amber-500' : 'text-red-500'
  const getBarColor   = (s: number) => s >= 70 ? 'bg-green-500'   : s >= 40 ? 'bg-amber-400'   : 'bg-red-500'
  const getScoreLabel = (s: number) =>
    s >= 70 ? { label: 'Bonne visibilité',        bg: 'bg-green-50 border-green-200', icon: '✅' } :
    s >= 40 ? { label: 'Visibilité insuffisante',  bg: 'bg-amber-50 border-amber-200', icon: '⚠️' } :
              { label: 'Fiche inactive',            bg: 'bg-red-50   border-red-200',   icon: '🚨' }

  const fmt = (n: number) => n.toLocaleString('fr-FR') + ' €'

  return (
    <section id="analyzer" className="py-20 px-6 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-4 py-1.5 text-sm font-medium text-blue-700 mb-4">
            🔍 Gratuit · Résultat en 30 secondes
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Combien de clients perdez-vous sur Google chaque mois ?
          </h2>
          <p className="text-gray-500">
            Entrez le nom de votre commerce — obtenez un diagnostic business avec estimation de perte réelle.
          </p>
        </div>

        <form onSubmit={e => { e.preventDefault(); runAnalysis(commerceName, city) }} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <input
              type="text" value={commerceName}
              onChange={e => setCommerceName(e.target.value)}
              placeholder="Nom de votre commerce" required
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white shadow-sm"
            />
            <input
              type="text" value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Ville" required
              className="w-36 rounded-xl border border-gray-200 px-4 py-3.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white shadow-sm"
            />
          </div>
          <button
            type="submit" disabled={analyzing}
            className="w-full rounded-xl bg-blue-600 py-4 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-60 shadow-sm"
          >
            {analyzing ? `⏳ ${LOADING_STEPS[step]}` : '🔍 Obtenir mon diagnostic gratuit'}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            Nom introuvable ? Vérifiez l'orthographe exacte sur Google Maps.
          </p>
        </form>

        <div id="analyzer-result">
          {result && !result.error && (() => {
            const { label, bg, icon } = getScoreLabel(result.score)
            const sector = result.sector        || { label: 'Commerce local', average: 60 }
            const gaps   = result.gaps          || []
            const bi     = result.businessImpact
            const diff   = result.score - sector.average

            return (
              <div className="space-y-4">

                {/* BLOC 1 — Score */}
                <div className={`rounded-2xl border-2 p-6 ${bg}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Score de visibilité</p>
                      <div className="flex items-end gap-2">
                        <span className={`text-6xl font-extrabold leading-none ${getScoreColor(result.score)}`}>{result.score}</span>
                        <span className="text-gray-400 text-xl mb-1">/100</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">Moyenne {sector.label}</p>
                      <p className="text-2xl font-bold text-gray-400">{sector.average}/100</p>
                      <p className={`text-xs font-semibold mt-0.5 ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {diff >= 0 ? `+${diff} pts au-dessus` : `${diff} pts en dessous`}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-white/60 rounded-full h-2.5 mb-3">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-700 ${getBarColor(result.score)}`}
                      style={{ width: `${result.score}%` }}
                    />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">{icon} {label}</p>
                </div>

                {/* BLOC 2 — Perte estimée (aha moment) */}
                {bi && (
                  <div className="rounded-2xl border-2 border-red-200 bg-white p-6">
                    <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-4">
                      💸 Ce que vous perdez chaque mois
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-red-50 rounded-xl p-4 text-center">
                        <p className="text-3xl font-extrabold text-red-500">{bi.appels_min}–{bi.appels_max}</p>
                        <p className="text-xs text-gray-500 mt-1">appels / contacts perdus</p>
                      </div>
                      <div className="bg-red-50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-extrabold text-red-500">≈ {fmt(bi.perte_min)}</p>
                        <p className="text-xs text-gray-500 mt-1">à {fmt(bi.perte_max)}/mois</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 italic border-l-2 border-red-300 pl-3">
                      "{bi.accroche}"
                    </p>
                  </div>
                )}

                {/* BLOC 3 — Ce qui bloque + actions */}
                {(gaps.length > 0 || bi) && (
                  <div className="rounded-2xl border border-gray-100 bg-white p-6">
                    {gaps.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ce qui bloque votre visibilité</p>
                        <ul className="space-y-2.5 mb-5">
                          {gaps.map((gap: string, i: number) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                              <span className="text-red-400 shrink-0 mt-0.5">✗</span>{gap}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    {bi && (
                      <>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Actions prioritaires</p>
                        <ul className="space-y-2">
                          {[bi.action_1, bi.action_2, bi.action_3].filter(Boolean).map((a: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="text-blue-500 shrink-0 font-bold mt-0.5">{i + 1}.</span>{a}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}

                {/* CTA essai gratuit */}
                <div className="rounded-2xl bg-blue-600 p-6 text-center">
                  <p className="text-white font-bold text-lg mb-1">
                    LocalBoost corrige tout ça automatiquement
                  </p>
                  <p className="text-blue-200 text-sm mb-5">
                    Posts hebdomadaires, réponses aux avis, score suivi chaque semaine.
                  </p>
                  <a
                    href="/signup"
                    className="block w-full rounded-xl bg-white py-4 text-sm font-bold text-blue-600 hover:bg-blue-50 transition"
                  >
                    Démarrer l'essai gratuit 7 jours →
                  </a>
                  <p className="text-blue-300 text-xs mt-2.5">
                    0€ débité pendant 7 jours · Sans engagement · Annulation en 1 clic
                  </p>
                </div>

                {/* Capture email */}
                <div className="rounded-xl border border-gray-100 bg-white p-4">
                  {captureStatus === 'done' ? (
                    <p className="text-xs text-green-600 text-center py-1">✓ Rapport envoyé par email.</p>
                  ) : captureStatus === 'loading' ? (
                    <p className="text-xs text-gray-400 text-center py-1">Envoi...</p>
                  ) : (
                    <>
                      <form
                        onSubmit={async e => {
                          e.preventDefault()
                          setCaptureStatus('loading')
                          try {
                            await fetch('/api/waitlist', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: captureEmail, commerce_name: commerceName, city, score: result.score, gaps, sector }),
                            })
                          } finally { setCaptureStatus('done') }
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="email" value={captureEmail}
                          onChange={e => setCaptureEmail(e.target.value)}
                          placeholder="Recevoir ce rapport par email" required
                          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                        />
                        <button type="submit" className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition whitespace-nowrap">
                          Envoyer
                        </button>
                      </form>
                      <p className="text-xs text-gray-400 mt-1.5 text-center">Pas de spam. Désinscription en 1 clic.</p>
                    </>
                  )}
                </div>

              </div>
            )
          })()}

          {result?.error && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-5">
              <p className="font-semibold text-amber-800 mb-1">Établissement non identifié automatiquement.</p>
              <p className="text-sm text-amber-700 mb-3">Vérifiez que le nom correspond exactement à celui sur Google Maps, puis relancez.</p>
              <button onClick={() => setResult(null)} className="text-sm font-semibold text-amber-800 underline">
                Modifier la recherche →
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default function Analyzer() {
  return (
    <Suspense fallback={null}>
      <AnalyzerInner />
    </Suspense>
  )
}
