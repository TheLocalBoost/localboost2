'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { track } from '@/lib/track'
import type { Competitor, ProblemItem } from '@/app/api/analyse-public/route'

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
  problems: ProblemItem[]
  criteria: Record<string, boolean>
  businessStatus: string
  isClosed: boolean
  openNow: boolean | null
  weekdayHours: string[]
  recentReviews: { author: string; rating: number; text: string; time: string }[]
  priceLevel: number | null
  googleMapsUrl: string | null
  phoneIntl: string | null
  lostCalls: number
  lostRevenue: number
  competitors: Competitor[]
}

// Correction 1 — 6 paliers de score avec message correspondant au score réel
function scoreInfo(score: number): {
  color: string
  badgeBg: string
  label: string
  message: string
  sub: string
} {
  if (score >= 96) return {
    color:   '#16a34a',
    badgeBg: 'bg-green-100 text-green-700',
    label:   'Fiche bien tenue',
    message: 'Votre fiche est parmi les mieux tenues de votre secteur.',
    sub:     'Continuez à la maintenir active pour rester en tête.',
  }
  if (score >= 86) return {
    color:   '#16a34a',
    badgeBg: 'bg-green-100 text-green-700',
    label:   'Fiche correcte',
    message: 'Votre fiche est en bonne forme.',
    sub:     'Quelques points peuvent encore être améliorés.',
  }
  if (score >= 71) return {
    color:   '#84cc16',
    badgeBg: 'bg-lime-100 text-lime-700',
    label:   'Bonne base, des manques importants',
    message: 'Votre fiche est visible mais incomplète.',
    sub:     'Quelques corrections suffiraient à remonter.',
  }
  if (score >= 51) return {
    color:   '#d97706',
    badgeBg: 'bg-amber-100 text-amber-700',
    label:   'Fiche insuffisante',
    message: 'Votre fiche a des lacunes qui vous font perdre des clients chaque semaine.',
    sub:     '',
  }
  if (score >= 31) return {
    color:   '#ea580c',
    badgeBg: 'bg-orange-100 text-orange-700',
    label:   'Fiche très incomplète',
    message: "Votre fiche existe, mais il lui manque des informations essentielles.",
    sub:     'Vos concurrents passent avant vous.',
  }
  return {
    color:   '#dc2626',
    badgeBg: 'bg-red-100 text-red-600',
    label:   'Fiche quasiment invisible',
    message: 'Sur 100 personnes qui cherchent votre métier, moins de 2 vous trouvent.',
    sub:     '',
  }
}

function ScoreRing({ score }: { score: number }) {
  const r    = 44
  const circ = 2 * Math.PI * r
  const { color, badgeBg, label, message, sub } = scoreInfo(score)

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
          {label}
        </span>
        <p className="text-base font-bold text-gray-900 leading-tight">{message}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

const STEPS = ['Recherche de votre fiche...', 'Analyse de votre présence...', 'Calcul du score...']

// Bug 2 fix — recentReview ajouté avec libellé lisible
const CRITERIA_LABELS: Record<string, string> = {
  telephone:    'Numéro de téléphone',
  horaires:     "Horaires d'ouverture",
  site:         'Site web',
  description:  "Description de l'activité",
  photos:       'Photos (min. 5)',
  avis20:       'Avis Google (min. 20)',
  note4:        'Note (min. 4.0/5)',
  nom:          "Nom d'établissement",
  adresse:      'Adresse',
  recentReview: 'Avis récents (moins de 3 mois)',
}

function AnalyzerInner({ onEmailCapture, onResult }: AnalyzerProps) {
  const searchParams          = useSearchParams()
  const [form, setForm]       = useState({ name: '', city: '' })
  const [loading, setLoading] = useState(false)
  const [step, setStep]       = useState(0)
  const [result, setResult]   = useState<AnalysisResult | null>(null)
  const [error, setError]     = useState('')
  const [emailScore, setEmailScore] = useState<number | null>(null)
  const [ctaClicked, setCtaClicked] = useState(false)

  useEffect(() => {
    const nom     = searchParams.get('nom')
    const ville   = searchParams.get('ville')
    const score   = searchParams.get('score')
    const secteur = searchParams.get('secteur')
    const source  = searchParams.get('utm_source')
    const email   = searchParams.get('email')

    if (score) setEmailScore(parseInt(score))

    if (nom && ville) {
      setForm({ name: nom, city: ville })
      if (source === 'brevo') track('email_click_landed', { nom, ville, score, secteur })
      runAnalysis(nom, ville)
    }

    // Capture silencieuse de l'email quand il vient d'un lien d'outreach
    if (email && source === 'brevo') {
      fetch('/api/waitlist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email,
          source:  'outreach_click',
          nom:     nom ?? '',
          ville:   ville ?? '',
          secteur: secteur ?? '',
          score:   score ?? '',
        }),
      }).catch(() => {})
      onEmailCapture?.(email)
    }
  }, [])

  // Niveau 5 — tracker non-converti : arrivé depuis email, résultat vu, pas de CTA cliqué après 20s
  useEffect(() => {
    if (!result || ctaClicked) return
    if (searchParams.get('utm_source') !== 'brevo') return
    const t = setTimeout(() => {
      track('email_no_convert', {
        score:   result.score,
        city:    result.city,
        category: result.category,
      })
    }, 20_000)
    return () => clearTimeout(t)
  }, [result, ctaClicked])

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

  const pricingUrl = result
    ? `/pricing?city=${encodeURIComponent(result.city)}&category=${encodeURIComponent(result.category)}&score=${result.score}`
    : '/pricing'

  const avgCompetitorScore = result?.competitors.length
    ? Math.round(result.competitors.reduce((a, c) => a + c.estimatedScore, 0) / result.competitors.length)
    : null


  return (
    <section id="analyzer" className="py-20 px-6 bg-gray-50">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-4 py-1.5 text-sm font-medium text-blue-700 mb-4">
            Diagnostic de votre fiche Google
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
            {loading ? `${STEPS[step]}` : 'Analyser →'}
          </button>
        </form>

        {error && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6 text-sm text-amber-800">
            {error}
          </div>
        )}

        {/* Teaser score email — visible pendant le chargement */}
        {loading && emailScore !== null && (
          <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 mb-4 flex items-center gap-4">
            <div className="text-center shrink-0">
              <p className="text-3xl font-black text-orange-600 leading-none">{emailScore}</p>
              <p className="text-xs text-gray-400">/100</p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Score estimé détecté dans votre email</p>
              <p className="text-xs text-gray-500">Calcul du score réel en cours…</p>
            </div>
          </div>
        )}

        <div id="analyzer-result">
          {result && (
            <div className="space-y-4">

              {/* BLOC 1 — Score + comparaison concurrents */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <p className="text-xs text-gray-400 mb-4">{result.name} · {result.address}</p>
                <div className="flex items-center justify-between">
                  <ScoreRing score={result.score} />
                  {avgCompetitorScore !== null && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">Concurrents proches</p>
                      <p className="text-2xl font-bold text-gray-500">{avgCompetitorScore}<span className="text-sm font-normal text-gray-400">/100</span></p>
                      <p className={`text-xs font-semibold mt-1 ${result.score >= avgCompetitorScore ? 'text-green-600' : 'text-red-500'}`}>
                        {result.score >= avgCompetitorScore
                          ? `+${result.score - avgCompetitorScore} pts d'avance`
                          : `${avgCompetitorScore - result.score} pts de retard`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* BLOC 2 — Problèmes avec impact individuel */}
              {result.problems.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    {result.problems.length} problème{result.problems.length > 1 ? 's' : ''} détecté{result.problems.length > 1 ? 's' : ''} — impact mensuel estimé
                  </p>
                  <div className="space-y-3">
                    {result.problems.map((pb, i) => (
                      <div key={i} className="rounded-xl bg-red-50 border border-red-100 p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-red-500 font-bold text-sm shrink-0 mt-0.5">✗</span>
                          <p className="text-sm text-gray-800 leading-snug">{pb.text}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-3 pl-6">
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                            ~{pb.calls} appel{pb.calls > 1 ? 's' : ''} perdu{pb.calls > 1 ? 's' : ''}/mois
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                            ~{pb.revenue}€ non réalisé/mois
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BLOC 3 — Audit checklist */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Audit complet de votre fiche
                </p>
                <div className="space-y-2">
                  {result.criteria && Object.entries(result.criteria).map(([key, ok]) => (
                    <div key={key} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${ok ? 'bg-green-50' : 'bg-red-50 border border-red-100'}`}>
                      <span className={`text-sm font-bold shrink-0 ${ok ? 'text-green-500' : 'text-red-500'}`}>{ok ? '✓' : '✗'}</span>
                      <span className={`text-sm flex-1 ${ok ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                        {CRITERIA_LABELS[key] ?? key}
                      </span>
                      {key === 'avis20' && (
                        <span className="text-xs text-gray-400">{result.reviews} avis</span>
                      )}
                      {key === 'photos' && (
                        <span className="text-xs text-gray-400">{result.photos} photos</span>
                      )}
                      {key === 'note4' && (
                        <span className="text-xs text-gray-400">{result.rating > 0 ? `${result.rating}★` : '—'}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOC 4 — Concurrents */}
              {result.competitors.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Vos concurrents directs</p>
                  <div className="space-y-3">
                    {result.competitors.map((c, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-400">
                            {c.rating > 0 ? `${c.rating}★ · ${c.reviewCount} avis` : 'Non noté'}
                          </p>
                        </div>
                        <p className={`text-sm font-bold ${c.estimatedScore > result.score ? 'text-red-500' : 'text-green-600'}`}>
                          {c.estimatedScore}/100
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BLOC 5 — Total mensuel (Bug 1 corrigé : somme des problèmes, plafonnée par score) */}
              <div className="bg-white rounded-2xl border border-red-100 p-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Total mensuel estimé — somme des problèmes détectés
                </p>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="rounded-xl bg-red-50 py-4">
                    <p className="text-3xl font-extrabold text-red-500">~{result.lostCalls}</p>
                    <p className="text-xs text-gray-500 mt-1">appels perdus/mois</p>
                  </div>
                  <div className="rounded-xl bg-red-50 py-4">
                    <p className="text-3xl font-extrabold text-red-500">~{result.lostRevenue}€</p>
                    <p className="text-xs text-gray-500 mt-1">CA non réalisé/mois</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Calculé à partir des problèmes détectés sur votre fiche et du panier moyen de votre secteur.
                </p>
              </div>

              {/* BLOC 6 — Alerte fiche fermée */}
              {result.isClosed && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                  <p className="text-sm font-bold text-red-700 mb-1">Fiche marquée comme fermée</p>
                  <p className="text-xs text-red-600">Google affiche votre établissement comme fermé{result.businessStatus === 'CLOSED_PERMANENTLY' ? ' définitivement' : ' temporairement'}. Les clients ne vous appelleront pas.</p>
                </div>
              )}

              {/* BLOC 7 — Horaires réels Google */}
              {result.weekdayHours.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Horaires affichés sur Google</p>
                    {result.openNow !== null && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${result.openNow ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {result.openNow ? '● Ouvert' : '● Fermé'}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {result.weekdayHours.map((h, i) => (
                      <p key={i} className="text-xs text-gray-600">{h}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* BLOC 8 — Avis réels Google */}
              {result.recentReviews.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    Derniers avis Google
                  </p>
                  <div className="space-y-4">
                    {result.recentReviews.map((r, i) => (
                      <div key={i} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900">{r.author}</p>
                          <div className="flex items-center gap-1">
                            <span className="text-amber-400 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                            <span className="text-xs text-gray-400 ml-1">{r.time}</span>
                          </div>
                        </div>
                        {r.text && <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{r.text}</p>}
                      </div>
                    ))}
                  </div>
                  {result.googleMapsUrl && (
                    <a href={result.googleMapsUrl} target="_blank" rel="noopener"
                      className="mt-3 block text-xs text-blue-500 hover:underline">
                      Voir tous les avis sur Google Maps →
                    </a>
                  )}
                </div>
              )}

              {/* BLOC 9 — CTA */}
              <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6">
                <p className="text-white font-bold text-base mb-1">
                  Créez votre compte gratuit pour voir le plan d'action complet.
                </p>
                <p className="text-blue-200 text-xs mb-4">Score, problèmes détectés et 1 action IA — sans carte bancaire.</p>
                <a
                  href="/signup"
                  onClick={() => {
                    setCtaClicked(true)
                    track('cta_click', {
                      score: result.score,
                      category: result.category,
                      city: result.city,
                      source: searchParams.get('utm_source') ?? 'direct',
                    })
                  }}
                  className="block w-full rounded-xl bg-white py-4 text-sm font-bold text-blue-600 hover:bg-blue-50 transition mb-3 text-center"
                >
                  Créer mon compte gratuit →
                </a>
                <p className="text-blue-200 text-xs text-center">Gratuit · Passez Pro à 29€/mois quand vous êtes convaincu</p>
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
