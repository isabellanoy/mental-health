import { motion, useReducedMotion } from 'framer-motion'

type Kind = 'bubble' | 'cloud' | 'star'

interface DecorItem {
  id: string
  kind: Kind
  left: string
  top: string
  size: number
  color: string
  duration: number
  delay: number
  drift: number
}

const ITEMS: DecorItem[] = [
  { id: 'b1', kind: 'bubble', left: '8%', top: '14%', size: 56, color: 'text-celeste', duration: 7, delay: 0, drift: 18 },
  { id: 'c1', kind: 'cloud', left: '70%', top: '8%', size: 120, color: 'text-white', duration: 11, delay: 1, drift: 14 },
  { id: 's1', kind: 'star', left: '88%', top: '30%', size: 34, color: 'text-durazno', duration: 6, delay: 0.5, drift: 12 },
  { id: 'b2', kind: 'bubble', left: '20%', top: '70%', size: 80, color: 'text-rosa', duration: 9, delay: 2, drift: 22 },
  { id: 'c2', kind: 'cloud', left: '4%', top: '44%', size: 96, color: 'text-lila-light', duration: 13, delay: 0.5, drift: 12 },
  { id: 's2', kind: 'star', left: '46%', top: '6%', size: 28, color: 'text-lila', duration: 8, delay: 1.5, drift: 10 },
  { id: 'b3', kind: 'bubble', left: '82%', top: '72%', size: 64, color: 'text-menta', duration: 8, delay: 1, drift: 20 },
  { id: 'c3', kind: 'cloud', left: '58%', top: '84%', size: 110, color: 'text-celeste-light', duration: 12, delay: 2.5, drift: 14 },
  { id: 's3', kind: 'star', left: '12%', top: '88%', size: 30, color: 'text-rosa-dark', duration: 7, delay: 0, drift: 12 },
  { id: 'b4', kind: 'bubble', left: '92%', top: '52%', size: 40, color: 'text-lila', duration: 10, delay: 3, drift: 16 },
  { id: 's4', kind: 'star', left: '30%', top: '30%', size: 22, color: 'text-menta-dark', duration: 9, delay: 2, drift: 8 },
  { id: 'b5', kind: 'bubble', left: '64%', top: '40%', size: 36, color: 'text-durazno', duration: 11, delay: 0.8, drift: 14 },
]

function Shape({ kind }: { kind: Kind }) {
  switch (kind) {
    case 'bubble':
      return (
        <svg viewBox="0 0 100 100" className="size-full fill-current">
          <circle cx="50" cy="50" r="48" opacity="0.45" />
          <circle cx="34" cy="32" r="10" fill="white" opacity="0.7" />
        </svg>
      )
    case 'cloud':
      return (
        <svg viewBox="0 0 120 70" className="size-full fill-current">
          <path
            opacity="0.7"
            d="M30 64a22 22 0 0 1-2-43.9A28 28 0 0 1 82 22a20 20 0 0 1 8 42z"
          />
        </svg>
      )
    case 'star':
      return (
        <svg viewBox="0 0 24 24" className="size-full fill-current">
          <path
            opacity="0.75"
            d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z"
          />
        </svg>
      )
  }
}

interface FloatingDecorProps {
  // "light" muestra la mitad de los elementos para pantallas con más contenido
  density?: 'full' | 'light'
}

export default function FloatingDecor({ density = 'full' }: FloatingDecorProps) {
  const reduceMotion = useReducedMotion()
  const items = density === 'light' ? ITEMS.filter((_, index) => index % 2 === 0) : ITEMS

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {items.map((item) => (
        <motion.div
          key={item.id}
          className={`absolute ${item.color}`}
          style={{ left: item.left, top: item.top, width: item.size, height: item.size }}
          initial={{ opacity: 0 }}
          animate={
            reduceMotion
              ? { opacity: 1 }
              : {
                  opacity: 1,
                  y: [0, -item.drift, 0],
                  x: [0, item.drift / 2, 0],
                  rotate: item.kind === 'star' ? [0, 14, 0] : 0,
                }
          }
          transition={{
            opacity: { duration: 1.2, delay: item.delay * 0.3 },
            default: {
              duration: item.duration,
              delay: item.delay,
              ease: 'easeInOut',
              repeat: Infinity,
            },
          }}
        >
          <Shape kind={item.kind} />
        </motion.div>
      ))}
    </div>
  )
}
