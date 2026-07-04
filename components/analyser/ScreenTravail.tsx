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
}

function countIssues(result: AnalysisResult): number {
  let n = 0
  if (!result.criteria?.description)  n++
  if (!result.criteria?.photos)       n++
  if (!result.criteria?.recentReview) n++
  if (!result.criteria?.horaires)     n++
  if (!result.criteria?.avis20)       n++
  if ((result.recentReviews?.length ?? 0) > 0) n++
  return n
}

export default function ScreenTravail({
  result,
  generatedDescription,
  generatedPosts,
  generatedReview,
  generating,
  onNext,
}: Props) {
  // BACKEND GAP : le statut "Prêt" devrait être vérifié en base par place_id
  // (contenu stocké après génération). Pour l'instant, basé sur l'état in-session.
  // Quand generating=false, on considère tout prêt (le pack inclut toujours les 4 éléments).
  const descSpinning    = generating && !generatedDescription
  const postsSpinning   = generating && generatedPosts.length === 0
  const descReady       = !generating || !!generatedDescription
  const postsReady      = !generating || generatedPosts.length > 0
  const repliesReady    = true // 30 modèles toujours inclus
  const contactReady    = true // QR code + script SMS toujours inclus

  const readyCount = [descReady, postsReady, repliesReady, contactReady].filter(Boolean).length
  const N = countIssues(result)

  const unansweredCount = result.recentReviews?.length ?? 0

  const checklist = [
    {
      id:      'description',
      label:   'Expliquer votre activité',
      detail:  'Description Google rédigée pour votre métier et votre ville',
      ready:   descReady,
      spinning: descSpinning,
    },
    {
      id:      'posts',
      label:   'Montrer que vous êtes actif',
      detail:  '12 publications prêtes à poster sur votre fiche (3 mois)',
      ready:   postsReady,
      spinning: postsSpinning,
    },
    {
      id:      'replies',
      label:   'Répondre à vos avis',
      detail:  unansweredCount > 0
        ? `${unansweredCount} réponse${unansweredCount > 1 ? 's' : ''} personnalisée${unansweredCount > 1 ? 's' : ''} + 30 modèles pour les prochains avis`
        : '30 modèles de réponses pour tous vos avis clients',
      ready:   repliesReady,
      spinning: false,
    },
    {
      id:      'contact',
      label:   'Donner envie de vous contacter',
      detail:  "QR code de collecte d'avis + script de relance SMS",
      ready:   contactReady,
      spinning: false,
    },
  ]

  return (
    <ScreenLayout>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
        Travail déjà fait
      </p>

      <h2 className="text-xl font-bold text-gray-900 mb-8 leading-snug">
        {N > 0 ? (
          <>
            Nous avons trouvé {N} point{N > 1 ? 's' : ''} à améliorer.{' '}
            <span className="text-[#16a34a]">
              {readyCount} {readyCount > 1 ? 'sont déjà prêts' : 'est déjà prêt'}.
            </span>
          </>
        ) : (
          <>
            Votre fiche est solide.{' '}
            <span className="text-[#16a34a]">Voici ce que nous avons préparé.</span>
          </>
        )}
      </h2>

      <div className="space-y-3 mb-10">
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
