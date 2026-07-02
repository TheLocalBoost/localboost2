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

  const descriptionRef = useRef<HTMLDivElement>(null)
  const postsRef       = useRef<HTMLDivElement>(null)
  const beforeAfterRef = useRef<HTMLDivElement>(null)
  const ctaRef         = useRef<HTMLDivElement>(null)

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

  // Visibility tracking — mesure quelles sections sont réellement vues
  useEffect(() => {
    if (!result) return
    const pairs: [React.RefObject<HTMLDivElement>, string][] = [
      [descriptionRef, 'saw_description'],
      [postsRef,       'saw_posts'],
      [beforeAfterRef, 'saw_before_after'],
      [ctaRef,         'saw_cta'],
    ]
    const observers = pairs.map(([ref, event]) => {
      if (!ref.current) return null
      const o = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) {
          track(event, { score: result.score, category: result.category, city: result.city })
          o.disconnect()
        }
      }, { threshold: 0.3 })
      o.observe(ref.current)
      return o
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [result])

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
    selectedPriority ? 'Préparation de votre dossier...' : 'En attente de votre réponse',
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
  // L'étape 4 ("Préparation du dossier") est bloquée jusqu'à ce que
  // le client ait choisi sa priorité — ça rend la question indispensable.
  useEffect(() => {
    if (revealedCount >= realDoneCount || revealedCount >= STEP_LABELS.length) return
    // Bloquer à l'étape 3 (index 3 = "Préparation de votre dossier")
    // jusqu'à ce que la priorité soit sélectionnée
    if (revealedCount === 3 && !selectedPriority) return
    const t = setTimeout(() => setRevealedCount(c => c + 1), 300)
    return () => clearTimeout(t)
  }, [revealedCount, realDoneCount, selectedPriority])

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
      track('analyzer_result', { score: data.score, city: data.city, category: data.category })
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

                {/* Question priorité pendant le chargement — dès que l'analyse est prête (étape 2/4) */}
                {revealedCount >= 2 && (
                  <div className="border-t border-gray-100 pt-5 animate-[fadeIn_0.4s_ease]">
                    <p className="text-sm font-semibold text-gray-800 mb-1">Pendant que nous préparons votre fiche…</p>
                    <p className="text-xs text-gray-500 mb-3">Quelle est votre priorité principale ?</p>
                    <div className="space-y-2">
                      {PRIORITIES_CONFIG.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedPriority(p.id)
                            track('priority_selected', { priority: p.id, during: 'loading' })
                          }}
                          className={`w-full text-left rounded-xl border px-3 py-2.5 text-sm transition ${
                            selectedPriority === p.id
                              ? 'border-green-500 bg-green-50 text-green-800 font-semibold'
                              : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {selectedPriority === p.id && <span className="mr-1.5">✓</span>}
                          {p.label}
                        </button>
                      ))}
                    </div>
                    {selectedPriority && (
                      <p className="text-xs text-green-600 mt-2 text-center">
                        Nous intégrons cet objectif dans votre préparation.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        <div id="analyzer-result">
          {result && (
            <div className="space-y-6 animate-[fadeIn_0.5s_ease]">

              {/* ═══ HOOK COURT — immédiat ═══ */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-xs text-gray-400 mb-3">{result.name} · {result.address}</p>
                {(() => {
                  const n = result.problems.length + (!result.criteria.description ? 1 : 0)
                  return (
                    <p className="text-2xl font-extrabold text-gray-900 leading-tight">
                      {n} amélioration{n > 1 ? 's' : ''} identifiée{n > 1 ? 's' : ''}.
                    </p>
                  )
                })()}
                <p className="text-lg font-semibold text-green-600 mt-1">4 sont déjà prêtes pour vous.</p>
                <p className="text-xs text-gray-400 mt-2">
                  Basé sur {result.competitors.length} concurrent{result.competitors.length > 1 ? 's' : ''} {result.competitors.length > 1 ? 'locaux' : 'local'} analysés{result.reviews > 0 ? ` · ${result.reviews} avis clients` : ''}.
                </p>
              </div>

              {/* ═══ PREUVE IMMÉDIATE + CTA HAUT ═══ */}
              {(generatingContent || generatedDescription || generatedPosts.length > 0) && (
              <div>
                <div className="bg-gray-900 text-white rounded-2xl px-5 py-4 mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-green-400 uppercase tracking-wide mb-0.5">Votre nouvelle fiche est prête</p>
                    <p className="text-base font-bold leading-snug">Nous avons déjà commencé les corrections pour {result.name}.</p>
                  </div>
                  {generationSeconds !== null && generationSeconds <= 120 && (
                    <span className="text-xs text-gray-400 shrink-0 ml-3">⚡ {generationSeconds}s</span>
                  )}
                </div>
                <div className="bg-white rounded-2xl border border-blue-100 p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-blue-600 text-sm">✦</span>
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Dossier préparé pour {result.name}</p>
                  </div>
                  <p className="text-xs text-gray-400 mb-5 ml-5">Personnalisé pour votre activité à {result.city}</p>

                  <div className="space-y-5">
                    {/* Description complète */}
                    <div ref={descriptionRef}>
                      <p className="text-xs font-semibold text-gray-500 mb-2">📝 Ce que les gens lisent pendant les 5 premières secondes</p>
                      {generatingContent && !generatedDescription ? (
                        <div className="space-y-2 animate-pulse">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`h-3 bg-gray-100 rounded ${i === 4 ? 'w-3/5' : i === 3 ? 'w-4/5' : 'w-full'}`} />
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{generatedDescription}</p>
                          <p className="text-xs text-gray-400 mt-2">Prêt à publier dans votre fiche Google</p>
                        </div>
                      )}
                    </div>


                    {/* 1 post complet + aperçu des thèmes saisonniers */}
                    <div ref={postsRef}>
                      <p className="text-xs font-semibold text-gray-500 mb-2">📅 Exemple de publication — 1 sur 12 préparées</p>
                      {generatingContent && generatedPosts.length === 0 ? (
                        <div className="space-y-2 animate-pulse">
                          <div className="h-3 bg-gray-100 rounded w-full" />
                          <div className="h-3 bg-gray-100 rounded w-5/6" />
                          <div className="h-3 bg-gray-100 rounded w-4/6" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {generatedPosts.length > 0 && (
                            <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                              <p className="text-xs text-gray-400 mb-1">Publication n°1</p>
                              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{generatedPosts[0]}</p>
                            </div>
                          )}
                          {/* Aperçu des 11 autres thèmes */}
                          <div className="rounded-xl bg-gray-50 border border-dashed border-gray-200 px-4 py-3">
                            <p className="text-xs font-semibold text-gray-500 mb-2">11 autres publications incluses dans le dossier :</p>
                            <div className="space-y-1.5">
                              {[
                                `Conseil de saison pour vos clients à ${result.city}`,
                                'Publication spéciale Noël — message & offre',
                                'Publication rentrée — reprise & disponibilités',
                                'Témoignage client — retour positif en image',
                                'Fête des mères / Fête des pères — idée cadeau',
                                'Coulisses de votre activité — journée type',
                                'Conseil pratique de votre métier',
                                'Disponibilités & délais ce mois-ci',
                                'Présentation d\'un service spécifique',
                                'Offre ou promotion du moment',
                                'Publication vacances d\'été',
                              ].map((theme, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="text-gray-300 text-xs shrink-0">🔒</span>
                                  <p className="text-xs text-gray-400">{theme}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Réponse à l'avis */}
                    {(generatingContent || generatedReview) && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">⭐ Ce que les futurs clients liront avant de vous choisir</p>
                        {generatingContent && !generatedReview ? (
                          <div className="space-y-2 animate-pulse">
                            <div className="h-3 bg-gray-100 rounded w-full" />
                            <div className="h-3 bg-gray-100 rounded w-4/6" />
                          </div>
                        ) : (
                          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{generatedReview}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Vous voyez un aperçu — le pack livre beaucoup plus */}
                  <div className="mt-6 pt-5 border-t border-gray-100">
                    <p className="text-xs text-gray-500 italic mb-3">Vous voyez ici un aperçu. Après validation, vous récupérez l'ensemble des contenus et outils préparés pour votre entreprise.</p>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Votre dossier complet</p>
                    <div className="space-y-4">
                      {[
                        {
                          icon: '📍', title: 'Convaincre les visiteurs',
                          items: ['Description Google optimisée', 'Catégories secondaires suggérées', 'Présentation claire de vos services']
                        },
                        {
                          icon: '📅', title: 'Animer votre fiche 3 mois',
                          items: ['12 publications prêtes (saisonnières, conseils, promos)', 'Calendrier de publication mensuel']
                        },
                        {
                          icon: '⭐', title: 'Renforcer la confiance',
                          items: ['Réponses à vos avis récents', '10 modèles réutilisables pour vos futurs avis', 'QR code + script SMS demande d\'avis']
                        },
                        {
                          icon: '📈', title: 'Passer devant vos concurrents',
                          items: [`Plan d'action basé sur les ${result.competitors.length} concurrents analysés`, 'Guide de mise en ligne pas à pas']
                        },
                      ].map(({ icon, title, items }, i) => (
                        <div key={i}>
                          <p className="text-xs font-bold text-gray-700 mb-1.5">{icon} {title}</p>
                          <div className="space-y-1 pl-5">
                            {items.map((item, j) => (
                              <div key={j} className="flex items-center gap-1.5">
                                <span className="text-green-500 text-xs shrink-0">✓</span>
                                <p className="text-xs text-gray-600">{item}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Temps économisé */}
                  <div className="mt-5 flex items-center justify-between bg-green-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-xs text-gray-500 line-through">À faire soi-même : 6 à 7 heures — à condition de savoir quoi écrire</p>
                      <p className="text-sm font-bold text-green-700">LocalBoost : quelques secondes ⚡</p>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* ═══ ACTE 3 — LA DÉCISION ═══ */}
              <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">3. Finaliser</p>

              {/* Avant/Après — pas de score chiffré, juste les items */}
              <div ref={beforeAfterRef} className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
                <div className="grid grid-cols-2">
                  <div className="p-4 bg-red-50 border-r border-gray-100">
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-3">Votre fiche aujourd'hui</p>
                    <div className="space-y-1.5">
                      {([
                        !result.criteria.description && 'Activité pas expliquée',
                        !result.criteria.recentReview && 'Fiche paraît inactive',
                        !result.criteria.avis20 && 'Peu d\'éléments rassurants',
                        !result.criteria.note4 && 'Note peu convaincante',
                        topCompetitor && topCompetitor.estimatedScore > result.score && `${topCompetitor.name} en avant`,
                      ] as (string | false)[]).filter((x): x is string => Boolean(x)).slice(0, 4).map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="text-red-400 text-xs">✗</span>
                          <p className="text-xs text-gray-600">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-green-50">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-3">Après le dossier</p>
                    <div className="space-y-1.5">
                      {[
                        'Activité bien expliquée',
                        'Fiche active 3 mois',
                        'Avis avec réponses',
                        'Plan d\'action clair',
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="text-green-500 text-xs">✓</span>
                          <p className="text-xs text-gray-700">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>


              {/* CTA — mission à finaliser, avec valeur du travail intégrée */}
              {(() => {
                const PRIORITY_CTAS: Record<string, string> = {
                  convince: `Je récupère la nouvelle présentation de ${result.name}`,
                  reviews:  `Je récupère les réponses aux avis de ${result.name}`,
                  publish:  `Je récupère les publications de ${result.name}`,
                  time:     `Je récupère tout le travail préparé`,
                }
                const ctaLabel = selectedPriority
                  ? `${PRIORITY_CTAS[selectedPriority]} — 39€ →`
                  : `Je récupère tout le travail préparé — 39€ →`

                return (
                  <div ref={ctaRef} className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-green-400 text-xs font-bold uppercase tracking-wide">Travail prêt · En attente de validation</p>
                      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">Réservé 24h</span>
                    </div>
                    {/* Pull quote — le client se projette */}
                    <blockquote className="border-l-2 border-green-500 pl-4 mb-4">
                      <p className="text-white font-semibold text-base leading-snug">
                        Imaginez un habitant de {result.city} qui cherche un {result.category} sur Google.
                      </p>
                      <p className="text-gray-300 text-sm mt-1">
                        Nous avons préparé ce qu'il verra — pour lui donner davantage de raisons de vous choisir plutôt qu'un concurrent.
                      </p>
                    </blockquote>

                    {/* Ce qui est livré dans le dossier — pas l'aperçu gratuit */}
                    {(() => {
                      const packItems = [
                        '1 description premium',
                        '12 publications prêtes (3 mois)',
                        'Réponses aux avis récents',
                        '10 modèles de réponses réutilisables',
                        '1 QR Code + script SMS',
                        '1 plan d\'action prioritaire',
                        '1 guide de mise en ligne',
                      ]
                      const total = 1 + 12 + (result.recentReviews?.length || 0) + 10 + 2 + 1 + 1
                      return (
                        <div className="bg-gray-800/60 rounded-xl px-4 py-4 mb-4">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Ce que vous recevez après validation</p>
                          <div className="grid grid-cols-2 gap-1.5 mb-3">
                            {packItems.map((item, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <span className="text-green-400 text-xs shrink-0">✓</span>
                                <p className="text-xs text-gray-300">{item}</p>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs font-bold text-green-400 text-center border-t border-gray-700 pt-2">
                            {total}+ éléments livrés — contre 3 visibles en aperçu
                          </p>
                        </div>
                      )
                    })()}

                    <a
                      href={pricingUrl}
                      onClick={() => {
                        setCtaClicked(true)
                        track('cta_click_subscribe', { score: result.score, category: result.category, city: result.city, priority: selectedPriority })
                      }}
                      className="block w-full rounded-xl bg-green-500 hover:bg-green-400 py-4 text-base font-extrabold text-white transition mb-2 text-center shadow-lg shadow-green-900/30"
                    >
                      {ctaLabel}
                    </a>
                    <p className="text-gray-400 text-xs text-center">Paiement sécurisé · Si le contenu ne vous convient pas, nous le retravaillons ou remboursons · Sans engagement</p>
                  </div>
                )
              })()}
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
