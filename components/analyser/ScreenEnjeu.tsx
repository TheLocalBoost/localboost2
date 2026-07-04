'use client'
import type { AnalysisResult } from './AnalyserFlow'
import ScreenLayout from './ScreenLayout'

interface Props {
  result: AnalysisResult
  onNext: () => void
}

export default function ScreenEnjeu({ result, onNext }: Props) {
  const comp = result.competitors[0] ?? null

  // Estimated position: how many competitors outrank us
  const betterCount = result.competitors.filter(c => c.estimatedScore > result.score).length
  const myPosition = betterCount + 1

  // Rows where we have real data for both sides
  interface CompRow { label: string; you: string; comp: string; youWorse: boolean }
  const compRows: CompRow[] = []

  if (comp) {
    if (result.rating !== undefined && comp.rating !== undefined) {
      compRows.push({
        label: 'Note Google',
        you: `${result.rating.toFixed(1)}/5`,
        comp: `${comp.rating.toFixed(1)}/5`,
        youWorse: result.rating < comp.rating,
      })
    }
    if (result.reviews !== undefined && comp.reviewCount !== undefined) {
      compRows.push({
        label: 'Nombre d\'avis',
        you: String(result.reviews),
        comp: String(comp.reviewCount),
        youWorse: result.reviews < comp.reviewCount,
      })
    }
  }

  // Deficits visible only on your side
  const deficits: string[] = []
  if (result.recentReviews?.length > 0) {
    const count = result.recentReviews.length
    deficits.push(`${count} avis récent${count > 1 ? 's' : ''} sans réponse`)
  }
  if (result.photos !== undefined && result.photos < 5) {
    deficits.push(`${result.photos} photo${result.photos !== 1 ? 's' : ''} seulement`)
  }
  if (result.criteria && !result.criteria.description) {
    deficits.push('Aucune description rédigée')
  }

  return (
    <ScreenLayout>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
        Ce qui est en jeu
      </p>

      <h2 className="text-xl font-bold text-gray-900 mb-6 leading-snug">
        Ce que voient vos prochains clients en comparant les fiches
      </h2>

      {comp && compRows.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white mb-5 overflow-hidden">
          <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 px-4 py-2">
            <p className="text-xs text-gray-400" />
            <p className="text-xs font-bold text-gray-700 text-center">Vous</p>
            <p className="text-xs font-semibold text-gray-400 text-center truncate">{comp.name}</p>
          </div>

          {compRows.map(row => (
            <div
              key={row.label}
              className="grid grid-cols-3 px-4 py-3 border-b border-gray-100 last:border-0 items-center"
            >
              <p className="text-xs text-gray-500">{row.label}</p>
              <p className={`text-sm font-bold text-center ${row.youWorse ? 'text-red-600' : 'text-gray-900'}`}>
                {row.you}
              </p>
              <p className="text-sm font-semibold text-gray-700 text-center">{row.comp}</p>
            </div>
          ))}

          {myPosition > 1 && (
            <div className="grid grid-cols-3 px-4 py-3 items-center">
              <p className="text-xs text-gray-500">Position estimée</p>
              <p className="text-sm font-bold text-red-600 text-center">#{myPosition}</p>
              <p className="text-sm font-semibold text-gray-700 text-center">#1</p>
            </div>
          )}
        </div>
      )}

      {deficits.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 mb-8">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">
            Sur votre fiche
          </p>
          <ul className="space-y-1.5">
            {deficits.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                <span className="font-bold shrink-0 mt-0.5">—</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!comp && deficits.length === 0 && (
        <p className="text-sm text-gray-500 mb-8">
          Sur mobile, Google Maps n&apos;affiche que 3 résultats. La position dépend
          de l&apos;activité récente de chaque fiche.
        </p>
      )}

      <button
        onClick={onNext}
        className="w-full rounded-xl bg-gray-900 px-5 py-4 text-sm font-bold text-white hover:bg-gray-800 transition"
      >
        Personnaliser mon rapport →
      </button>
    </ScreenLayout>
  )
}
