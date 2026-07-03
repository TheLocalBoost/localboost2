'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ScreenLayout from './ScreenLayout'

interface Props {
  nom: string
  ville: string
}

const MESSAGES = [
  (nom: string) => `Analyse de ${nom} en cours...`,
  (_nom: string) => 'Comparaison avec les concurrents locaux...',
]

export default function ScreenLoading({ nom, ville }: Props) {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setMessageIndex(1), 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <ScreenLayout>
      <div className="text-center">
        {/* Minimal animated indicator — three dots */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="block w-2 h-2 rounded-full bg-[#16a34a]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3 } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="text-base font-semibold text-gray-900"
          >
            {MESSAGES[messageIndex](nom)}
          </motion.p>
        </AnimatePresence>

        {ville && (
          <p className="text-sm text-gray-400 mt-2">{ville}</p>
        )}
      </div>
    </ScreenLayout>
  )
}
