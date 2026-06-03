'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { track } from '@/lib/track'
import type { Competitor } from '@/app/api/analyse-public/route'

interface AnalyzerProps {
  onEmailCapture?: (email: string) => void
  onResult?: (data: { score: number; name: string; city: string; category: string }) => void
}

interface AnalysisResult {
  name: string
  address: string
  city: string
  category: string
  score: number
  reviews: number
  rating: number
  photos: number
  problems: string[]
  missed: { clicks: number; clients: number; revenue: number }
  competitors: Competitor[]
}

function ScoreRing({ score }: { score: number }) {
  const r = 44, circ = 2 * Math.PI * r
  const color = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626'
  const badge = score >= 70 ? 'Bonne visibilité' : score >= 40 ? 'Fiche insuffisante' : 'Score critique'
  const badgeBg = score >= 70 ? 'bg-green-100 text-green-700' : score >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
  return (
    <div className="flex items-center gap-4">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ}
          strokeLinecap="round" transform="rotate(-90 45 45)"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
        <text x="45" y="41" textAnchor="middle" fontSize="20" fontWeight="800" fill="#111827">{score}</text>
        <text x="45" y="57" textAnchor="middle" fontSize="9" fill="#6b7280">/100</text>
      </svg>
      <div>
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold mb-1 ${badgeBg}`}>
          {badge}
        </span>
        <p className="text-base font-bold text-gray-900 leading-tight">
          Votre fiche est quasiment invisible
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Sur 100 personnes qui cherchent votre métier,<br />moins de 3 vous trouvent.
        </p>
      </div>
    </div>
  )
}

const STEPS = ['Recherche de votre fiche...', 'Analyse de votre présence...', 'Calcul du score...']

function AnalyzerInner({ onEmailCapture, onResult }: AnalyzerProps) {
  const searchParams          = useSearchParams()
  const [form, setForm]       = useState({ name: '', city: '' })
  const [loading, setLoading] = useState(false)
  const [step, setStep]       = useState(0)
  const [result, setResult]   = useState<AnalysisResult | null>(null)
  const [error, setError]     = useState('')

  useEffect(() => {
    const nom   = searchParams.get('nom')
    const ville = searchParams.get('ville')
    if (nom && ville) {
      setForm({ name: nom, city: ville })
      runAnalysis(nom, ville)
    }
  }, [])

  useEffect(() => {
    if (!loading) return
    const iv = setInterval(() => setStep(s => (s + 1) % STEPS.length), 1800)
    return () => clearInterval(iv)
  }, [loading])

  async function runAnalysis(name: string, city: string) {
    setLoading(true)
    setResult(null)
    setError('')
    track('analyzer_search', { name, city })
    try {
      const res  = await fetch('/api/analyse-public', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ commerce_name: name, city }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setResult(data as AnalysisResult)
      track('analyzer_result', { score: data.score, city: data.city, category: data.category })
      onResult?.({ score: data.score, name: data.name, city: data.city, category: data.category })
      setTimeout(() => document.getElementById('analyzer-result')?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch {
      setError('Erreur de connexion. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.name && form.city) runAnalysis(form.name, form.city)
  }

  const clientsLost = result ? Math.max(3, Math.round((100 - result.score) * 0.12)) : 0
  const pricingUrl  = result
    ? `/pricing?city=${encodeURIComponent(result.city)}&category=${encodeURIComponent(result.category)}&score=${result.score}`
    : '/pricing'

  return (
    <section id="analyzer" className="py-20 px-6 bg-gray-50">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-4 py-1.5 text-sm font-medium text-blue-700 mb-4">
            🔍 Gratuit · Résultat en 30 secondes · Sans inscription
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Analysez votre fiche Google gratuitement
          </h2>
          <p className="text-gray-500">Entrez votre établissement — découvrez ce qui vous coûte des clients.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-8">
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Nom de votre commerce"
            required
            className="flex-1 rounded-xl border border-gray-200 px-4 py-3.5 text-sm focus:border-blue-500 focus:outline-none bg-white shadow-sm"
          />
          <input
            value={form.city}
            onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            placeholder="Ville"
            required
            className="w-32 rounded-xl border border-gray-200 px-4 py-3.5 text-sm focus:border-blue-500 focus:outline-none bg-white shadow-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition whitespace-nowrap"
          >
            {loading ? `⏳ ${STEPS[step]}` : 'Analyser →'}
          </button>
        </form>

        {error && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6 text-sm text-amber-800">
            {error}
          </div>
        )}

        <div id="analyzer-result">
          {result && (
            <div className="space-y-3">

              {/* BLOC 1 — Verdict */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <p className="text-xs text-gray-400 mb-4">{result.name} · {result.address}</p>
                <ScoreRing score={result.score} />
              </div>

              {/* BLOC 2 — Douleur chiffrée */}
              <div className="bg-white rounded-2xl border border-red-100 p-6 text-center">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Ce mois-ci
                </p>
                <p className="text-6xl font-extrabold text-red-500 mb-2">~{clientsLost}</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  clients ont appelé un concurrent à votre place.
                </p>
              </div>

              {/* BLOC 3 — Verrous */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  {result.problems.length} problèmes détectés sur votre fiche
                </p>
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                      <span className="text-gray-300 text-lg shrink-0">🔒</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOC 4 — CTA unique */}
              <div className="rounded-2xl bg-blue-600 p-6 text-center">
                <a
                  href={pricingUrl}
                  onClick={() => track('cta_click', { score: result.score, category: result.category, city: result.city })}
                  className="block w-full rounded-xl bg-white py-4 text-sm font-bold text-blue-600 hover:bg-blue-50 transition mb-3"
                >
                  Débloquer mon plan d'action — 29€/mois →
                </a>
                <p className="text-blue-300 text-xs">Résiliable à tout moment</p>
              </div>

            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default function Analyzer(props: AnalyzerProps) {
  return (
    <Suspense fallback={null}>
      <AnalyzerInner {...props} />
    </Suspense>
  )
}
