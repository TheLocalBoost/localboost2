'use client'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { track } from '@/lib/track'
import type { Competitor, ProblemItem } from '@/app/api/analyse-public/route'

import ScreenInput      from './ScreenInput'
import ScreenLoading    from './ScreenLoading'
import ScreenDiagnostic from './ScreenDiagnostic'
import ScreenTemps      from './ScreenTemps'
import ScreenProblemes  from './ScreenProblemes'
import ScreenTravail    from './ScreenTravail'
import ScreenLivrables  from './ScreenLivrables'
import ScreenCTA        from './ScreenCTA'

// Re-export so child screens can import the type from this file
export interface AnalysisResult {
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
  commercialScores?: {
    found: number
    trust: number
    desire: number
    activity: number
    vsCompetitors: number
  }
}

// screen indexes:
// 0 = input
// 1 = loading
// 2 = diagnostic  (step 1/6 — no skip link)
// 3 = temps        (step 2/6)  ← NEW
// 4 = problemes    (step 3/6)
// 5 = travail      (step 4/6)
// 6 = livrables    (step 5/6)
// 7 = cta          (step 6/6 — no skip link)

export default function AnalyserFlow() {
  const [screen, setScreen] = useState(0)
  const [nom, setNom]       = useState('')
  const [ville, setVille]   = useState('')
  const [email, setEmail]   = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError]   = useState<string | null>(null)

  const [generatedDescription, setGeneratedDescription] = useState<string | null>(null)
  const [generatedPosts, setGeneratedPosts]             = useState<string[]>([])
  const [generatedReview, setGeneratedReview]           = useState<string | null>(null)
  const [generating, setGenerating]                     = useState(false)

  const onSkip = () => { track('skipped_to_cta', {}); setScreen(7) }

  async function handleStart(paramNom: string, paramVille: string, paramEmail: string) {
    setNom(paramNom)
    setVille(paramVille)
    setEmail(paramEmail)
    setScreen(1)
    setResult(null)
    setError(null)
    setGeneratedDescription(null)
    setGeneratedPosts([])
    setGeneratedReview(null)

    track('analyzer_search', { name: paramNom, city: paramVille })

    try {
      const res  = await fetch('/api/analyse-public', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ commerce_name: paramNom, city: paramVille }),
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setScreen(0)
        return
      }

      const analysisResult = data as AnalysisResult
      setResult(analysisResult)

      track('analyzer_result', {
        score:             data.score,
        city:              data.city,
        category:          data.category,
        nb_problems:       (data.problems ?? []).length,
        rating:            data.rating,
        lost_revenue:      data.lostRevenue,
        has_description:   data.criteria?.description,
        has_recent_review: data.criteria?.recentReview,
        review_count:      data.reviews,
      })

      setScreen(2)
      track('saw_diagnostic', { score: data.score, city: data.city, category: data.category })

      // Content generation in background — starts immediately after API result
      setGenerating(true)
      const bestReview =
        (data.recentReviews ?? []).find((r: { text: string }) => r.text?.length > 20) ?? null

      fetch('/api/generate-post', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:         data.name,
          city:         data.city,
          category:     data.category,
          recentReview: bestReview,
          phoneIntl:    data.phoneIntl ?? null,
        }),
      })
        .then(r => r.json())
        .then(d => {
          if (d.description)    setGeneratedDescription(d.description)
          if (d.posts?.length)  setGeneratedPosts(d.posts)
          if (d.reviewResponse) setGeneratedReview(d.reviewResponse)
        })
        .catch(() => {})
        .finally(() => setGenerating(false))
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
      setScreen(0)
    }
  }

  // Décompte complet du pack :
  // 1 description + 1 services + 20 FAQ + 12 publications + 1 calendrier + 20 photos
  // + N réponses perso + 30 modèles + 1 QR+script SMS + 1 guide + 1 plan d'action
  const totalElements =
    1 + 1 + 20 + 12 + 1 + 20 + (result?.recentReviews?.length || 0) + 30 + 1 + 1 + 1

  const pricingUrl = result
    ? `/pricing?nom=${encodeURIComponent(result.name)}&city=${encodeURIComponent(result.city)}&score=${result.score}&revenue=${result.lostRevenue}${email ? `&email=${encodeURIComponent(email)}` : ''}`
    : '/pricing'

  return (
    <div className="relative">
      {error && screen === 0 && (
        <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 max-w-[480px] w-full pointer-events-auto">
            {error}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {screen === 0 && (
          <ScreenInput key="screen-0" onStart={handleStart} />
        )}
        {screen === 1 && (
          <ScreenLoading key="screen-1" nom={nom} ville={ville} />
        )}
        {screen === 2 && result && (
          <ScreenDiagnostic
            key="screen-2"
            result={result}
            onNext={() => { track('saw_temps', {}); setScreen(3) }}
          />
        )}
        {screen === 3 && (
          <ScreenTemps
            key="screen-3"
            onNext={() => { track('saw_problemes', {}); setScreen(4) }}
            onSkip={onSkip}
          />
        )}
        {screen === 4 && result && (
          <ScreenProblemes
            key="screen-4"
            result={result}
            generatedDescription={generatedDescription}
            generatedReview={generatedReview}
            generating={generating}
            onNext={() => { track('saw_travail', {}); setScreen(5) }}
            onSkip={onSkip}
          />
        )}
        {screen === 5 && result && (
          <ScreenTravail
            key="screen-5"
            result={result}
            generatedDescription={generatedDescription}
            generatedPosts={generatedPosts}
            generatedReview={generatedReview}
            generating={generating}
            onNext={() => { track('saw_livrables', {}); setScreen(6) }}
            onSkip={onSkip}
          />
        )}
        {screen === 6 && result && (
          <ScreenLivrables
            key="screen-6"
            result={result}
            totalElements={totalElements}
            onNext={() => { track('saw_cta', {}); setScreen(7) }}
            onSkip={onSkip}
          />
        )}
        {screen === 7 && result && (
          <ScreenCTA
            key="screen-7"
            result={result}
            pricingUrl={pricingUrl}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
