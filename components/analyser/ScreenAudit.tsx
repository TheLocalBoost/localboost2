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

const INTERVAL_MS = 110

export default function ScreenAudit({ result, onNext, onSkip }: Props) {
  const groups    = getAuditGroups(result)
  const allItems  = groups.flatMap(g => g.items)
  const total     = allItems.length
  const okCount   = allItems.filter(i => i.ok).length
  const failCount = total - okCount

  const [revealed, setRevealed] = useState(0)
  const [done, setDone]         = useState(false)
  const scrollRef                = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setInterval(() => {
      setRevealed(prev => {
        const next = prev + 1
        if (next >= total) {
          clearInterval(id)
          setTimeout(() => setDone(true), 350)
          return total
        }
        return next
      })
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [total])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [revealed])

  function fastForward() {
    setRevealed(total)
    setDone(true)
  }

  return (
    <ScreenLayout step={1} totalSteps={6} onSkip={onSkip} centered={false}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
        {done ? 'Vérification terminée' : 'Vérification en cours'}
      </p>

      {/* Scrollable list — hauteur fixe, scroll interne */}
      <div
        ref={scrollRef}
        className="h-56 overflow-y-auto mb-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="space-y-2 pr-1">
          {allItems.slice(0, revealed).map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.12 }}
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

      {/* Barre de progression — disparaît une fois terminé */}
      <AnimatePresence>
        {!done && (
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-6"
          >
            <div className="h-0.5 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-[#16a34a] rounded-full transition-all duration-100"
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
        )}
      </AnimatePresence>

      {/* Résumé + bouton — apparaît à la fin de l'animation */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 mb-6">
              <p className="text-sm font-bold text-gray-900">
                {okCount} critères sur {total} déjà en ordre.
              </p>
              {failCount > 0 ? (
                <p className="text-sm text-gray-500 mt-1">
                  {failCount} point{failCount > 1 ? 's' : ''} à améliorer — le rapport traite les plus impactants.
                </p>
              ) : (
                <p className="text-sm text-[#16a34a] font-medium mt-1">
                  Fiche complète — votre diagnostic confirme la situation.
                </p>
              )}
            </div>

            <button
              onClick={onNext}
              className="w-full rounded-xl bg-gray-900 px-5 py-4 text-sm font-bold text-white hover:bg-gray-800 transition"
            >
              Voir votre diagnostic →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </ScreenLayout>
  )
}
