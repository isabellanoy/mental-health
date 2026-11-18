import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import type { Ally } from '../services/api'

export default function AllyCard({ ally }: { ally: Ally }) {
  const reduceMotion = useReducedMotion()
  const [logoFailed, setLogoFailed] = useState(false)

  return (
    <motion.a
      href={ally.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visitar sitio de ${ally.name}`}
      whileHover={reduceMotion ? undefined : { y: -6, scale: 1.04 }}
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex aspect-[3/2] min-h-11 w-full items-center justify-center rounded-blob bg-white/90 p-5 shadow-suave transition-shadow hover:shadow-suave-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep focus-visible:ring-offset-2 focus-visible:ring-offset-crema"
    >
      {logoFailed ? (
        <span className="text-center text-lg font-extrabold text-slate-700">{ally.name}</span>
      ) : (
        <img
          src={ally.logoUrl}
          alt={`Logo de ${ally.name}`}
          loading="lazy"
          onError={() => setLogoFailed(true)}
          className="size-full object-contain"
        />
      )}
    </motion.a>
  )
}
