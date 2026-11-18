import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'

const SECTORS = 8
const SECTOR_ANGLE = 360 / SECTORS
const CENTER = 200
const RADIUS = 188
const MIN_TURNS = 5

const FILLS = [
  'fill-lila',
  'fill-rosa',
  'fill-celeste',
  'fill-menta',
  'fill-durazno',
  'fill-lila',
  'fill-rosa',
  'fill-celeste',
]

const HEART =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
const STAR = 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'

function polar(angle: number, radius: number) {
  const rad = (angle * Math.PI) / 180
  return { x: CENTER + radius * Math.sin(rad), y: CENTER - radius * Math.cos(rad) }
}

// Los ángulos se miden en sentido horario desde la parte superior (donde está el puntero)
const SECTOR_DATA = Array.from({ length: SECTORS }, (_, index) => {
  const start = polar(index * SECTOR_ANGLE, RADIUS)
  const end = polar((index + 1) * SECTOR_ANGLE, RADIUS)
  return {
    id: `sector-${index}`,
    fill: FILLS[index],
    path: `M${CENTER} ${CENTER} L${start.x.toFixed(2)} ${start.y.toFixed(2)} A${RADIUS} ${RADIUS} 0 0 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`,
    iconPath: index % 2 === 0 ? HEART : STAR,
    middle: (index + 0.5) * SECTOR_ANGLE,
    peg: polar(index * SECTOR_ANGLE, RADIUS),
  }
})

const normalize = (angle: number) => ((angle % 360) + 360) % 360

export interface WheelHandle {
  spin: () => void
}

interface WheelProps {
  ref?: Ref<WheelHandle>
  disabled?: boolean
  onSpinStart?: () => void
  onSpinEnd?: (sector: number) => void
}

export default function Wheel({ ref, disabled = false, onSpinStart, onSpinEnd }: WheelProps) {
  const rotation = useMotionValue(0)
  const reduceMotion = useReducedMotion()
  const [spinning, setSpinning] = useState(false)
  const spinningRef = useRef(false)
  const controlsRef = useRef<ReturnType<typeof animate> | null>(null)
  const callbacks = useRef({ onSpinStart, onSpinEnd })

  useEffect(() => {
    callbacks.current = { onSpinStart, onSpinEnd }
  }, [onSpinStart, onSpinEnd])

  useEffect(() => () => controlsRef.current?.stop(), [])

  const spin = useCallback(() => {
    if (spinningRef.current || disabled) return
    spinningRef.current = true
    setSpinning(true)
    callbacks.current.onSpinStart?.()

    const sector = Math.floor(Math.random() * SECTORS)
    // Un pequeño desfase dentro del sector hace que el final se vea natural
    const jitter = (Math.random() - 0.5) * SECTOR_ANGLE * 0.7
    const finalAngle = normalize(360 - (sector + 0.5) * SECTOR_ANGLE + jitter)

    const current = rotation.get()
    let delta = finalAngle - normalize(current)
    if (delta < 0) delta += 360

    const turns = reduceMotion ? 1 : MIN_TURNS + Math.floor(Math.random() * 3)
    const duration = reduceMotion ? 1 : 4 + Math.random() * 2
    const target = current + turns * 360 + delta

    controlsRef.current = animate(rotation, target, {
      duration,
      ease: [0.4, 0, 0.15, 1],
      onComplete: () => {
        rotation.set(normalize(target))
        spinningRef.current = false
        setSpinning(false)
        callbacks.current.onSpinEnd?.(sector)
      },
    })
  }, [disabled, reduceMotion, rotation])

  useImperativeHandle(ref, () => ({ spin }), [spin])

  return (
    <div className="relative aspect-square w-[min(86vw,420px)] select-none">
      <p className="sr-only" role="status">
        {spinning ? 'La ruleta está girando' : ''}
      </p>

      <motion.div
        role="presentation"
        onClick={spin}
        style={{ rotate: rotation }}
        className={`size-full touch-manipulation rounded-full shadow-suave-lg ${
          spinning || disabled ? '' : 'cursor-pointer'
        }`}
      >
        <svg viewBox="0 0 400 400" className="size-full" aria-hidden="true">
          <circle cx={CENTER} cy={CENTER} r="198" className="fill-white" />
          {SECTOR_DATA.map((sector) => (
            <g key={sector.id}>
              <path d={sector.path} className={`${sector.fill} stroke-white`} strokeWidth="3" />
              <g transform={`rotate(${sector.middle} ${CENTER} ${CENTER})`}>
                <path
                  d={sector.iconPath}
                  transform={`translate(${CENTER - 19} ${CENTER - 138}) scale(1.6)`}
                  className="fill-white"
                  opacity="0.85"
                />
              </g>
            </g>
          ))}
          {SECTOR_DATA.map((sector) => (
            <circle
              key={`peg-${sector.id}`}
              cx={sector.peg.x}
              cy={sector.peg.y}
              r="6"
              className="fill-white"
            />
          ))}
        </svg>
      </motion.div>

      <svg
        viewBox="0 0 40 48"
        className="pointer-events-none absolute left-1/2 top-0 z-10 w-[11%] -translate-x-1/2 -translate-y-[22%] drop-shadow-md"
        aria-hidden="true"
      >
        <path
          d="M20 46L4 12a17 17 0 1 1 32 0z"
          className="fill-lila-deep stroke-white"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="15" r="5" className="fill-white" />
      </svg>

      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <motion.button
          type="button"
          onClick={spin}
          disabled={spinning || disabled}
          aria-label="Girar la ruleta"
          whileHover={spinning || disabled || reduceMotion ? undefined : { scale: 1.06 }}
          whileTap={spinning || disabled || reduceMotion ? undefined : { scale: 0.94 }}
          className="pointer-events-auto flex aspect-square min-h-11 min-w-11 w-[26%] items-center justify-center rounded-full bg-white text-[clamp(0.8rem,3.6vw,1.2rem)] font-extrabold text-lila-deep shadow-suave-lg ring-4 ring-lila transition-colors hover:bg-lila-light focus-visible:outline-none focus-visible:ring-lila-deep disabled:cursor-not-allowed disabled:text-slate-500"
        >
          ¡Girar!
        </motion.button>
      </div>
    </div>
  )
}
