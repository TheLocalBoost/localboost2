'use client'
import type { AnalysisResult } from './AnalyserFlow'
import ScreenLayout from './ScreenLayout'
import { ds } from './ds'

interface Props {
  result: AnalysisResult
  onNext: () => void
}

export default function ScreenSynthese({ result, onNext }: Props) {
  const improvementCount =
    result.problems.length + (!result.criteria.description ? 1 : 0)

  const plural = improvementCount > 1

  return (
    <ScreenLayout>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
        Analyse terminée
      </p>

      <h1 className="text-2xl font-bold text-gray-900 mb-6 leading-snug">
        Votre établissement est référencé sur Google.
      </h1>

      <div className={`${ds.signature} mb-6`}>
        <p className="text-base text-gray-700 leading-relaxed">
          Notre analyse a identifié{' '}
          <span className="font-bold text-gray-900">
            {improvementCount} point{plural ? 's' : ''}{' '}
            d&apos;amélioration
          </span>{' '}
          sur la fiche de {result.name}. Un rapport personnalisé a été généré.
        </p>
      </div>

      <p className="text-sm text-gray-400 mb-10">
        {result.competitors.length} établissement
        {result.competitors.length > 1 ? 's' : ''} analysé
        {result.competitors.length > 1 ? 's' : ''} dans votre secteur à {result.city}.
      </p>

      <button
        onClick={onNext}
        className="w-full rounded-xl bg-gray-900 px-5 py-4 text-sm font-bold text-white hover:bg-gray-800 transition"
      >
        Voir le rapport →
      </button>
    </ScreenLayout>
  )
}
