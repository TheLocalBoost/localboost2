'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AnalysisResult } from './AnalyserFlow'
import ScreenLayout from './ScreenLayout'
import { getAuditGroups } from './auditGroups'

interface Props {
  result: AnalysisResult
  onNext: () => void
  onSkip: () => void
}

const ANIM_INTERVAL_MS = 75

function getProblemes(result: AnalysisResult): string[] {
  const items: string[] = []
  const c          = result.criteria ?? {}
  const unanswered = result.recentReviews?.length ?? 0
  const topComp    = result.competitors?.[0] ?? null
  const photos     = result.photos ?? 0
  const rating     = result.rating ?? 0
  const reviews    = result.reviews ?? 0

  if (!c.telephone) {
    items.push("Aucun numéro de téléphone sur votre fiche — les clients ne peuvent pas vous appeler directement depuis Google Maps.")
  }

  if (unanswered > 0) {
    items.push(
      `${unanswered} avis ${unanswered > 1 ? 'sont restés sans réponse' : 'est resté sans réponse'} — visible par chaque visiteur. 1 visiteur sur 3 repart sans appeler face à un avis sans réponse (BrightLocal 2023).`
    )
  }

  if (c.avisNegatifs === false && items.length < 5) {
    items.push("Des avis 1 ou 2 étoiles apparaissent sans réponse du propriétaire — premier signal négatif vu par chaque visiteur.")
  }

  if (!c.description && items.length < 5) {
    items.push("Votre fiche n'a pas de description — un visiteur ne comprend pas ce que vous proposez en quelques secondes.")
  } else if (c.description && c.descriptionOk === false && items.length < 5) {
    items.push(`La description ne mentionne pas votre ville — Google associe moins précisément votre fiche aux recherches locales à ${result.city}.`)
  }

  if (!c.horaires && items.length < 5) {
    items.push("Vos horaires ne sont pas renseignés. Un client qui cherche à 19h ne sait pas si vous êtes ouvert — il appelle ailleurs.")
  }

  if (!c.recentReview && items.length < 5) {
    items.push("Aucune activité récente sur la fiche. Google la considère inactive et la relègue après les concurrents actifs.")
  }

  if (rating < 4.0 && items.length < 5) {
    items.push(`Note de ${rating.toFixed(1)}/5 — en dessous de 4,0, une grande partie des visiteurs choisissent directement un concurrent mieux noté.`)
  }

  if (photos < 10 && items.length < 5) {
    items.push(`${photos} photo${photos !== 1 ? 's' : ''} sur la fiche — les fiches les plus cliquées de votre secteur en ont entre 15 et 30.`)
  }

  if (reviews < 20 && items.length < 5) {
    items.push(`${reviews} avis au total. En dessous de 20, un client qui hésite dispose de peu de preuves pour se décider à vous appeler.`)
  }

  if (topComp && topComp.estimatedScore > result.score && items.length < 5) {
    const ratingWorse = topComp.rating > rating
    const reviewWorse = topComp.reviewCount > reviews
    items.push(
      ratingWorse
        ? `${topComp.name} (${topComp.rating.toFixed(1)}★, ${topComp.reviewCount} avis) apparaît avant vous avec une note plus élevée à ${result.city}.`
        : reviewWorse
        ? `${topComp.name} (${topComp.reviewCount} avis) apparaît avant vous sur Google Maps à ${result.city}.`
        : `${topComp.name} est mieux positionné que vous sur Google Maps à ${result.city}.`
    )
  }

  if (rating >= 4.0 && rating < 4.3 && items.length < 5) {
    items.push(`Note de ${rating.toFixed(1)}/5 — répondre aux avis récents est le levier le plus rapide pour la faire progresser.`)
  }

  if (!c.site && items.length < 5) {
    items.push("Aucun site web lié à votre fiche — les concurrents qui en ont un paraissent plus établis.")
  }

  return items.slice(0, 5)
}

export default function ScreenProblemes({ result, onNext, onSkip }: Props) {
  const groups   = getAuditGroups(result)
  const allItems = groups.flatMap(g => g.items)
  const total    = allItems.length
  const okCount  = allItems.filter(i => i.ok).length

  const [phase, setPhase]       = useState<'animating' | 'content'>('animating')
  const [revealed, setRevealed] = useState(0)
  const [auditOpen, setAuditOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const problemes = getProblemes(result)

  useEffect(() => {
    const id = setInterval(() => {
      setRevealed(prev => {
        const next = prev + 1
        if (next >= total) {
          clearInterval(id)
          setTimeout(() => setPhase('content'), 300)
          return total
        }
        return next
      })
    }, ANIM_INTERVAL_MS)
    return () => clearInterval(id)
  }, [total])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [revealed])

  function fastForward() {
    setRevealed(total)
    setPhase('content')
  }

  return (
    <>
      <ScreenLayout step={1} totalSteps={5} onSkip={phase === 'content' ? onSkip : undefined} centered={false}>
        <AnimatePresence mode="wait">
          {phase === 'animating' ? (
            <motion.div key="anim" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
                Vérification en cours
              </p>
              <h2 className="text-lg font-bold text-gray-900 mb-5 leading-snug">
                Vérification de la fiche de {result.name} ({result.city})...
              </h2>

              <div ref={scrollRef} className="h-52 overflow-y-auto mb-4" style={{ scrollBehavior: 'smooth' }}>
                <div className="space-y-2 pr-1">
                  {allItems.slice(0, revealed).map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.1 }}
                      className="flex items-center gap-2.5"
                    >
                      <span className={`shrink-0 text-xs font-bold leading-none w-3 ${
                        item.ok ? 'text-[#16a34a]' : 'text-orange-400'
                      }`}>
                        {item.ok ? '✓' : '✗'}
                      </span>
                      <span className={`text-sm leading-snug ${
                        item.ok ? 'text-gray-700' : 'text-gray-400'
                      }`}>
                        {item.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="h-0.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-[#16a34a] rounded-full transition-all duration-75"
                  style={{ width: `${Math.round((revealed / total) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{revealed} / {total} critères vérifiés</p>
                <button
                  onClick={fastForward}
                  className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition"
                >
                  Passer
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
                Bilan détaillé
              </p>

              <h2 className="text-xl font-bold text-gray-900 mb-6 leading-snug">
                Ce qui peut vous coûter des clients
              </h2>

              {problemes.length > 0 ? (
                <ul className="space-y-3 mb-6">
                  {problemes.map((p, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                      <span className="text-gray-300 shrink-0 mt-0.5 font-bold select-none">—</span>
                      <span className="text-gray-700">{p}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-xl border border-[#16a34a] bg-[#f0fdf4] px-4 py-4 mb-6">
                  <p className="text-sm font-bold text-[#16a34a]">
                    {okCount} critères sur {total} déjà en ordre.
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Fiche solide — votre diagnostic confirme la situation.
                  </p>
                </div>
              )}

              {result.lostCalls > 0 && (
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  Ces signaux représentent environ{' '}
                  <span className="font-bold text-gray-900">~{result.lostCalls} appels potentiels manqués ce mois-ci</span>.
                  Chaque appel peut représenter jusqu&apos;à{' '}
                  <span className="font-bold text-gray-900">
                    {Math.round(result.lostRevenue / result.lostCalls)} € de panier moyen
                  </span>{' '}
                  dans votre secteur.
                </p>
              )}

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
                Voir combien de temps cela représente →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </ScreenLayout>

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
                          <p className={`text-xs font-medium ${groupFail > 0 ? 'text-orange-400' : 'text-[#16a34a]'}`}>
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
