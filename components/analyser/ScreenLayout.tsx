'use client'
import { motion, useReducedMotion } from 'framer-motion'
import { screenVariants, reducedVariants } from './motion'

interface Props {
  children: React.ReactNode
  centered?: boolean
  step?: number
  totalSteps?: number
  onSkip?: () => void
}

export default function ScreenLayout({
  children,
  centered = true,
  step,
  totalSteps,
  onSkip,
}: Props) {
  const reduce   = useReducedMotion()
  const variants = reduce ? reducedVariants : screenVariants
  const showProgress = step !== undefined && totalSteps !== undefined
  const pct = showProgress ? Math.round((step / totalSteps) * 100) : 0

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`min-h-screen flex flex-col ${centered ? 'justify-center' : 'justify-start pt-[8vh]'} items-center px-6`}
    >
      <div className="w-full max-w-[480px]">
        {showProgress && (
          <div className="mb-7">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-gray-400 font-medium">
                Étape {step} sur {totalSteps}
              </p>
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="text-xs text-gray-400 hover:text-gray-600 transition underline underline-offset-2"
                >
                  Recevoir mon rapport →
                </button>
              )}
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#16a34a] rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
        {children}
      </div>
    </motion.div>
  )
}
