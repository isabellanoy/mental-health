import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

export default function PageTransition({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion()
  const shift = reduceMotion ? 0 : 14

  return (
    <motion.div
      initial={{ opacity: 0, y: shift }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -shift }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
