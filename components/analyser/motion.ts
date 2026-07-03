import { Variants } from 'framer-motion'

export const screenVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit:    { opacity: 0, y: 0, transition: { duration: 0.18, ease: 'easeOut' } },
}

// Respect prefers-reduced-motion
export const reducedVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.1 } },
}
