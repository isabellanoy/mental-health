import { motion, useReducedMotion } from 'framer-motion'
import type { CSSProperties } from 'react'
import FieldError from './FieldError'

interface Feedback {
  emoji: string
  label: string
}

interface RangeSliderProps {
  name: string
  legend: string
  value: number | undefined
  min?: number
  max?: number
  onChange: (value: number) => void
  onBlur?: () => void
  describe: (value: number) => Feedback
  minLabel: string
  maxLabel: string
  error?: string
}

const IDLE: Feedback = { emoji: '🤔', label: 'Mueve el deslizador' }

export default function RangeSlider({
  name,
  legend,
  value,
  min = 0,
  max = 10,
  onChange,
  onBlur,
  describe,
  minLabel,
  maxLabel,
  error,
}: RangeSliderProps) {
  const reduceMotion = useReducedMotion()
  const errorId = `${name}-error`
  const chosen = value !== undefined
  const feedback = chosen ? describe(value) : IDLE
  const fill = chosen ? ((value - min) / (max - min)) * 100 : 0

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.span
        key={feedback.emoji}
        className="text-6xl sm:text-7xl"
        aria-hidden="true"
        initial={reduceMotion ? false : { scale: 0.7, opacity: 0.4 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        {feedback.emoji}
      </motion.span>
      <p className="text-xl font-extrabold text-slate-800" aria-hidden="true">
        {chosen ? `${value} · ${feedback.label}` : feedback.label}
      </p>

      <div className="w-full">
        <input
          type="range"
          name={name}
          aria-label={legend}
          aria-describedby={errorId}
          aria-valuetext={chosen ? `${value} de ${max}, ${feedback.label}` : 'Sin elegir'}
          min={min}
          max={max}
          step={1}
          value={value ?? min}
          data-empty={!chosen}
          style={{ '--fill': `${fill}%` } as CSSProperties}
          onChange={(event) => onChange(Number(event.target.value))}
          onPointerUp={(event) => onChange(Number(event.currentTarget.value))}
          onBlur={onBlur}
          className="range-pastel"
        />
        <div className="flex justify-between px-1 text-sm font-semibold text-slate-600" aria-hidden="true">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  )
}
