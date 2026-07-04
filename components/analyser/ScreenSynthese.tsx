'use client'
import type { AnalysisResult } from './AnalyserFlow'
import ScreenLayout from './ScreenLayout'

interface Props {
  result: AnalysisResult
  onNext: () => void
}

interface Fact {
  text: string
  cta: string
}

function getFact(result: AnalysisResult): Fact {
  // 1. Avis sans réponse — le plus visible pour les prospects
  if (result.recentReviews?.length > 0) {
    const n = result.recentReviews.length
    const times = result.recentReviews.map(r => Number(r.time)).filter(t => t > 0)
    const oldest = times.length > 0 ? Math.min(...times) : null
    const monthsAgo = oldest ? Math.floor((Date.now() / 1000 - oldest) / (30 * 86400)) : null
    const age = monthsAgo && monthsAgo >= 1 ? ` — le plus ancien remonte à ${monthsAgo} mois` : ''
    return {
      text: `${n} client${n > 1 ? 's ont' : ' a'} laissé un avis sans recevoir de réponse${age} — visible par tous vos prochains visiteurs.`,
      cta: 'Voir les réponses préparées →',
    }
  }

  // 2. Aucune description
  if (result.criteria && !result.criteria.description) {
    return {
      text: `Votre fiche n'a pas de description — un visiteur ne sait pas en une seconde ce que vous proposez.`,
      cta: 'Voir la description rédigée →',
    }
  }

  // 3. Peu de photos
  if (result.photos !== undefined && result.photos < 10) {
    return {
      text: `Votre fiche ne compte que ${result.photos} photo${result.photos !== 1 ? 's' : ''} — les fiches les plus consultées de votre secteur en ont entre 15 et 30.`,
      cta: 'Voir ce qui a été préparé →',
    }
  }

  // 4. Peu d'avis
  if (result.reviews !== undefined && result.reviews < 30) {
    return {
      text: `Votre fiche compte ${result.reviews} avis — moins que vos principaux concurrents à ${result.city}.`,
      cta: "Voir le plan d'action →",
    }
  }

  // 5. Note perfectible
  if (result.rating !== undefined && result.rating < 4.3) {
    return {
      text: `Votre note est de ${result.rating.toFixed(1)}/5 — répondre aux avis récents peut l'améliorer rapidement.`,
      cta: 'Voir les réponses préparées →',
    }
  }

  // 6. Concurrents mieux positionnés (toujours calculable)
  const betterCount = (result.competitors ?? []).filter(c => c.estimatedScore > result.score).length
  if (betterCount > 0) {
    return {
      text: `${betterCount} concurrent${betterCount > 1 ? 's sont' : ' est'} mieux positionné${betterCount > 1 ? 's' : ''} que vous sur Google Maps à ${result.city} en ce moment.`,
      cta: 'Voir ce qui change la position →',
    }
  }

  // 7. Fallback (fiche objectivement bonne — rare)
  return {
    text: `Votre fiche est bien renseignée. Des publications régulières peuvent encore vous faire gagner des positions à ${result.city}.`,
    cta: 'Voir les publications préparées →',
  }
}

export default function ScreenSynthese({ result, onNext }: Props) {
  const fact = getFact(result)

  return (
    <ScreenLayout>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8">
        Analyse terminée
      </p>

      <h1 className="text-2xl font-bold text-gray-900 mb-10 leading-snug">
        {result.name} est référencé sur Google.
      </h1>

      <p className="text-xl font-bold text-gray-900 leading-snug mb-12">
        {fact.text}
      </p>

      <button
        onClick={onNext}
        className="w-full rounded-xl bg-gray-900 px-5 py-4 text-sm font-bold text-white hover:bg-gray-800 transition"
      >
        {fact.cta}
      </button>

      <p className="text-xs text-gray-300 mt-8 leading-relaxed">
        Analyse basée sur les données publiques de votre fiche Google
        {result.competitors.length > 0
          ? ` et de ${result.competitors.length} concurrent${result.competitors.length > 1 ? 's' : ''} ${result.competitors.length > 1 ? 'locaux' : 'local'} à ${result.city}`
          : ''}.
      </p>
    </ScreenLayout>
  )
}
