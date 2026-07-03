'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AnalysisResult } from './AnalyserFlow'
import ScreenLayout from './ScreenLayout'

interface Props {
  result: AnalysisResult
  generatedDescription: string | null
  generatedPosts: string[]
  generatedReview: string | null
  onNext: () => void
  totalElements: number
}

const DELIVERABLES = [
  'Description Google optimisée (1)',
  '12 publications prêtes à poster (3 mois)',
  'Réponses aux avis clients',
  '30 modèles de communication',
  'QR code établissement',
  'Plan d\'action prioritaire',
  'Guide de mise en ligne',
]

interface PreviewCardProps {
  label: string
  previewText: string
}

function PreviewCard({ label, previewText }: PreviewCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 pt-4 pb-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          {label}
        </p>
      </div>
      <div className="relative px-4 pb-4">
        <p className="blur-sm select-none text-sm text-gray-700 leading-relaxed line-clamp-2">
          {previewText || 'Contenu en cours de génération...'}
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <button className="text-xs text-gray-500 font-medium hover:text-gray-700 transition underline underline-offset-2">
            Voir la version complète →
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ScreenPreuve({
  result,
  generatedDescription,
  generatedPosts,
  generatedReview,
  onNext,
  totalElements,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  const descPreview = generatedDescription
    ? generatedDescription.slice(0, 60)
    : 'Description optimisée pour votre établissement...'

  const postPreview = generatedPosts[0]
    ? generatedPosts[0].split('\n')[0]
    : 'Publication Google prête à poster...'

  const reviewPreview = generatedReview
    ? generatedReview.split('\n')[0]
    : 'Modèles de réponses aux avis'

  return (
    <>
      <ScreenLayout>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
          Apercu du rapport
        </p>

        <h2 className="text-xl font-bold text-gray-900 mb-6 leading-snug">
          Voici ce qui a été préparé pour {result.name}
        </h2>

        <div className="space-y-3 mb-6">
          <PreviewCard
            label="Description optimisée"
            previewText={descPreview}
          />
          <PreviewCard
            label="Publication Google"
            previewText={postPreview}
          />
          <PreviewCard
            label={generatedReview ? 'Réponse à un avis' : 'Modèles de réponses aux avis'}
            previewText={reviewPreview}
          />
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="text-xs text-gray-500 font-medium hover:text-gray-700 transition block mb-8 underline underline-offset-2"
        >
          {totalElements} éléments préparés — Voir ce que contient le dossier →
        </button>

        <button
          onClick={onNext}
          className="w-full rounded-xl bg-gray-900 px-5 py-4 text-sm font-bold text-white hover:bg-gray-800 transition"
        >
          Voir l&apos;analyse complète →
        </button>
      </ScreenLayout>

      {/* Modal deliverables */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setModalOpen(false)}
            />
            <motion.aside
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } }}
              exit={{ opacity: 0, y: 32, transition: { duration: 0.18, ease: 'easeOut' } }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl px-6 pt-6 pb-10 max-w-[480px] mx-auto"
            >
              <div className="flex items-start justify-between mb-5">
                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  Ce que contient le dossier
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition ml-4 text-xl leading-none"
                  aria-label="Fermer"
                >
                  &times;
                </button>
              </div>

              <ul className="space-y-3 mb-6">
                {DELIVERABLES.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="text-[#16a34a] font-bold shrink-0 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <p className="text-xs text-gray-400">
                Ce rapport est généré spécifiquement pour votre établissement.
              </p>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
