'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { track } from '@/lib/track'
import { createClient } from '@/lib/supabase-browser'
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
  const [emailScore, setEmailScore]       = useState<number | null>(null)
  const [ctaClicked, setCtaClicked]               = useState(false)
  const [emailCaptured, setEmailCaptured]         = useState(false)
  const [capturedEmail, setCapturedEmail]         = useState('')
  const [generatedDesc, setGeneratedDesc]         = useState<string | null>(null)
  const [generatingDesc, setGeneratingDesc]       = useState(false)
  const [generatedPost, setGeneratedPost]         = useState<string | null>(null)
  const [generatedReview, setGeneratedReview]     = useState<string | null>(null)
  const [generatingContent, setGeneratingContent] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const nom     = searchParams.get('nom')
    const ville   = searchParams.get('ville')
    const score   = searchParams.get('score')
    const secteur = searchParams.get('secteur')
    const source  = searchParams.get('utm_source')
    const email   = searchParams.get('email')

    if (score) setEmailScore(parseInt(score))

    const isOutreach = source === 'brevo' || source === 'ses' || source === 'ovh'
    if (nom && ville) {
      setForm({ name: nom, city: ville })
      if (isOutreach) track('email_click_landed', { nom, ville, score, secteur })
      runAnalysis(nom, ville)
    }

    // Capture silencieuse de l'email quand il vient d'un lien d'outreach
    if (email && isOutreach) {
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
      setCapturedEmail(email)
      setEmailCaptured(true)
      onEmailCapture?.(email)
    }
  }, [])

  // tracker non-converti : arrivé depuis email, résultat vu, pas de CTA cliqué après 20s
  useEffect(() => {
    if (!result || ctaClicked) return
    const src = searchParams.get('utm_source')
    if (src !== 'brevo' && src !== 'ses' && src !== 'ovh') return
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
      // Génère la description en arrière-plan si la fiche a une description manquante
      if (!data.criteria?.description) {
        setGeneratingDesc(true)
        fetch('/api/generate-description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: data.name, city: data.city, category: data.category, problems: data.problems }),
        }).then(r => r.json()).then(d => { if (d.description) setGeneratedDesc(d.description) }).catch(() => {}).finally(() => setGeneratingDesc(false))
      }

      // Génère post Google + réponse à avis en arrière-plan
      setGeneratingContent(true)
      const bestReview = (data.recentReviews ?? []).find((r: { text: string }) => r.text?.length > 20) ?? null
      fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, city: data.city, category: data.category, recentReview: bestReview }),
      }).then(r => r.json()).then(d => {
        if (d.post) setGeneratedPost(d.post)
        if (d.reviewResponse) setGeneratedReview(d.reviewResponse)
      }).catch(() => {}).finally(() => setGeneratingContent(false))
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
    ? `/pricing?city=${encodeURIComponent(result.city)}&category=${encodeURIComponent(result.category)}&score=${result.score}&nom=${encodeURIComponent(result.name)}&revenue=${result.lostRevenue}${capturedEmail ? `&email=${encodeURIComponent(capturedEmail)}` : ''}`
    : '/pricing'

  const avgCompetitorScore = result?.competitors.length
    ? Math.round(result.competitors.reduce((a, c) => a + c.estimatedScore, 0) / result.competitors.length)
    : null

  const topCompetitor = result?.competitors.length
    ? result.competitors.reduce((best, c) => c.estimatedScore > best.estimatedScore ? c : best, result.competitors[0])
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

              {/* BLOC 0 — Concurrent le plus menaçant (hook principal) */}
              {topCompetitor && (
                <div className="bg-white rounded-2xl border-2 border-red-100 p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    Votre position sur Google Maps à {result.city}
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
                      <p className="text-xs text-gray-400 mb-1.5">Vous</p>
                      <p className="text-xs font-bold text-gray-800 leading-tight min-h-8 flex items-center justify-center text-center">{result.name}</p>
                      <p className="text-2xl font-black text-gray-900 mt-2">{result.score}<span className="text-xs font-normal text-gray-400">/100</span></p>
                      {result.rating > 0 && <p className="text-xs text-gray-400 mt-1">{result.rating}★ · {result.reviews} avis</p>}
                    </div>
                    <div className={`rounded-xl p-3 text-center border-2 ${topCompetitor.estimatedScore > result.score ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                      <p className="text-xs text-gray-400 mb-1.5">Concurrent</p>
                      <p className="text-xs font-bold text-gray-800 leading-tight min-h-8 flex items-center justify-center text-center">{topCompetitor.name}</p>
                      <p className={`text-2xl font-black mt-2 ${topCompetitor.estimatedScore > result.score ? 'text-red-600' : 'text-amber-600'}`}>
                        {topCompetitor.estimatedScore}<span className="text-xs font-normal text-gray-400">/100</span>
                      </p>
                      {topCompetitor.rating > 0 && <p className="text-xs text-gray-400 mt-1">{topCompetitor.rating}★ · {topCompetitor.reviewCount} avis</p>}
                    </div>
                  </div>
                  <div className={`text-center text-sm font-bold rounded-xl py-2.5 px-4 ${topCompetitor.estimatedScore > result.score ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                    {topCompetitor.estimatedScore > result.score
                      ? `${topCompetitor.name} apparaît avant vous sur Google`
                      : `Vous êtes en tête — mais ${topCompetitor.name} est à ${topCompetitor.estimatedScore} pts`}
                  </div>
                </div>
              )}

              {/* BLOC 1 — Score + concurrents (toujours visible) */}
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
                {result.score < 86 && (
                  <div className="mt-4 pt-4 border-t border-gray-50 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <span className="text-blue-500 text-base shrink-0 mt-0.5">→</span>
                      <p className="text-sm text-gray-700">
                        <strong>LocalBoost génère le pack complet basé sur vos vraies données</strong> — description optimisée, 4 posts, réponses aux avis, QR code, plan d'action — livré par email en 48h pour 39€.
                      </p>
                    </div>
                    {result.lostCalls >= 2 && (
                      <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3">
                        <p className="text-sm text-green-800">
                          <strong>ROI estimé :</strong> si on récupère 2 appels/mois sur les ~{result.lostCalls} perdus
                          {' '}→ <strong>{2 * (result.lostRevenue > 0 ? Math.round(result.lostRevenue / result.lostCalls) : 150)}€ de CA</strong> pour 39€ investis.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* BLOC 1b — Pourquoi ce score pénalise sur Google */}
              <div className="bg-gray-900 rounded-2xl p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                  Pourquoi ce score vous coûte des clients
                </p>
                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                  Google Maps ne classe pas la meilleure fiche — il classe la plus <strong className="text-white">active</strong>.
                  {topCompetitor && topCompetitor.estimatedScore > result.score
                    ? ` ${topCompetitor.name} vous devance non pas parce qu'il est meilleur, mais parce que sa fiche envoie plus de signaux d'activité à Google.`
                    : ' Un concurrent avec une note inférieure à la vôtre peut apparaître avant vous si sa fiche est plus active.'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Activité', detail: 'Posts & réponses aux avis', weight: '★★★' },
                    { label: 'Complétude', detail: 'Description, horaires, photos', weight: '★★' },
                    { label: 'Avis récents', detail: 'Fraîcheur & taux de réponse', weight: '★★' },
                  ].map(({ label, detail, weight }) => (
                    <div key={label} className="bg-gray-800 rounded-xl p-3 text-center">
                      <p className="text-xs font-bold text-white mb-1">{label}</p>
                      <p className="text-xs text-amber-400 mb-1.5">{weight}</p>
                      <p className="text-xs text-gray-400 leading-tight">{detail}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Voici exactement ce que l'algorithme a trouvé sur votre fiche :
                </p>
              </div>

              {/* BLOC 2 — 1er problème visible, reste bloqué */}
              {result.problems.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    {result.problems.length} problème{result.problems.length > 1 ? 's' : ''} détecté{result.problems.length > 1 ? 's' : ''} sur votre fiche
                  </p>
                  <div className="space-y-3">
                    {/* 2 premiers problèmes visibles */}
                    {result.problems.slice(0, 2).map((problem, idx) => (
                      <div key={idx} className="rounded-xl bg-red-50 border border-red-100 p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-red-500 font-bold text-sm shrink-0 mt-0.5">✗</span>
                          <p className="text-sm text-gray-800 leading-snug">{problem.text}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-3 pl-6">
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                            ~{problem.calls} appel{problem.calls > 1 ? 's' : ''} perdu{problem.calls > 1 ? 's' : ''}/mois
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                            ~{problem.revenue}€ non réalisé/mois
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Reste bloqué à partir du 3ème */}
                    {result.problems.length > 2 && (
                      <div className="relative">
                        <div className="rounded-xl bg-gray-50 border border-dashed border-gray-200 p-4 blur-[2px] select-none pointer-events-none">
                          <div className="flex items-start gap-3">
                            <span className="text-red-400 font-bold text-sm shrink-0">✗</span>
                            <p className="text-sm text-gray-400">••••••••••••••••••••••••</p>
                          </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                            +{result.problems.length - 2} problème{result.problems.length > 3 ? 's' : ''} masqué{result.problems.length > 3 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BLOC 3 — Impact total */}
              <div className="bg-white rounded-2xl border border-red-100 p-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Impact total mensuel estimé
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
              </div>

              {/* BLOC — Ce que LocalBoost a déjà préparé */}
              {(generatingContent || generatedPost) && (
                <div className="bg-white rounded-2xl border border-blue-100 p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-blue-600 text-sm">✦</span>
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Ce que LocalBoost a déjà préparé pour vous</p>
                  </div>

                  <div className="space-y-5">
                    {/* Description Google — tronquée après ~50 mots */}
                    {(generatingDesc || generatedDesc) && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                          <span>📍</span> Description Google à publier
                        </p>
                        {generatingDesc && !generatedDesc ? (
                          <div className="space-y-2 animate-pulse">
                            <div className="h-3 bg-gray-100 rounded w-full" />
                            <div className="h-3 bg-gray-100 rounded w-5/6" />
                            <div className="h-3 bg-gray-100 rounded w-4/6" />
                          </div>
                        ) : (
                          <div className="relative rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 overflow-hidden">
                            <p className="text-sm text-gray-800 leading-relaxed">
                              {generatedDesc?.split(' ').slice(0, 45).join(' ')}…
                            </p>
                            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" />
                            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                              <span className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm">
                                🔒 Description complète incluse dans le pack
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Post Google — visible en entier */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                        <span>📍</span> Post Google — exemple (1 sur 4)
                      </p>
                      {generatingContent && !generatedPost ? (
                        <div className="space-y-2 animate-pulse">
                          <div className="h-3 bg-gray-100 rounded w-full" />
                          <div className="h-3 bg-gray-100 rounded w-5/6" />
                          <div className="h-3 bg-gray-100 rounded w-4/6" />
                        </div>
                      ) : (
                        <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{generatedPost}</p>
                          <p className="text-xs text-gray-400 mt-2">+ 3 autres posts inclus dans le pack</p>
                        </div>
                      )}
                    </div>

                    {/* Réponse à l'avis — masquée */}
                    {(generatingContent || generatedReview) && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                          <span>📍</span> Réponses à vos avis clients
                        </p>
                        <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-4 flex items-center gap-3">
                          <span className="text-lg">🔒</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Réponses personnalisées incluses</p>
                            <p className="text-xs text-gray-400 mt-0.5">On rédige une réponse pour chacun de vos avis récents — débloqué avec le pack.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Priorité détectée */}
                    {result.problems.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                          <span>📍</span> Priorité détectée
                        </p>
                        <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                          <p className="text-sm text-amber-800 leading-snug">{result.problems[0].text}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mt-4 text-center">Aperçu — le pack complet inclut 4 posts, toutes vos réponses aux avis, QR code et plan d'action prioritaire.</p>
                </div>
              )}

              {/* CTA — immédiatement après l'impact, avant le reste */}
              <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 border border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-red-400 text-xl">⚠️</span>
                  <p className="text-white font-extrabold text-xl leading-tight">
                    {result.lostRevenue > 0
                      ? `~${result.lostRevenue}€ perdus ce mois-ci`
                      : avgCompetitorScore !== null && result.score < avgCompetitorScore
                        ? `${avgCompetitorScore - result.score} pts de retard sur vos concurrents`
                        : `Score ${result.score}/100 — votre fiche perd des appels`}
                  </p>
                </div>
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  Ce que les agences facturent 150-500€ — description optimisée, 4 posts, réponses aux avis, QR code. Livré par email en 48h.
                </p>
                <a
                  href={pricingUrl}
                  onClick={() => {
                    setCtaClicked(true)
                    track('cta_click_subscribe', { score: result.score, category: result.category, city: result.city })
                  }}
                  className="block w-full rounded-xl bg-green-500 hover:bg-green-400 py-4 text-base font-extrabold text-white transition mb-2 text-center shadow-lg shadow-green-900/30"
                >
                  Même résultat qu'une agence — en 48h pour 39€ →
                </a>
                <p className="text-gray-400 text-xs text-center">Paiement sécurisé · Satisfait ou remboursé sous 30 jours · Sans engagement</p>
              </div>

              {/* Détails supplémentaires — après le CTA (pour ceux qui veulent plus d'info) */}
              <details className="group">
                <summary className="cursor-pointer text-xs text-gray-400 text-center py-2 select-none list-none flex items-center justify-center gap-1">
                  <span className="group-open:hidden">Voir le détail complet de l'audit ▾</span>
                  <span className="hidden group-open:inline">Masquer ▴</span>
                </summary>
                <div className="space-y-4 mt-2">
                  {/* Audit checklist */}
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
                          {key === 'avis20' && <span className="text-xs text-gray-400">{result.reviews} avis</span>}
                          {key === 'photos' && <span className="text-xs text-gray-400">{result.photos} photos</span>}
                          {key === 'note4' && <span className="text-xs text-gray-400">{result.rating > 0 ? `${result.rating}★` : '—'}</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Horaires */}
                  {result.weekdayHours.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Horaires Google</p>
                        {result.openNow !== null && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${result.openNow ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {result.openNow ? '● Ouvert' : '● Fermé'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {result.weekdayHours.map((h, i) => <p key={i} className="text-xs text-gray-600">{h}</p>)}
                      </div>
                    </div>
                  )}

                  {/* Avis */}
                  {result.recentReviews.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Derniers avis Google</p>
                      <div className="space-y-4">
                        {result.recentReviews.map((r, i) => (
                          <div key={i} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-gray-900">{r.author}</p>
                              <span className="text-amber-400 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                            </div>
                            {r.text && <p className="text-xs text-gray-500 line-clamp-2">{r.text}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fiche fermée */}
                  {result.isClosed && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                      <p className="text-sm font-bold text-red-700 mb-1">Fiche marquée comme fermée</p>
                      <p className="text-xs text-red-600">Google affiche votre établissement comme fermé{result.businessStatus === 'CLOSED_PERMANENTLY' ? ' définitivement' : ' temporairement'}.</p>
                    </div>
                  )}
                </div>
              </details>

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
