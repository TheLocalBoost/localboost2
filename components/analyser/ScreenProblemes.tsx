'use client'
import type { AnalysisResult } from './AnalyserFlow'
import ScreenLayout from './ScreenLayout'

interface Props {
  result: AnalysisResult
  generatedDescription: string | null
  generatedReview: string | null
  generating: boolean
  onNext: () => void
  onSkip: () => void
}

// Mirrored from backend PANIER_MOYEN
// Sources : FIDUCIAL 2025 (boulanger), Travaux.com 2025 (plombier),
// Depanneo 2024 (electricien), Esprit-Coiffure 2024 (coiffeur),
// idGarages 2024 (garagiste), FIDUCIAL 2024 (restaurant)
const PANIER_MOYEN: Record<string, number> = {
  plombier: 200, electricien: 180, coiffeur: 55, boulanger: 75,
  restaurateur: 70, garagiste: 300, serrurier: 150, kine: 70,
  dentiste: 150, medecin: 80, pharmacie: 40, hotel: 100,
  fleuriste: 55, opticien: 200, artisan: 150, peintre: 180, carreleur: 200,
}

interface Probleme {
  text: string
  impact?: string
}

function getProblemes(result: AnalysisResult): Probleme[] {
  const items: Probleme[] = []
  const topComp   = result.competitors?.[0] ?? null
  const unanswered = result.recentReviews?.length ?? 0
  const panier    = PANIER_MOYEN[result.category] ?? 150

  // 1. Impact financier des avis sans réponse — angle DIFFÉRENT de l'écran Diagnostic
  // (Diagnostic montrait la visibilité ; ici on chiffre l'impact potentiel)
  if (unanswered > 0) {
    const impact = unanswered * panier
    items.push({
      text: `${unanswered} avis ${unanswered > 1 ? 'sont restés sans réponse' : 'est resté sans réponse'}. Sur un panier moyen estimé à ${panier}€ dans votre secteur,`,
      impact: `jusqu'à ${impact}€ de manque à gagner potentiel.`,
    })
  }

  // 2. Concurrent nommé avec détails (plus précis que la position seule de l'écran 1)
  if (topComp && topComp.estimatedScore > result.score) {
    const ratingWorse = topComp.rating > result.rating
    const reviewWorse = topComp.reviewCount > result.reviews
    items.push({
      text: ratingWorse
        ? `${topComp.name} (${topComp.rating.toFixed(1)}★, ${topComp.reviewCount} avis) apparaît avant vous avec une note plus élevée à ${result.city}.`
        : reviewWorse
        ? `${topComp.name} (${topComp.reviewCount} avis) apparaît avant vous sur Google Maps à ${result.city}.`
        : `${topComp.name} est mieux positionné que vous sur Google Maps à ${result.city}.`,
    })
  }

  // 3. Horaires — axe opérationnel, non présent à l'écran Diagnostic
  if (!result.criteria?.horaires) {
    items.push({
      text: "Vos horaires ne sont pas renseignés. Un client qui cherche en dehors des heures habituelles ne sait pas si vous êtes ouvert — il appelle ailleurs.",
    })
  }

  // 4. No recent activity — framing différent (perte de position vs apparence inactive)
  if (!result.criteria?.recentReview && items.length < 4) {
    items.push({
      text: "Aucun avis ni activité récente depuis plus de 3 mois sur la fiche. Une fiche inactive perd progressivement sa visibilité dans les résultats locaux.",
    })
  }

  // 5. Note basse — angle levier (pas répété si déjà dans Diagnostic)
  if (result.rating < 4.3 && items.length < 4) {
    items.push({
      text: `Note de ${result.rating.toFixed(1)}/5 actuelle. Répondre aux avis — même les moins positifs — est le levier le plus rapide pour l'améliorer.`,
    })
  }

  // 6. Peu d'avis en valeur absolue
  if (!result.criteria?.avis20 && result.reviews < 20 && items.length < 4) {
    items.push({
      text: `${result.reviews} avis au total. En dessous de 20, un client qui hésite dispose de peu de preuves pour se décider à vous appeler.`,
    })
  }

  return items.slice(0, 5)
}

export default function ScreenProblemes({
  result,
  generatedDescription,
  generatedReview,
  generating,
  onNext,
  onSkip,
}: Props) {
  const problemes   = getProblemes(result)
  const previewText = generatedReview || generatedDescription || null
  const previewLabel = generatedReview ? 'Aperçu — réponse à un avis' : 'Aperçu — description rédigée'
  const showPreview = generating || !!previewText

  return (
    <ScreenLayout step={3} totalSteps={6} onSkip={onSkip}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
        Bilan détaillé
      </p>

      <h2 className="text-xl font-bold text-gray-900 mb-6 leading-snug">
        Ce qui peut vous coûter des clients
      </h2>

      <ul className="space-y-3 mb-8">
        {problemes.map((p, i) => (
          <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
            <span className="text-gray-300 shrink-0 mt-0.5 font-bold select-none">—</span>
            <span className="text-gray-700">
              {p.text}
              {p.impact && (
                <span className="block mt-0.5 font-semibold text-gray-900">{p.impact}</span>
              )}
            </span>
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
