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

// BACKEND GAP: "Prêt" is based on in-session state, not DB.
// When generating=false the pack always includes all 5 deliverable groups.

// Single source of truth for issue counting — shared between title and bar.
// Mirrors the criteria checked by ScreenDiagnostic / ScreenProblemes.
// Issue not covered by the paid report (owner must act directly in Google My Business):
//   • !criteria.horaires → update schedule yourself (Google My Business, < 5 min)
function countIssues(result: AnalysisResult) {
  const description  = !result.criteria?.description
  const photos       = !result.criteria?.photos
  const recentReview = !result.criteria?.recentReview
  const horaires     = !result.criteria?.horaires
  const avis20       = !result.criteria?.avis20
  const unanswered   = (result.recentReviews?.length ?? 0) > 0

  const total      = [description, photos, recentReview, horaires, avis20, unanswered].filter(Boolean).length
  const notInReport = horaires ? 1 : 0
  return { total, notInReport, horaires }
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
  const descSpinning  = generating && !generatedDescription
  const postsSpinning = generating && generatedPosts.length === 0
  const descReady     = !generating || !!generatedDescription
  const postsReady    = !generating || generatedPosts.length > 0

  const { total: N, notInReport: manualCount, horaires: needsHoraires } = countIssues(result)
  const reportCount = Math.max(0, N - manualCount)

  const barTotal = N > 0 ? N : 5
  const barReady = N > 0 ? reportCount : 5
  const pct      = Math.round((barReady / barTotal) * 100)

  const unansweredCount = result.recentReviews?.length ?? 0

  const reportChecklist = [
    {
      id:       'fiche',
      label:    'Rendre votre fiche convaincante',
      detail:   'Description professionnelle + services rédigés pour Google + FAQ de 20 questions/réponses',
      ready:    descReady,
      spinning: descSpinning,
    },
    {
      id:       'posts',
      label:    'Montrer que vous êtes actif',
      detail:   '12 publications + calendrier de diffusion sur 3 mois (1 par semaine)',
      ready:    postsReady,
      spinning: postsSpinning,
    },
    {
      id:       'photos',
      label:    'Savoir quelles photos publier',
      detail:   '20 idées de photos adaptées à votre métier, prêtes à shooter et à poster',
      ready:    true,
      spinning: false,
    },
    {
      id:       'confiance',
      label:    'Donner confiance avant le premier appel',
      detail:   unansweredCount > 0
        ? `${unansweredCount} réponse${unansweredCount > 1 ? 's' : ''} personnalisée${unansweredCount > 1 ? 's' : ''} + 30 modèles classés par situation + QR code d'avis + script SMS`
        : '30 modèles de réponses classés par situation + QR code d\'avis + script SMS',
      ready:    true,
      spinning: false,
    },
    {
      id:       'heures',
      label:    'Gagner plusieurs heures',
      detail:   "Guide de mise en ligne pas à pas + plan d'action personnalisé basé sur vos concurrents",
      ready:    true,
      spinning: false,
    },
  ]

  const titleLine2 =
    N === 0
      ? '5 groupes de solutions déjà prêts pour vous.'
      : reportCount === N
      ? `${N === 1 ? 'La solution est prête' : `Les ${N} solutions sont prêtes`}.`
      : `${reportCount} ${reportCount > 1 ? 'solutions incluses' : 'solution incluse'} dans le rapport — ${manualCount} action${manualCount > 1 ? 's' : ''} à faire vous-même.`

  return (
    <ScreenLayout step={4} totalSteps={6} onSkip={onSkip}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
        Travail déjà fait
      </p>

      <h2 className="text-xl font-bold text-gray-900 mb-1 leading-snug">
        {N > 0 ? (
          <>Nous avons identifié {N} point{N > 1 ? 's' : ''} à améliorer.</>
        ) : (
          <>Votre fiche est solide.</>
        )}
      </h2>
      <p className="text-xl font-bold text-[#16a34a] mb-5 leading-snug">
        {titleLine2}
      </p>

      {/* Barre — même dénominateur que le titre */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-gray-400">{barReady}/{barTotal} traités par le rapport</p>
          <p className="text-xs font-semibold text-[#16a34a]">{pct}%</p>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#16a34a] rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Livrables du rapport */}
      <div className={`space-y-3 ${needsHoraires ? 'mb-5' : 'mb-8'}`}>
        {reportChecklist.map(({ id, label, detail, ready, spinning }) => (
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

      {/* Recommandation manuelle — horaires uniquement, non inclus dans le rapport */}
      {needsHoraires && (
        <div className="mb-8">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide px-1 mb-2">
            A faire vous-même — gratuit
          </p>
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
            <span className="text-gray-300 font-bold shrink-0 mt-0.5 text-sm leading-none select-none">→</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-600">Renseigner vos horaires</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                À mettre à jour dans Google My Business — prend moins de 5 minutes.
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        className="w-full rounded-xl bg-gray-900 px-5 py-4 text-sm font-bold text-white hover:bg-gray-800 transition"
      >
        Voir ce que vous récupérez →
      </button>
    </ScreenLayout>
  )
}
