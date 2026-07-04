'use client'
import type { AnalysisResult } from './AnalyserFlow'
import ScreenLayout from './ScreenLayout'

interface Props {
  result: AnalysisResult
  onNext: () => void
}

function getConcreteAlert(result: AnalysisResult): string | null {
  // Unanswered recent reviews — most visible problem for prospects
  if (result.recentReviews?.length > 0) {
    const count = result.recentReviews.length
    const times = result.recentReviews
      .map(r => Number(r.time))
      .filter(t => t > 0)
    const oldest = times.length > 0 ? Math.min(...times) : null
    const monthsAgo = oldest
      ? Math.floor((Date.now() / 1000 - oldest) / (30 * 86400))
      : null
    if (monthsAgo !== null && monthsAgo >= 1) {
      return `${count} avis récent${count > 1 ? 's' : ''} sans réponse — le plus ancien date d'il y a ${monthsAgo} mois`
    }
    return `${count} avis récent${count > 1 ? 's' : ''} sans réponse sur votre fiche — visible de tous vos visiteurs`
  }

  // No description
  if (result.criteria && !result.criteria.description) {
    return "Votre fiche n'a pas de description — vos visiteurs ne savent pas ce que vous proposez"
  }

  // Very few photos
  if (result.photos !== undefined && result.photos < 5) {
    return `Votre fiche ne compte que ${result.photos} photo${result.photos !== 1 ? 's' : ''}`
  }

  // Low review count
  if (result.reviews !== undefined && result.reviews < 20) {
    return `Votre fiche compte seulement ${result.reviews} avis Google`
  }

  return null
}

export default function ScreenSynthese({ result, onNext }: Props) {
  const improvementCount = result.problems.length + (!result.criteria?.description ? 1 : 0)
  const plural = improvementCount > 1
  const alert = getConcreteAlert(result)

  return (
    <ScreenLayout>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
        Analyse terminée
      </p>

      <h1 className="text-2xl font-bold text-gray-900 mb-6 leading-snug">
        {result.name} est référencé sur Google.
      </h1>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center">
          <span className="text-2xl font-extrabold text-white">{result.score}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">Score sur 100</p>
          <p className="text-xs text-gray-400">
            {improvementCount} point{plural ? 's' : ''} d'amélioration identifié{plural ? 's' : ''}
          </p>
        </div>
      </div>

      {alert && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 mb-6">
          <p className="text-sm font-semibold text-amber-900 leading-snug">{alert}</p>
        </div>
      )}

      <p className="text-sm text-gray-400 mb-10">
        Analyse basée sur les données publiques de votre fiche Google et de{' '}
        {result.competitors.length} concurrent{result.competitors.length > 1 ? 's' : ''}{' '}
        {result.competitors.length > 1 ? 'locaux' : 'local'} à {result.city}.
      </p>

      <button
        onClick={onNext}
        className="w-full rounded-xl bg-gray-900 px-5 py-4 text-sm font-bold text-white hover:bg-gray-800 transition"
      >
        Voir ce qui a été préparé →
      </button>
    </ScreenLayout>
  )
}
