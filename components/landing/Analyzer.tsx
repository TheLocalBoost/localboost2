'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
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
  commercialScores?: { found: number; trust: number; desire: number; activity: number; vsCompetitors: number }
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

const PRIORITIES_CONFIG = [
  { id: 'convince', label: 'Mieux convaincre les visiteurs de ma fiche' },
  { id: 'reviews',  label: 'Répondre plus facilement à mes avis clients' },
  { id: 'publish',  label: 'Avoir du contenu à publier sans y passer des heures' },
  { id: 'time',     label: 'Gagner du temps sur tout ce qui concerne Google' },
]

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

  const [generatedDescription, setGeneratedDescription] = useState<string | null>(null)
  const [generatedPosts, setGeneratedPosts]             = useState<string[]>([])
  const [generatedReview, setGeneratedReview]           = useState<string | null>(null)
  const [generatedCategories, setGeneratedCategories]   = useState<string[]>([])
  const [generatingContent, setGeneratingContent]       = useState(false)
  const [generatedAt, setGeneratedAt]                   = useState<Date | null>(null)
  const [scoreBreakdownOpen, setScoreBreakdownOpen]     = useState(false)
  const generationStartRef                              = useRef<number>(0)
  const [generationSeconds, setGenerationSeconds]       = useState<number | null>(null)
  const [selectedPriority, setSelectedPriority]         = useState<string | null>(null)
  const [revealedCount, setRevealedCount]               = useState(0)
  const [searchStarted, setSearchStarted]               = useState(false)
  const [showFullDesc, setShowFullDesc]                 = useState(false)
  const [showPostEx, setShowPostEx]                     = useState(false)
  const [showReviewEx, setShowReviewEx]                 = useState(false)

  const descriptionRef  = useRef<HTMLDivElement>(null)
  const postsRef        = useRef<HTMLDivElement>(null)
  const beforeAfterRef  = useRef<HTMLDivElement>(null)
  const ctaRef          = useRef<HTMLDivElement>(null)
  const problemRef      = useRef<HTMLDivElement>(null)
  const firedTrackEvents = useRef<Set<string>>(new Set())
  const scroll25Ref    = useRef<HTMLDivElement>(null)
  const scroll50Ref    = useRef<HTMLDivElement>(null)
  const scroll75Ref    = useRef<HTMLDivElement>(null)
  const scroll100Ref   = useRef<HTMLDivElement>(null)

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

    // Rejeter les params encodés/corrompus par les scanners de sécurité
    // Un nom/ville lisible contient des voyelles et des caractères ASCII
    const looksReal = (s: string) =>
      s.length > 1 && s.length < 80 &&
      /[aeiouyéèêëàâîïôùûü]/i.test(s) &&   // contient au moins une voyelle
      !/[^a-zA-ZÀ-ÿ0-9\s\-'&.]/u.test(s)   // pas de caractères suspects

    if (nom && ville && looksReal(nom) && looksReal(ville)) {
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

  // Properties communes à tous les events
  const eventProps = result ? {
    score:        result.score,
    category:     result.category,
    city:         result.city,
    nb_problems:  result.problems.length,
    rating:       result.rating,
    lost_revenue: result.lostRevenue,
    lost_calls:   result.lostCalls,
    has_description:    result.criteria.description,
    has_recent_review:  result.criteria.recentReview,
    review_count:       result.reviews,
  } : {}

  // Visibility + scroll depth tracking
  useEffect(() => {
    if (!result) return
    const pairs: [React.RefObject<HTMLDivElement>, string][] = [
      [descriptionRef, 'saw_description'],
      [postsRef,       'saw_posts'],
      [problemRef,     'problem_seen'],
      [beforeAfterRef, 'saw_before_after'],
      [ctaRef,         'saw_cta'],
      [scroll25Ref,    'scroll_25'],
      [scroll50Ref,    'scroll_50'],
      [scroll75Ref,    'scroll_75'],
      [scroll100Ref,   'scroll_100'],
    ]
    const observers = pairs.map(([ref, event]) => {
      if (!ref.current || firedTrackEvents.current.has(event)) return null
      const o = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) {
          firedTrackEvents.current.add(event)
          track(event, eventProps)
          o.disconnect()
        }
      }, { threshold: 0.1 })
      o.observe(ref.current)
      return o
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [result, generatedDescription])

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

  // Étapes réelles du chargement plein écran
  const STEP_LABELS = [
    'Recherche de votre fiche Google',
    'Analyse des concurrents locaux',
    'Calcul du score et des améliorations',
    'Préparation de votre dossier',
  ]
  const realStepsDone = [
    !!result,
    !!result,
    !!result,
    !generatingContent && !!generatedAt,
  ]
  const realDoneCount = realStepsDone.filter(Boolean).length

  // Réinitialise la révélation à chaque nouvelle recherche
  useEffect(() => {
    if (loading) setRevealedCount(0)
  }, [loading])

  // Révèle les étapes une par une, à un rythme minimum perceptible.
  useEffect(() => {
    if (revealedCount >= realDoneCount || revealedCount >= STEP_LABELS.length) return
    const t = setTimeout(() => setRevealedCount(c => c + 1), 300)
    return () => clearTimeout(t)
  }, [revealedCount, realDoneCount])

  const showLoadingOverlay = searchStarted && (loading || generatingContent || revealedCount < STEP_LABELS.length)

  async function runAnalysis(name: string, city: string) {
    setSearchStarted(true)
    setLoading(true)
    setResult(null)
    setError('')
    setGeneratedDescription(null)
    setGeneratedPosts([])
    setGeneratedReview(null)
    setGeneratedCategories([])
    setGeneratedAt(null)
    setGenerationSeconds(null)
    generationStartRef.current = Date.now()
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
      track('analyzer_result', {
        score:       data.score,
        city:        data.city,
        category:    data.category,
        nb_problems: (data.problems ?? []).length,
        rating:      data.rating,
        lost_revenue: data.lostRevenue,
        has_description:   data.criteria?.description,
        has_recent_review: data.criteria?.recentReview,
        review_count:      data.reviews,
      })
      onResult?.({ score: data.score, name: data.name, city: data.city, category: data.category })
      setTimeout(() => document.getElementById('analyzer-result')?.scrollIntoView({ behavior: 'smooth' }), 100)
      // Génère post Google + réponse à avis en arrière-plan
      setGeneratingContent(true)
      const bestReview = (data.recentReviews ?? []).find((r: { text: string }) => r.text?.length > 20) ?? null
      fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, city: data.city, category: data.category, recentReview: bestReview }),
      }).then(r => r.json()).then(d => {
        if (d.description)    setGeneratedDescription(d.description)
        if (d.posts?.length)  setGeneratedPosts(d.posts)
        if (d.reviewResponse) setGeneratedReview(d.reviewResponse)
        if (d.categories)     setGeneratedCategories(d.categories)
        setGeneratedAt(new Date())
        setGenerationSeconds(Math.round((Date.now() - generationStartRef.current) / 1000))
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
            Découvrez pourquoi votre fiche Google laisse partir des clients
          </h2>
          <p className="text-gray-500">Entrez le nom de votre établissement — le diagnostic est gratuit et immédiat.</p>
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

        {/* Chargement plein écran — révélation progressive, jamais instantanée */}
        {showLoadingOverlay && (() => {
          const progressPct  = Math.round((revealedCount / STEP_LABELS.length) * 100)
          const currentIndex = revealedCount

          return (
            <div className="fixed inset-0 z-50 bg-white flex items-center justify-center px-6">
              <div className="max-w-sm w-full">
                <div className="text-center mb-8">
                  <p className="text-lg font-bold text-gray-900">
                    Préparation du dossier {form.name ? `de ${form.name}` : ''}
                  </p>
                  {form.city && <p className="text-sm text-gray-400 mt-1">{form.city}</p>}
                </div>

                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-8">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <div className="space-y-3.5 mb-6">
                  {STEP_LABELS.map((label, i) => {
                    const done = i < revealedCount
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs shrink-0 transition-colors duration-300 ${
                          done ? 'bg-green-500 text-white' : i === currentIndex ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-300'
                        }`}>
                          {done ? '✓' : i === currentIndex ? <span className="inline-block animate-spin">◌</span> : '·'}
                        </span>
                        <p className={`text-sm transition-colors duration-300 ${
                          done ? 'text-gray-400 line-through' : i === currentIndex ? 'text-gray-900 font-semibold' : 'text-gray-300'
                        }`}>
                          {label}
                        </p>
                      </div>
                    )
                  })}
                </div>

              </div>
            </div>
          )
        })()}

        <div id="analyzer-result">
          {result && (
            <div className="space-y-4 animate-[fadeIn_0.5s_ease]">

              {/* Écran 1 — Pourquoi suis-je ici ? */}
              <div ref={scroll25Ref} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div ref={problemRef} />
                {(() => {
                  const n = result.problems.length + (!result.criteria.description ? 1 : 0)
                  return <>
                    <p className="text-xl font-extrabold text-gray-900">{n > 0 ? `${n} problème${n > 1 ? 's' : ''} détecté${n > 1 ? 's' : ''} sur votre fiche.` : 'Votre fiche est bien tenue.'}</p>
                    <p className="text-base font-semibold text-green-600 mt-1">Le dossier pour l&apos;améliorer est déjà prêt.</p>
                    {result.lostCalls > 0 && (
                      <p className="text-sm font-bold text-red-500 mt-2">~{result.lostCalls} appels perdus par mois · ~{result.lostRevenue}€ non réalisés</p>
                    )}
                  </>
                })()}
                <p className="text-xs text-gray-400 mt-3">{result.competitors.length} concurrent{result.competitors.length > 1 ? 's' : ''} analysés · {result.reviews} avis · {result.city}</p>
              </div>

              <div ref={scroll50Ref} />

              {/* Écran 2 — Qu'avez-vous fait ? */}
              <div ref={descriptionRef} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-900 px-5 py-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-green-400">✅ Votre nouvelle fiche est prête</p>
                  {generationSeconds !== null && generationSeconds <= 120 && (
                    <span className="text-xs text-gray-500">⚡ {generationSeconds}s</span>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">📝 Nouvelle description Google</p>
                  {generatingContent && !generatedDescription ? (
                    <div className="space-y-2 animate-pulse">
                      {[...Array(4)].map((_, i) => <div key={i} className={`h-3 bg-gray-100 rounded ${i === 3 ? 'w-3/5' : 'w-full'}`} />)}
                    </div>
                  ) : (
                    <>
                      <div className={`text-sm text-gray-800 leading-relaxed whitespace-pre-line ${showFullDesc ? '' : 'line-clamp-4'}`}>
                        {generatedDescription}
                      </div>
                      {generatedDescription && (
                        <button onClick={() => setShowFullDesc(v => !v)} className="text-xs text-blue-500 mt-2 font-medium">
                          {showFullDesc ? 'Réduire ▲' : 'Voir tout ▼'}
                        </button>
                      )}
                    </>
                  )}
                </div>
                {generatedDescription && (
                  <div ref={ctaRef} className="px-5 pb-5">
                    <a
                      href={pricingUrl}
                      onClick={() => { setCtaClicked(true); track('cta_click_subscribe', { score: result.score, category: result.category, city: result.city, position: 'early' }) }}
                      className="block w-full rounded-xl bg-green-500 hover:bg-green-400 py-4 text-base font-extrabold text-white text-center transition shadow-lg"
                    >
                      Je récupère mon dossier complet — 39€ →
                    </a>
                    <p className="text-xs text-gray-400 text-center mt-2">Paiement sécurisé · Satisfait ou remboursé</p>
                  </div>
                )}
              </div>

              {/* Écran 3 — Qu'est-ce que je reçois ? */}
              <div ref={postsRef} className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Ce que contient le dossier</p>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { icon: '📝', label: 'Description', sub: '1 — prête' },
                    { icon: '📅', label: 'Publications', sub: '12 — 3 mois' },
                    { icon: '⭐', label: 'Avis', sub: `${result.recentReviews?.length || 0}+ réponses` },
                    { icon: '📈', label: 'Plan d\'action', sub: '3 priorités' },
                  ].map(({ icon, label, sub }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-xl mb-1">{icon}</p>
                      <p className="text-sm font-bold text-gray-900">{label}</p>
                      <p className="text-xs text-green-600 font-medium mt-0.5">✓ {sub}</p>
                    </div>
                  ))}
                </div>

                {/* Exemple publication collapsible */}
                <button
                  onClick={() => setShowPostEx(v => !v)}
                  className="w-full text-left text-xs font-medium text-gray-500 py-3 border-t border-gray-100 flex items-center justify-between"
                >
                  <span>Voir un exemple de publication</span>
                  <span>{showPostEx ? '▲' : '▼'}</span>
                </button>
                {showPostEx && (
                  <div className="mt-2 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                    {generatedPosts.length > 0
                      ? <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{generatedPosts[0]}</p>
                      : <p className="text-xs text-gray-400">En cours de génération…</p>
                    }
                  </div>
                )}

                {/* Exemple avis collapsible */}
                {(generatedReview || generatingContent) && (
                  <>
                    <button
                      onClick={() => setShowReviewEx(v => !v)}
                      className="w-full text-left text-xs font-medium text-gray-500 py-3 border-t border-gray-100 flex items-center justify-between"
                    >
                      <span>Voir une réponse d&apos;avis</span>
                      <span>{showReviewEx ? '▲' : '▼'}</span>
                    </button>
                    {showReviewEx && (
                      <div className="mt-2 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                        {generatedReview
                          ? <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{generatedReview}</p>
                          : <p className="text-xs text-gray-400">En cours de génération…</p>
                        }
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Écran 4 — Avant / Après (seulement si des problèmes existent) */}
              {(() => {
                const problems = ([
                  !result.criteria.description && 'Activité pas expliquée',
                  !result.criteria.recentReview && 'Fiche inactive',
                  !result.criteria.avis20 && 'Peu d\'avis',
                  topCompetitor && topCompetitor.estimatedScore > result.score && `${topCompetitor.name} devant vous`,
                ] as (string | false)[]).filter((x): x is string => Boolean(x)).slice(0, 3)
                if (problems.length === 0) return null
                return (
                  <div ref={beforeAfterRef} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-2">
                      <div className="p-4 bg-red-50 border-r border-gray-100">
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-3">Aujourd&apos;hui</p>
                        <div className="space-y-2">
                          {problems.map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="text-red-400 text-xs shrink-0">✗</span>
                              <p className="text-xs text-gray-600">{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-4 bg-green-50">
                        <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-3">Après le dossier</p>
                        <div className="space-y-2">
                          {['Fiche claire et complète', 'Active 3 mois', 'Avis avec réponses', 'Plan concret'].map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="text-green-500 text-xs shrink-0">✓</span>
                              <p className="text-xs text-gray-700">{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Écran 5 — J'achète + urgence */}
              <div ref={scroll75Ref} />
              <div>
                <div ref={scroll100Ref} />
                <div className="rounded-2xl bg-gray-900 p-6">

                  {/* Badge urgence */}
                  <div className="inline-flex items-center gap-1.5 bg-gray-800 text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                    <span>⏳</span> Dossier réservé pendant 24h
                  </div>

                  {/* Titre */}
                  <p className="text-white text-xl font-extrabold leading-snug mb-5">
                    Votre dossier est terminé.
                  </p>

                  {/* Récapitulatif du travail effectué */}
                  <div className="bg-gray-800/60 rounded-xl px-4 py-4 mb-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Ce qui a été préparé</p>
                    <div className="space-y-2">
                      {[
                        `Analyse de votre fiche terminée`,
                        `${result.competitors.length} concurrent${result.competitors.length > 1 ? 's' : ''} analysés`,
                        `Description rédigée pour ${result.name}`,
                        `Calendrier de publications préparé`,
                        `Réponses aux avis générées`,
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-green-400 text-xs shrink-0">✔</span>
                          <p className="text-xs text-gray-300">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Aperçu vs dossier complet */}
                  <div className="bg-green-900/20 border border-green-700/30 rounded-xl px-4 py-3 mb-5 text-center">
                    {(() => {
                      const total = 1 + 12 + (result.recentReviews?.length || 0) + 10 + 2 + 1 + 1
                      return <>
                        <p className="text-white font-extrabold text-lg">{total} éléments préparés.</p>
                        <p className="text-gray-400 text-sm mt-0.5">Vous n&apos;en voyez actuellement que 3.</p>
                      </>
                    })()}
                  </div>

                  {/* Motivation douce */}
                  <p className="text-gray-400 text-sm italic mb-5">
                    Chaque jour où votre fiche reste inchangée est une occasion manquée d&apos;améliorer votre visibilité sur Google.
                  </p>

                  <a
                    href={pricingUrl}
                    onClick={() => { setCtaClicked(true); track('cta_click_subscribe', { ...eventProps, priority: selectedPriority }) }}
                    className="block w-full rounded-xl bg-green-500 hover:bg-green-400 py-4 text-base font-extrabold text-white transition mb-3 text-center shadow-lg shadow-green-900/30"
                  >
                    🚀 Débloquer mon dossier{result.category ? ` ${result.category}` : ' personnalisé'} — 39€
                  </a>
                  <p className="text-gray-500 text-xs text-center">Paiement sécurisé · Satisfait ou remboursé · Sans engagement</p>
                </div>
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

      {/* CTA flottant — toujours visible une fois le résultat chargé */}
      {result && !showLoadingOverlay && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 shadow-xl sm:hidden">
          <a
            href={pricingUrl}
            onClick={() => { setCtaClicked(true); track('cta_click_floating', { score: result.score, category: result.category }) }}
            className="block w-full rounded-xl bg-green-500 py-3.5 text-sm font-bold text-white text-center"
          >
            Je récupère tout le travail préparé — 39€ →
          </a>
        </div>
      )}
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
