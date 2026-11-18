import { motion, useReducedMotion } from 'framer-motion'

interface Particle {
  id: string
  x: number
  y: number
  rotate: number
  size: number
  color: string
  heart: boolean
  delay: number
}

const COLORS = ['text-lila', 'text-rosa', 'text-celeste', 'text-menta', 'text-durazno']

// Valores deterministas (sin Math.random) para que el render sea estable
const PARTICLES: Particle[] = Array.from({ length: 16 }, (_, index) => {
  const angle = (index / 16) * Math.PI * 2 + (index % 2) * 0.2
  const distance = 110 + ((index * 37) % 90)
  return {
    id: `p-${index}`,
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance * 0.8 + 60,
    rotate: ((index * 53) % 240) - 120,
    size: 10 + ((index * 7) % 10),
    color: COLORS[index % COLORS.length],
    heart: index % 3 === 0,
    delay: (index % 4) * 0.05,
  }
})

const HEART =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'

// Breve estallido de confeti y corazones pastel, centrado en su contenedor
export default function Celebration() {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return null

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
      {PARTICLES.map((particle) => (
        <motion.span
          key={particle.id}
          className={`absolute ${particle.color}`}
          style={{ width: particle.size, height: particle.size }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4, rotate: 0 }}
          animate={{
            x: particle.x,
            y: particle.y,
            opacity: [0, 1, 1, 0],
            scale: [0.4, 1, 1, 0.8],
            rotate: particle.rotate,
          }}
          transition={{ duration: 2.2, delay: 0.3 + particle.delay, ease: 'easeOut' }}
        >
          {particle.heart ? (
            <svg viewBox="0 0 24 24" className="size-full fill-current">
              <path d={HEART} />
            </svg>
          ) : (
            <span className="block size-full rounded-sm bg-current" />
          )}
        </motion.span>
      ))}
    </div>
  )
}
