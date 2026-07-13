'use client'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { track } from '@/lib/track'
import type { Competitor, ProblemItem } from '@/app/api/analyse-public/route'

import ScreenInput     from './ScreenInput'
import ScreenLoading   from './ScreenLoading'
import ScreenProblemes from './ScreenProblemes'
import ScreenTemps     from './ScreenTemps'
import ScreenTravail   from './ScreenTravail'
import ScreenLivrables from './ScreenLivrables'

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
  completeness: { percent: number; filled: number; total: number; missing: string[] }
  businessStatus: string
  isClosed: boolean
  openNow: boolean | null
  weekdayHours: string[]
  recentReviews: { author: string; rating: number; text: string; time: string }[]
  priceLevel: number | null
  googleMapsUrl: string | null
  phoneIntl: string | null
  placeId?: string | null
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
// 2 = problemes  (étape 1/5 — animation + bilan)
// 3 = temps      (étape 2/5)
// 4 = travail    (étape 3/5)
// 5 = livrables  (étape 4/5 — CTA direct vers pricing)

export default function AnalyserFlow() {
  const [screen, setScreen] = useState(0)
  const [nom, setNom]       = useState('')
  const [ville, setVille]   = useState('')
  const [email, setEmail]   = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError]   = useState<string | null>(null)

  const [generatedDescription, setGeneratedDescription] = useState<string | null>(null)
  const [generating, setGenerating]                     = useState(false)

  const contactUrl = result
    ? `/contact?name=${encodeURIComponent(result.name)}${email ? `&email=${encodeURIComponent(email)}` : ''}&message=${encodeURIComponent(`Je souhaite recevoir mon rapport pour ${result.name} à ${result.city}.`)}`
    : '/contact'

  // Point d'entrée unique du pipeline de vente — appelé par TOUS les chemins
  // qui mènent à /contact (CTA final ET lien "Recevoir mon rapport" affiché
  // dès l'étape 1). Écrit en base avant la navigation (keepalive : survit à
  // la navigation), pour ne jamais perdre un lead qui saute directement à la
  // fin sans passer par ScreenLivrables.
  function notifyReportRequested() {
    if (!result) return
    try {
      fetch('/api/report-requested', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          nom:   result.name,
          ville: result.city,
          secteur: result.category,
          email: email || null,
          score: result.score,
          completenessPercent: result.completeness?.percent ?? null,
          placeId: result.placeId ?? null,
        }),
      }).catch(() => {})
    } catch { /* ne bloque jamais la navigation du prospect */ }
  }

  const onSkip = () => {
    track('skipped_to_contact', {})
    notifyReportRequested()
    window.location.href = contactUrl
  }

  async function handleStart(paramNom: string, paramVille: string, paramEmail: string) {
    setNom(paramNom)
    setVille(paramVille)
    setEmail(paramEmail)
    setScreen(1)
    setResult(null)
    setError(null)
    setGeneratedDescription(null)

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
          if (d.description) setGeneratedDescription(d.description)
        })
        .catch(() => {})
        .finally(() => setGenerating(false))
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
      setScreen(0)
    }
  }

  // 1 description + 1 services + 20 FAQ + 20 idées photos + avis répondus + 30 modèles
  // + 1 QR/script + 1 guide mise en ligne + 1 plan d'action (publications retirées du pack)
  const totalElements =
    1 + 1 + 20 + 20 + (result?.recentReviews?.length || 0) + 30 + 1 + 1 + 1

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
          <ScreenProblemes
            key="screen-2"
            result={result}
            onNext={() => { track('saw_temps', {}); setScreen(3) }}
            onSkip={onSkip}
          />
        )}
        {screen === 3 && (
          <ScreenTemps
            key="screen-3"
            onNext={() => { track('saw_travail', {}); setScreen(4) }}
            onSkip={onSkip}
          />
        )}
        {screen === 4 && result && (
          <ScreenTravail
            key="screen-4"
            result={result}
            generatedDescription={generatedDescription}
            generating={generating}
            onNext={() => { track('saw_livrables', {}); setScreen(5) }}
            onSkip={onSkip}
          />
        )}
        {screen === 5 && result && (
          <ScreenLivrables
            key="screen-5"
            result={result}
            totalElements={totalElements}
            contactUrl={contactUrl}
            onReportRequested={notifyReportRequested}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
