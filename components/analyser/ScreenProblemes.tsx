'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AnalysisResult } from './AnalyserFlow'
import ScreenLayout from './ScreenLayout'
import { getAuditGroups } from './auditGroups'

interface Props {
  result: AnalysisResult
  generatedDescription: string | null
  generatedReview: string | null
  generating: boolean
  onNext: () => void
  onSkip: () => void
}

interface Probleme {
  text: string
}

function getProblemes(result: AnalysisResult): Probleme[] {
  const items: Probleme[] = []
  const topComp    = result.competitors?.[0] ?? null
  const unanswered = result.recentReviews?.length ?? 0

  // 1. Avis sans réponse — angle comportemental (stat BrightLocal vérifiable)
  if (unanswered > 0) {
    items.push({
      text: `${unanswered} avis ${unanswered > 1 ? 'sont restés sans réponse' : 'est resté sans réponse'} — visible par chaque visiteur qui compare avant d'appeler. 1 visiteur sur 3 repart sans appeler face à un avis sans réponse (BrightLocal 2023).`,
    })
  }

  // 2. Concurrent nommé avec détails
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

  // 3. Horaires absents
  if (!result.criteria?.horaires) {
    items.push({
      text: "Vos horaires ne sont pas renseignés. Un client qui cherche en dehors des heures habituelles ne sait pas si vous êtes ouvert — il appelle ailleurs.",
    })
  }

  // 4. Activité récente
  if (!result.criteria?.recentReview && items.length < 4) {
    items.push({
      text: "Aucun avis ni activité récente depuis plus de 3 mois sur la fiche. Une fiche inactive perd progressivement sa position dans les résultats locaux.",
    })
  }

  // 5. Note basse
  if (result.rating < 4.3 && items.length < 4) {
    items.push({
      text: `Note de ${result.rating.toFixed(1)}/5 actuelle. Répondre aux avis — même les moins positifs — est le levier le plus rapide pour la faire progresser.`,
    })
  }

  // 6. Peu d'avis
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
  const problemes    = getProblemes(result)
  const previewText  = generatedReview || generatedDescription || null
  const previewLabel = generatedReview ? 'Aperçu — réponse à un avis' : 'Aperçu — description rédigée'
  const showPreview  = generating || !!previewText

  const [auditOpen, setAuditOpen] = useState(false)

  // Détail audit complet (optionnel)
  const groups   = getAuditGroups(result)
  const allItems = groups.flatMap(g => g.items)
  const okCount  = allItems.filter(i => i.ok).length
  const total    = allItems.length

  return (
    <>
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
              <span className="text-gray-700">{p.text}</span>
            </li>
          ))}
        </ul>

        {showPreview && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 mb-6">
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

        {/* Lien optionnel vers le détail complet */}
        <button
          onClick={() => setAuditOpen(true)}
          className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition block mb-6"
        >
          Voir le détail complet de l&apos;audit ({okCount}/{total} critères) →
        </button>

        <button
          onClick={onNext}
          className="w-full rounded-xl bg-gray-900 px-5 py-4 text-sm font-bold text-white hover:bg-gray-800 transition"
        >
          Voir ce que nous avons déjà préparé →
        </button>
      </ScreenLayout>

      {/* Bottom sheet — détail audit complet */}
      <AnimatePresence>
        {auditOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setAuditOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 flex justify-center"
            >
              <div className="bg-white rounded-t-2xl w-full max-w-[480px] max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
                  <p className="text-sm font-bold text-gray-900">
                    Audit complet — {okCount}/{total} critères validés
                  </p>
                  <button
                    onClick={() => setAuditOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition text-xl leading-none ml-4"
                    aria-label="Fermer"
                  >
                    &times;
                  </button>
                </div>
                <div className="overflow-y-auto px-5 py-4 space-y-5">
                  {groups.map(group => {
                    const groupOk   = group.items.filter(i => i.ok).length
                    const groupFail = group.items.length - groupOk
                    return (
                      <div key={group.title}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {group.title}
                          </p>
                          <p className={`text-xs font-medium ${
                            groupFail > 0 ? 'text-orange-400' : 'text-[#16a34a]'
                          }`}>
                            {groupOk}/{group.items.length}
                          </p>
                        </div>
                        <ul className="space-y-1.5">
                          {group.items.map((item, i) => (
                            <li key={i} className="flex items-center gap-2.5">
                              <span className={`shrink-0 text-xs font-bold leading-none w-3 ${
                                item.ok ? 'text-[#16a34a]' : 'text-orange-400'
                              }`}>
                                {item.ok ? '✓' : '✗'}
                              </span>
                              <span className={`text-sm leading-snug ${
                                item.ok ? 'text-gray-700' : 'text-gray-500'
                              }`}>
                                {item.label}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                  <div className="pb-6" />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
