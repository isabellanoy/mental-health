import { motion, useReducedMotion } from 'framer-motion'

interface ProgressBarProps {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const reduceMotion = useReducedMotion()
  const label = `Paso ${current} de ${total}`

  return (
    <div className="w-full">
      <p className="mb-2 text-center text-sm font-bold text-slate-600">{label}</p>
      <div
        role="progressbar"
        aria-label="Progreso del formulario"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={label}
        className="h-3 w-full overflow-hidden rounded-pill bg-white shadow-inner ring-1 ring-lila-light"
      >
        <motion.div
          className="h-full rounded-pill bg-gradient-to-r from-lila via-rosa to-celeste"
          initial={false}
          animate={{ width: `${(current / total) * 100}%` }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
