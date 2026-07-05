'use client'
import type { AnalysisResult } from './AnalyserFlow'
import ScreenLayout from './ScreenLayout'

interface Props {
  result: AnalysisResult
  generatedDescription: string | null
  generatedPosts: string[]
  generatedReview: string | null
  generating: boolean
  onNext: () => void
  onSkip: () => void
}

function countIssues(result: AnalysisResult): number {
  let n = 0
  if (!result.criteria?.description)                  n++
  if (!result.criteria?.photos)                       n++
  if (!result.criteria?.recentReview)                 n++
  if (!result.criteria?.horaires)                     n++
  if (!result.criteria?.avis20)                       n++
  if ((result.recentReviews?.length ?? 0) > 0)        n++
  return n
}

export default function ScreenTravail({
  result,
  generatedDescription,
  generatedPosts,
  generatedReview,
  generating,
  onNext,
  onSkip,
}: Props) {
  // BACKEND GAP: "Prêt" is based on in-session state, not DB.
  // When generating=false the pack always includes all 4 elements.
  const descSpinning  = generating && !generatedDescription
  const postsSpinning = generating && generatedPosts.length === 0
  const descReady     = !generating || !!generatedDescription
  const postsReady    = !generating || generatedPosts.length > 0
  const repliesReady  = true
  const contactReady  = true

  const readyCount = [descReady, postsReady, repliesReady, contactReady].filter(Boolean).length
  const pct = Math.round((readyCount / 4) * 100)
  const N = countIssues(result)
  const unansweredCount = result.recentReviews?.length ?? 0

  const checklist = [
    {
      id:       'description',
      label:    'Expliquer votre activité',
      detail:   'Description Google rédigée pour votre métier et votre ville',
      ready:    descReady,
      spinning: descSpinning,
    },
    {
      id:       'posts',
      label:    'Montrer que vous êtes actif',
      detail:   '12 publications prêtes à poster sur votre fiche (3 mois)',
      ready:    postsReady,
      spinning: postsSpinning,
    },
    {
      id:       'replies',
      label:    'Répondre à vos avis',
      detail:   unansweredCount > 0
        ? `${unansweredCount} réponse${unansweredCount > 1 ? 's' : ''} personnalisée${unansweredCount > 1 ? 's' : ''} + 30 modèles pour les prochains avis`
        : '30 modèles de réponses pour tous vos avis clients',
      ready:    repliesReady,
      spinning: false,
    },
    {
      id:       'contact',
      label:    'Donner envie de vous contacter',
      detail:   "QR code de collecte d'avis + script de relance SMS",
      ready:    contactReady,
      spinning: false,
    },
  ]

  return (
    <ScreenLayout step={4} totalSteps={6} onSkip={onSkip}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
        Travail déjà fait
      </p>

      <h2 className="text-xl font-bold text-gray-900 mb-1 leading-snug">
        {N > 0 ? (
          <>Nous avons identifié {N} point{N > 1 ? 's' : ''} sur votre fiche.</>
        ) : (
          <>Votre fiche est solide.</>
        )}
      </h2>
      <p className="text-xl font-bold text-[#16a34a] mb-5 leading-snug">
        {N > 0
          ? 'Les 4 solutions sont déjà prêtes.'
          : '4 améliorations déjà prêtes pour vous.'}
      </p>

      {/* Completion bar */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-gray-400">{readyCount}/4 prêts</p>
          <p className="text-xs font-semibold text-[#16a34a]">{pct}%</p>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#16a34a] rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="space-y-3 mb-8">
        {checklist.map(({ id, label, detail, ready, spinning }) => (
          <div
            key={id}
            className="flex items-start gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-white"
          >
            <div className="mt-0.5 shrink-0 w-5 flex items-center justify-center">
              {spinning ? (
                <span className="block w-4 h-4 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
              ) : (
                <span className={`text-base font-bold leading-none ${ready ? 'text-[#16a34a]' : 'text-gray-300'}`}>
                  {ready ? '✓' : '○'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">{detail}</p>
            </div>
            <span className={`text-xs font-semibold shrink-0 mt-0.5 ${
              spinning ? 'text-gray-300' : ready ? 'text-[#16a34a]' : 'text-gray-300'
            }`}>
              {spinning ? 'En cours' : ready ? 'Prêt' : '—'}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="w-full rounded-xl bg-gray-900 px-5 py-4 text-sm font-bold text-white hover:bg-gray-800 transition"
      >
        Voir ce que vous récupérez →
      </button>
    </ScreenLayout>
  )
}
