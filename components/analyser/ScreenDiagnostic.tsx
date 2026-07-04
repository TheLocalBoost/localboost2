'use client'
import type { AnalysisResult } from './AnalyserFlow'
import ScreenLayout from './ScreenLayout'

interface Props {
  result: AnalysisResult
  onNext: () => void
}

function getFindings(result: AnalysisResult): string[] {
  const findings: string[] = []

  if ((result.recentReviews?.length ?? 0) > 0) {
    const n = result.recentReviews.length
    findings.push(
      `${n} avis client${n > 1 ? 's sont restés' : ' est resté'} sans réponse — chaque visiteur qui consulte votre fiche peut le voir`
    )
  }

  if (!result.criteria?.description) {
    findings.push(
      "La fiche ne contient pas de description — un visiteur ne comprend pas en quelques secondes ce que vous proposez"
    )
  }

  if (result.photos !== undefined && result.photos < 10) {
    findings.push(
      `${result.photos} photo${result.photos !== 1 ? 's' : ''} visible${result.photos !== 1 ? 's' : ''} sur la fiche — les fiches les plus cliquées dans votre secteur en ont entre 15 et 30`
    )
  }

  if (findings.length < 3 && !result.criteria?.recentReview) {
    findings.push(
      "Aucune activité récente visible sur la fiche — elle peut paraître abandonnée aux yeux d'un visiteur qui compare"
    )
  }

  if (findings.length < 3 && result.reviews !== undefined) {
    const topComp = result.competitors?.[0]
    if (topComp && result.reviews < topComp.reviewCount) {
      findings.push(
        `${result.reviews} avis affichés contre ${topComp.reviewCount} pour le premier concurrent visible à ${result.city}`
      )
    } else if (result.reviews < 15) {
      findings.push(
        `${result.reviews} avis seulement — un visiteur qui hésite cherche souvent plus de preuves avant d'appeler`
      )
    }
  }

  if (findings.length < 3) {
    const betterCount = (result.competitors ?? []).filter(c => c.estimatedScore > result.score).length
    if (betterCount > 0) {
      findings.push(
        `${betterCount} concurrent${betterCount > 1 ? 's apparaissent' : ' apparaît'} avant vous dans les résultats à ${result.city} en ce moment`
      )
    }
  }

  if (findings.length < 3 && result.rating !== undefined && result.rating < 4.3) {
    findings.push(
      `Note de ${result.rating.toFixed(1)}/5 — quelques réponses aux avis récents peuvent la faire progresser`
    )
  }

  if (findings.length < 3) {
    findings.push(
      "Des publications régulières peuvent encore améliorer la visibilité de la fiche sur Google Maps"
    )
  }

  return findings.slice(0, 3)
}

export default function ScreenDiagnostic({ result, onNext }: Props) {
  const findings = getFindings(result)

  return (
    <ScreenLayout>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8">
        Bilan terminé
      </p>

      <h2 className="text-xl font-bold text-gray-900 mb-8 leading-snug">
        Voici ce qu&apos;un client voit en cherchant{' '}
        {result.category} à {result.city}
      </h2>

      <ol className="space-y-4 mb-10 list-none p-0">
        {findings.map((f, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="text-xs font-bold text-gray-300 mt-0.5 shrink-0">{i + 1}.</span>
            <p className="text-sm text-gray-700 leading-relaxed">{f}</p>
          </li>
        ))}
      </ol>

      <button
        onClick={onNext}
        className="w-full rounded-xl bg-gray-900 px-5 py-4 text-sm font-bold text-white hover:bg-gray-800 transition"
      >
        Voir ce que nous avons préparé →
      </button>

      <p className="text-xs text-gray-300 mt-6 text-center leading-relaxed">
        Données issues de votre fiche Google publique
      </p>
    </ScreenLayout>
  )
}
