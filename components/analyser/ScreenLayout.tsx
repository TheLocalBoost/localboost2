'use client'
import { motion, useReducedMotion } from 'framer-motion'
import { screenVariants, reducedVariants } from './motion'

interface Props {
  children: React.ReactNode
  centered?: boolean
}

export default function ScreenLayout({ children, centered = true }: Props) {
  const reduce = useReducedMotion()
  const variants = reduce ? reducedVariants : screenVariants
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`min-h-screen flex flex-col ${centered ? 'justify-center' : 'justify-start pt-[12vh]'} items-center px-6`}
    >
      <div className="w-full max-w-[480px]">
        {children}
      </div>
    </motion.div>
  )
}
