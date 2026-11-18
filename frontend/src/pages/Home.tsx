import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import FloatingDecor from '../components/FloatingDecor'
import SiteFooter from '../components/SiteFooter'
import VolunteerCTA from '../components/VolunteerCTA'

export default function Home() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-hidden bg-crema bg-pastel-aurora px-6 py-12 text-center">
      <FloatingDecor />

      <div className="relative z-10 flex w-full flex-1 items-center justify-center">
        <div className="flex max-w-3xl flex-col items-center gap-10">
          <motion.h1
            className="text-balance text-4xl font-extrabold leading-tight text-slate-800 sm:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            ¿Estás pasando por un mal momento?
          </motion.h1>

          <motion.div
            className="flex flex-col items-center gap-8"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
          >
            <Button size="lg" pulse onClick={() => navigate('/ruleta')}>
              Entonces haz click acá
            </Button>
            <VolunteerCTA variant="compact" />
          </motion.div>
        </div>
      </div>

      <SiteFooter showVolunteerLink={false} />
    </main>
  )
}
