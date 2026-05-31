'use client'
import { useState } from 'react'

const LOADING_STEPS = [
  'Analyse de votre fiche Google...',
  'Comparaison avec les fiches similaires...',
  'Calcul du score de visibilité...',
]

export default function Analyzer() {
  const [commerceName, setCommerceName] = useState('')
  const [city, setCity] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [captureEmail, setCaptureEmail] = useState('')
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  const runAnalysis = async (name: string, ville: string) => {
    setAnalyzing(true)
    setResult(null)
    const interval = setInterval(() => setLoadingStep(s => (s + 1) % LOADING_STEPS.length), 2000)
    try {
      const res = await fetch('/api/analyze-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commerce_name: name, city: ville }),
      })
      const data = await res.json()
      setResult(data)
      setTimeout(() => document.getElementById('analyzer-result')?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch {
      setResult({ error: true })
    } finally {
      clearInterval(interval)
      setLoadingStep(0)
      setAnalyzing(false)
    }
  }

  const getScoreColor = (s: number) => s >= 70 ? 'text-green-600' : s >= 40 ? 'text-amber-500' : 'text-red-500'
  const getBarColor  = (s: number) => s >= 70 ? 'bg-green-500' : s >= 40 ? 'bg-amber-500' : 'bg-red-500'
  const getScoreMsg  = (s: number) => {
    if (s >= 70) return { label: '✅ Bonne visibilité', msg: 'Votre fiche Google est active. Maintenez ce rythme pour rester visible.', bg: 'bg-green-50 border-green-200' }
    if (s >= 40) return { label: '⚠️ Visibilité insuffisante', msg: 'Votre fiche manque d\'activité. Vous perdez probablement des clients sans le savoir.', bg: 'bg-amber-50 border-amber-200' }
    return { label: '🚨 Fiche Google inactive', msg: 'Votre fiche n\'est pas optimisée. Des clients potentiels ne vous trouvent pas.', bg: 'bg-red-50 border-red-200' }
  }

  return (
    <section id="analyzer" className="py-20 px-6 bg-gray-50">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-4 py-1.5 text-sm font-medium text-blue-700 mb-4">
          🔍 Gratuit · Résultat en 30 secondes
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Quel est votre score de visibilité Google ?
        </h2>
        <p className="text-gray-500 mb-8">
          Entrez le nom de votre commerce — votre score apparaît en 30 secondes, avec benchmark sectoriel.
        </p>

        <form onSubmit={e => { e.preventDefault(); runAnalysis(commerceName, city) }} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <input
              type="text" value={commerceName} onChange={e => setCommerceName(e.target.value)}
              placeholder="Nom de votre commerce" required
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            />
            <input
              type="text" value={city} onChange={e => setCity(e.target.value)}
              placeholder="Ville" required
              className="w-36 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            />
          </div>
          <button
            type="submit" disabled={analyzing}
            className="w-full rounded-xl bg-blue-600 py-4 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-60"
          >
            {analyzing ? `🔍 ${LOADING_STEPS[loadingStep]}` : '🔍 Calculer mon score gratuitement'}
          </button>
          <p className="text-xs text-gray-400 mt-2">
            Votre commerce n'apparaît pas ? Vérifiez l'orthographe exacte de votre fiche Google Maps.
          </p>
        </form>

        <div id="analyzer-result">
          {result && !result.error && (() => {
            const { label, msg, bg } = getScoreMsg(result.score)
            const sector = result.sector || { label: 'Commerce local', average: 60 }
            const gaps = result.gaps || []
            const diff = result.score - sector.average
            return (
              <div className={`rounded-2xl border-2 p-6 text-left ${bg}`}>
                <div className="flex items-end justify-between mb-2">
                  <div className="flex items-end gap-3">
                    <span className={`text-7xl font-extrabold ${getScoreColor(result.score)}`}>{result.score}</span>
                    <span className="text-gray-400 text-2xl mb-3">/100</span>
                  </div>
                  <div className="text-right mb-3">
                    <p className="text-xs text-gray-400">Moyenne {sector.label}</p>
                    <p className="text-lg font-bold text-gray-500">{sector.average}/100</p>
                    <p className={`text-xs font-semibold ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {diff >= 0 ? `+${diff} pts au-dessus` : `${diff} pts en dessous`}
                    </p>
                  </div>
                </div>
                <p className={`font-semibold text-lg mb-1 ${getScoreColor(result.score)}`}>{label}</p>
                <p className="text-sm text-gray-600 mb-4">{msg}</p>
                <div className="w-full bg-white rounded-full h-3 mb-5">
                  <div className={`h-3 rounded-full ${getBarColor(result.score)}`} style={{ width: `${result.score}%` }} />
                </div>
                {gaps.length > 0 && (
                  <div className="bg-white rounded-xl p-4 mb-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ce qui pénalise votre fiche</p>
                    <ul className="space-y-2">
                      {gaps.map((gap: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-red-400 mt-0.5 shrink-0">✗</span>{gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <a href="/signup" className="block w-full rounded-xl bg-blue-600 py-4 text-center text-sm font-semibold text-white hover:bg-blue-700 transition">
                  Corriger ces problèmes automatiquement →
                </a>
                <p className="text-xs text-gray-400 text-center mt-2">7 jours gratuits · Sans engagement · Annulation en 1 clic</p>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {captureStatus === 'done' ? (
                    <p className="text-xs text-green-600 text-center">✓ Rapport envoyé par email.</p>
                  ) : captureStatus === 'loading' ? (
                    <p className="text-xs text-gray-400 text-center">Envoi...</p>
                  ) : (
                    <div>
                      <form
                        onSubmit={async e => {
                          e.preventDefault()
                          setCaptureStatus('loading')
                          try {
                            await fetch('/api/waitlist', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: captureEmail, commerce_name: commerceName, city, score: result.score, gaps: result.gaps || [], sector: result.sector }),
                            })
                          } finally {
                            setCaptureStatus('done')
                          }
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="email" value={captureEmail} onChange={e => setCaptureEmail(e.target.value)}
                          placeholder="Recevoir une copie du rapport par email" required
                          className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                        />
                        <button type="submit" className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200">
                          Envoyer
                        </button>
                      </form>
                      <p className="text-xs text-gray-400 mt-1.5 text-center">Pas de spam. Votre email ne sera jamais partagé.</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
          {result?.error && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 text-left">
              <p className="font-semibold text-amber-800 mb-1">Impossible d'identifier votre établissement.</p>
              <p className="text-sm text-amber-700 mb-3">Vérifiez que le nom correspond exactement à celui sur Google Maps.</p>
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
