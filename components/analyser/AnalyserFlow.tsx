'use client'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { track } from '@/lib/track'
import type { Competitor, ProblemItem } from '@/app/api/analyse-public/route'

import ScreenInput      from './ScreenInput'
import ScreenLoading    from './ScreenLoading'
import ScreenDiagnostic from './ScreenDiagnostic'
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
// 2 = diagnostic
// 3 = problemes
// 4 = travail
// 5 = livrables
// 6 = cta

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

  // 1 description + 12 publications + N réponses (max 3) + 10 modèles + 2 (QR+SMS) + 1 plan + 1 guide
  const totalElements =
    1 + 12 + (result?.recentReviews?.length || 0) + 10 + 2 + 1 + 1

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
          <ScreenDiagnostic key="screen-2" result={result} onNext={() => setScreen(3)} />
        )}
        {screen === 3 && result && (
          <ScreenProblemes
            key="screen-3"
            result={result}
            generatedDescription={generatedDescription}
            generatedReview={generatedReview}
            generating={generating}
            onNext={() => setScreen(4)}
          />
        )}
        {screen === 4 && result && (
          <ScreenTravail
            key="screen-4"
            result={result}
            generatedDescription={generatedDescription}
            generatedPosts={generatedPosts}
            generatedReview={generatedReview}
            generating={generating}
            onNext={() => setScreen(5)}
          />
        )}
        {screen === 5 && result && (
          <ScreenLivrables
            key="screen-5"
            result={result}
            totalElements={totalElements}
            onNext={() => setScreen(6)}
          />
        )}
        {screen === 6 && result && (
          <ScreenCTA
            key="screen-6"
            result={result}
            pricingUrl={pricingUrl}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
