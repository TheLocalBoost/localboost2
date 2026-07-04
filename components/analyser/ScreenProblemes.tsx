'use client'
import type { AnalysisResult } from './AnalyserFlow'
import ScreenLayout from './ScreenLayout'

interface Props {
  result: AnalysisResult
  generatedDescription: string | null
  generatedReview: string | null
  generating: boolean
  onNext: () => void
}

function getProblemes(result: AnalysisResult): string[] {
  const items: string[] = []

  if ((result.recentReviews?.length ?? 0) > 0) {
    const n = result.recentReviews.length
    items.push(
      `${n} avis ${n > 1 ? 'sont restés sans réponse' : 'est resté sans réponse'} — tout visiteur qui compare les fiches peut le remarquer`
    )
  }

  if (!result.criteria?.description) {
    items.push(
      "Pas de description — le visiteur ne comprend pas immédiatement ce que vous faites ni pourquoi vous appeler"
    )
  }

  if (result.photos !== undefined && result.photos < 10) {
    items.push(
      `${result.photos} photo${result.photos !== 1 ? 's' : ''} seulement — une fiche avec peu de photos convainc moins avant que le client décroche son téléphone`
    )
  }

  if (!result.criteria?.recentReview) {
    items.push(
      "Aucune publication récente — les fiches sans activité visible sont moins consultées"
    )
  }

  if (!result.criteria?.horaires) {
    items.push(
      "Horaires non renseignés — un client qui ne sait pas si vous êtes ouvert peut appeler ailleurs"
    )
  }

  const topComp = result.competitors?.[0]
  if (topComp && result.reviews < topComp.reviewCount) {
    items.push(
      `${result.reviews} avis contre ${topComp.reviewCount} pour le premier concurrent visible — le volume d'avis est un repère pour un client qui hésite`
    )
  } else if (!result.criteria?.avis20 && result.reviews < 20) {
    items.push(
      `${result.reviews} avis — un faible nombre peut freiner les clients qui cherchent des preuves avant d'appeler`
    )
  }

  return items.slice(0, 5)
}

export default function ScreenProblemes({
  result,
  generatedDescription,
  generatedReview,
  generating,
  onNext,
}: Props) {
  const problemes = getProblemes(result)

  const previewText   = generatedReview || generatedDescription || null
  const previewLabel  = generatedReview
    ? 'Aperçu — réponse à un avis'
    : 'Aperçu — description rédigée'
  const showPreview   = generating || !!previewText

  return (
    <ScreenLayout>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
        Bilan détaillé
      </p>

      <h2 className="text-xl font-bold text-gray-900 mb-6 leading-snug">
        Ce qui peut vous coûter des clients
      </h2>

      <ul className="space-y-3 mb-8">
        {problemes.map((p, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
            <span className="text-gray-300 shrink-0 mt-0.5 font-bold select-none">—</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>

      {showPreview && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {generating && !previewText ? 'Préparation en cours...' : previewLabel}
          </p>
          {generating && !previewText ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-4/5" />
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 italic">
                {previewText}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                1 des 30 modèles — le reste dans le rapport complet
              </p>
            </>
          )}
        </div>
      )}

      <button
        onClick={onNext}
        className="w-full rounded-xl bg-gray-900 px-5 py-4 text-sm font-bold text-white hover:bg-gray-800 transition"
      >
        Voir ce que nous avons déjà préparé →
      </button>
    </ScreenLayout>
  )
}
