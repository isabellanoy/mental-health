import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

interface StepWrapperProps {
  title: string
  hint?: string
  // 1 avanza (entra por la derecha) y -1 retrocede (entra por la izquierda)
  direction: 1 | -1
  children: ReactNode
}

export default function StepWrapper({ title, hint, direction, children }: StepWrapperProps) {
  const reduceMotion = useReducedMotion()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const shift = reduceMotion ? 0 : 48

  // Mover el foco al título anuncia la nueva pregunta a lectores de pantalla
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <motion.div
      custom={direction}
      variants={{
        enter: (dir: number) => ({ opacity: 0, x: dir * shift }),
        center: { opacity: 1, x: 0 },
        exit: (dir: number) => ({ opacity: 0, x: -dir * shift }),
      }}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-2 text-center">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-balance text-2xl font-extrabold leading-snug text-slate-800 outline-none sm:text-3xl"
        >
          {title}
        </h2>
        {hint && <p className="text-base text-slate-600">{hint}</p>}
      </div>
      {children}
    </motion.div>
  )
}
