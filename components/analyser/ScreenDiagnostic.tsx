'use client'
import type { AnalysisResult } from './AnalyserFlow'
import ScreenLayout from './ScreenLayout'

interface Props {
  result: AnalysisResult
  onNext: () => void
}

function getFindings(result: AnalysisResult): string[] {
  const findings: string[] = []
  const topComp     = result.competitors?.[0] ?? null
  const topCompName = topComp?.name ?? null

  // 1. Unanswered reviews — ce que voit chaque visiteur
  if ((result.recentReviews?.length ?? 0) > 0) {
    const n = result.recentReviews.length
    findings.push(
      `${n} avis client${n > 1 ? 's sont restés' : ' est resté'} sans réponse — visible par chaque visiteur qui consulte votre fiche`
    )
  }

  // 2. No description — compréhension immédiate
  if (!result.criteria?.description) {
    findings.push(
      "La fiche ne contient pas de description — un visiteur ne comprend pas en quelques secondes ce que vous proposez"
    )
  }

  // 3. Few photos — confiance visuelle
  if (result.photos !== undefined && result.photos < 10) {
    findings.push(
      `${result.photos} photo${result.photos !== 1 ? 's' : ''} visible${result.photos !== 1 ? 's' : ''} sur la fiche — les fiches les plus cliquées dans votre secteur en ont entre 15 et 30`
    )
  }

  // 4. No recent activity (>3 months) — signe d'inactivité
  if (findings.length < 3 && !result.criteria?.recentReview) {
    findings.push(
      "Aucune activité récente sur la fiche — elle peut paraître abandonnée aux yeux d'un visiteur qui compare"
    )
  }

  // 5. Few reviews vs named competitor
  if (findings.length < 3 && result.reviews !== undefined && topComp && result.reviews < topComp.reviewCount) {
    const compLabel = topCompName ?? "le premier concurrent visible"
    findings.push(
      `${result.reviews} avis sur votre fiche, contre ${topComp.reviewCount} pour ${compLabel} à ${result.city}`
    )
  } else if (findings.length < 3 && result.reviews < 15) {
    findings.push(
      `${result.reviews} avis seulement — un visiteur qui hésite cherche souvent plus de preuves avant d'appeler`
    )
  }

  // 6. Competitor outranking (named if single)
  if (findings.length < 3) {
    const betterCount = (result.competitors ?? []).filter(c => c.estimatedScore > result.score).length
    if (betterCount > 0) {
      const label = topCompName && betterCount === 1
        ? `${topCompName} apparaît`
        : `${betterCount} concurrent${betterCount > 1 ? 's apparaissent' : ' apparaît'}`
      findings.push(`${label} avant vous dans les résultats à ${result.city} en ce moment`)
    }
  }

  // 7. Low rating
  if (findings.length < 3 && result.rating !== undefined && result.rating < 4.3) {
    findings.push(
      `Note de ${result.rating.toFixed(1)}/5 — quelques réponses aux avis récents peuvent la faire progresser`
    )
  }

  // Fallback minimal — évite la phrase vague "publications régulières..."
  if (findings.length < 3) {
    findings.push(
      "La fiche présente des marges de progression sur l'activité récente visible par les visiteurs"
    )
  }

  return findings.slice(0, 3)
}

export default function ScreenDiagnostic({ result, onNext }: Props) {
  const findings = getFindings(result)

  return (
    <ScreenLayout step={1} totalSteps={6}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
        Votre diagnostic est prêt
      </p>

      <h2 className="text-xl font-bold text-gray-900 mb-8 leading-snug">
        Voici ce qu&apos;un client voit aujourd&apos;hui en cherchant{' '}
        {result.category} à {result.city}
      </h2>

      <ol className="space-y-4 mb-10 list-none p-0">
        {findings.map((f, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="text-xs font-bold text-gray-300 mt-0.5 shrink-0 w-4">{i + 1}.</span>
            <p className="text-sm text-gray-700 leading-relaxed">{f}</p>
          </li>
        ))}
      </ol>

      <button
        onClick={onNext}
        className="w-full rounded-xl bg-gray-900 px-5 py-4 text-sm font-bold text-white hover:bg-gray-800 transition"
      >
        Comprendre ce que cela représente →
      </button>

      <p className="text-xs text-gray-300 mt-6 text-center leading-relaxed">
        Données issues de votre fiche Google publique
      </p>
    </ScreenLayout>
  )
}
