'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import EmailCaptureBlock from '@/components/analyser/EmailCaptureBlock'
import FounderSpotsCounter from '@/components/shared/FounderSpotsCounter'
import TestimonialCard from '@/components/shared/TestimonialCard'
import { getTestimonial } from '@/lib/testimonials'
import type { Competitor } from '@/app/api/analyse-public/route'
import { track } from '@/lib/track'

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
  const label = score >= 70 ? 'Bonne visibilité' : score >= 40 ? 'Visibilité insuffisante' : 'Fiche inactive'
  return (
    <div className="flex flex-col items-center">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ}
          strokeLinecap="round" transform="rotate(-90 55 55)"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
        <text x="55" y="50" textAnchor="middle" fontSize="22" fontWeight="800" fill="#111827">{score}</text>
        <text x="55" y="68" textAnchor="middle" fontSize="10" fill="#6b7280">/100</text>
      </svg>
      <p className="text-sm font-semibold mt-1" style={{ color }}>{label}</p>
    </div>
  )
}

function LockedBlock({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="relative rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden">
      <div className="blur-sm pointer-events-none select-none p-5 opacity-60">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
        <span className="text-2xl mb-2">🔒</span>
        <p className="text-sm font-bold text-gray-700">{label}</p>
        <p className="text-xs text-gray-500 mt-1">Réservé aux membres Pro</p>
      </div>
    </div>
  )
}

const STEPS = ['Recherche de votre fiche...', 'Analyse de votre présence...', 'Calcul du score...']

function AnalyzerInner({ onEmailCapture, onResult }: AnalyzerProps) {
  const searchParams               = useSearchParams()
  const [form, setForm]            = useState({ name: '', city: '' })
  const [loading, setLoading]      = useState(false)
  const [step, setStep]            = useState(0)
  const [result, setResult]        = useState<AnalysisResult | null>(null)
  const [error, setError]          = useState('')
  const [emailCaptured, setEmailCaptured] = useState(false)

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

  function handleEmailCapture(email: string) {
    setEmailCaptured(true)
    onEmailCapture?.(email)
  }

  const volumeEstimate = result ? Math.round((100 - result.score) * 4 + 200) : 0
  const testimonial    = result ? getTestimonial(result.category) : null
  const pricingUrl     = result
    ? `/pricing?city=${encodeURIComponent(result.city)}&category=${encodeURIComponent(result.category)}&score=${result.score}`
    : '/pricing'

  return (
    <section id="analyzer" className="py-20 px-6 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-4 py-1.5 text-sm font-medium text-blue-700 mb-4">
            🔍 Gratuit · Résultat en 30 secondes · Sans inscription
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Analysez votre fiche Google gratuitement
          </h2>
          <p className="text-gray-500">Entrez votre établissement — découvrez votre score et ce qui vous coûte des clients.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-8">
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
            className="w-36 rounded-xl border border-gray-200 px-4 py-3.5 text-sm focus:border-blue-500 focus:outline-none bg-white shadow-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition whitespace-nowrap"
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
            <div className="space-y-4">

              {/* Score + stats */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <p className="text-xs text-gray-400 mb-4 font-medium">{result.name} · {result.address}</p>
                <div className="flex items-center justify-around gap-4">
                  <ScoreRing score={result.score} />
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-gray-900">{result.reviews}</p>
                      <p className="text-xs text-gray-500 mt-1">Avis Google</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-amber-500">
                        {result.rating > 0 ? `★ ${result.rating.toFixed(1)}` : '—'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Note moyenne</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{result.photos}</p>
                      <p className="text-xs text-gray-500 mt-1">Photos</p>
                    </div>
                    <div className={`rounded-xl p-4 text-center ${result.problems.length > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                      <p className={`text-2xl font-bold ${result.problems.length > 0 ? 'text-red-500' : 'text-green-600'}`}>
                        {result.problems.length}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Problèmes</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Problèmes — verrouillé */}
              <LockedBlock label={`${result.problems.length} problèmes détectés sur votre fiche`}>
                <div className="space-y-2">
                  {result.problems.slice(0, 3).map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-red-400 shrink-0">✗</span>
                      <span className="text-gray-700">{p}</span>
                    </div>
                  ))}
                </div>
              </LockedBlock>

              {/* Visibilité perdue — verrouillé */}
              <LockedBlock label="Estimation de visibilité perdue">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold text-red-500">{result.missed.clicks}</p>
                    <p className="text-xs text-gray-500">clics perdus/mois</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-500">{result.missed.clients}</p>
                    <p className="text-xs text-gray-500">clients manqués</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-500">~{result.missed.revenue}€</p>
                    <p className="text-xs text-gray-500">CA perdu</p>
                  </div>
                </div>
              </LockedBlock>

              {/* Concurrents — L1 */}
              {result.competitors.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <p className="text-sm font-bold text-gray-700 mb-3">
                    Pendant ce temps, vos concurrents à {result.city}...
                  </p>
                  <div className="space-y-3">
                    {result.competitors.map((c, i) => (
                      <div key={i} className="rounded-xl border border-gray-100 p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                          {c.rating > 0 && (
                            <p className="text-xs text-amber-500 mt-0.5">
                              ★ {c.rating.toFixed(1)} · {c.reviewCount} avis
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="inline-block rounded-lg bg-green-50 text-green-700 text-xs font-bold px-2 py-1">
                            {c.estimatedScore}/100
                          </span>
                          {c.estimatedScore - result.score > 20 && (
                            <p className="text-xs text-red-500 font-semibold mt-1 whitespace-nowrap">
                              ⚠ Vous perdez des clients
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Ils apparaissent avant vous sur chaque recherche Google Maps.
                  </p>
                </div>
              )}

              {/* Volume estimé — L7 */}
              <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-3 text-sm text-orange-800">
                À {result.city}, <strong>~{volumeEstimate} personnes</strong> cherchent un {result.category} chaque mois sur Google.
              </div>

              {/* FounderSpotsCounter — L6 */}
              <FounderSpotsCounter />

              {/* TestimonialCard — L5 */}
              {testimonial && <TestimonialCard testimonial={testimonial} />}

              {/* EmailCaptureBlock — L2 (remplace CTA) */}
              <EmailCaptureBlock
                establishmentName={result.name}
                score={result.score}
                city={result.city}
                category={result.category}
                onCapture={handleEmailCapture}
              />

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
