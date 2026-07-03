'use client'
import type { AnalysisResult } from './AnalyserFlow'
import ScreenLayout from './ScreenLayout'
import { ds } from './ds'

interface Props {
  result: AnalysisResult
  onNext: () => void
}

const AXES = [
  { key: 'found',         label: 'Visibilité' },
  { key: 'trust',         label: 'Confiance' },
  { key: 'desire',        label: 'Attractivité' },
  { key: 'activity',      label: 'Activité' },
  { key: 'vsCompetitors', label: 'Vs concurrents' },
] as const

function AxisBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, value * 10))
  const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626'
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xs font-semibold text-gray-700">{value}/10</p>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export default function ScreenSynthese({ result, onNext }: Props) {
  const improvementCount = result.problems.length + (!result.criteria.description ? 1 : 0)
  const plural = improvementCount > 1
  const scores = result.commercialScores

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

      {scores && (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 mb-6 space-y-3">
          {AXES.map(({ key, label }) => (
            <AxisBar key={key} label={label} value={scores[key]} />
          ))}
        </div>
      )}

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
