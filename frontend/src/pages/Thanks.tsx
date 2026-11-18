import { motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import AllyCard from '../components/AllyCard'
import Button from '../components/Button'
import Celebration from '../components/Celebration'
import FloatingDecor from '../components/FloatingDecor'
import SiteFooter from '../components/SiteFooter'
import VolunteerCTA from '../components/VolunteerCTA'
import { hasSubmitted } from '../lib/submissionFlag'
import { getAllies } from '../services/api'
import type { Ally } from '../services/api'

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; allies: Ally[] }

function useAllies() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getAllies(controller.signal)
      .then((allies) => setState({ status: 'ready', allies }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' })
      })
    return () => controller.abort()
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [])

  return { state, retry }
}

// 2 columnas en móvil, 3 en tablet y 4 en escritorio. Los puntos de corte dejan margen
// para la barra de desplazamiento, así un navegador de 768 px de ancho también muestra 3.
const CELL_WIDTH =
  'w-[calc((100%-1rem)/2)] min-[720px]:w-[calc((100%-2rem)/3)] min-[1000px]:w-[calc((100%-3rem)/4)]'

function AlliesSkeleton() {
  return (
    <div role="status" className="flex flex-wrap justify-center gap-4">
      <span className="sr-only">Cargando nuestros aliados…</span>
      {['a', 'b', 'c', 'd'].map((id) => (
        <div
          key={id}
          aria-hidden="true"
          className={`${CELL_WIDTH} aspect-[3/2] rounded-blob bg-white/70 shadow-suave motion-safe:animate-pulse ${
            id === 'd' ? 'hidden min-[1000px]:block' : ''
          }`}
        />
      ))}
    </div>
  )
}

function Thanks() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { state, retry } = useAllies()

  // Anuncia el mensaje a lectores de pantalla al llegar desde el formulario
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: 'easeOut' as const },
  })

  const showAllies = state.status !== 'ready' || state.allies.length > 0

  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-hidden bg-crema bg-pastel-aurora px-4 py-12 sm:px-6 sm:py-16">
      <FloatingDecor density="light" />

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-10 text-center">
        <div className="flex max-w-3xl flex-col items-center gap-6">
          <div className="relative flex size-24 items-center justify-center">
            <Celebration />
            <motion.span
              className="text-7xl"
              aria-hidden="true"
              initial={reduceMotion ? false : { scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 12 }}
            >
              💜
            </motion.span>
          </div>

          <motion.h1
            ref={headingRef}
            tabIndex={-1}
            className="text-balance text-3xl font-extrabold leading-tight text-slate-800 outline-none sm:text-4xl lg:text-5xl"
            {...rise(0.15)}
          >
            En la brevedad posible nos comunicaremos contigo para ayudarte.
          </motion.h1>

          <motion.p
            className="rounded-blob bg-white/85 px-6 py-3 text-2xl font-extrabold text-lila-deep shadow-suave sm:text-3xl"
            {...rise(0.35)}
          >
            Recuerda que no estás solo.
          </motion.p>
        </div>

        {showAllies && (
          <motion.section aria-labelledby="aliados-titulo" className="w-full" {...rise(0.55)}>
            <h2 id="aliados-titulo" className="mb-6 text-2xl font-extrabold text-slate-800 sm:text-3xl">
              Nuestros aliados
            </h2>

            {state.status === 'loading' && <AlliesSkeleton />}

            {state.status === 'error' && (
              <div
                role="alert"
                className="card-suave mx-auto flex max-w-md flex-col items-center gap-4 text-center"
              >
                <p className="text-lg font-bold text-slate-700">
                  No pudimos mostrar a nuestros aliados en este momento. No te preocupes, puedes
                  intentarlo de nuevo.
                </p>
                <Button variant="secondary" onClick={retry}>
                  Intentar de nuevo
                </Button>
              </div>
            )}

            {state.status === 'ready' && (
              <ul className="flex flex-wrap justify-center gap-4">
                {state.allies.map((ally) => (
                  <li key={ally.id} className={CELL_WIDTH}>
                    <AllyCard ally={ally} />
                  </li>
                ))}
              </ul>
            )}
          </motion.section>
        )}

        <motion.div className="flex w-full justify-center" {...rise(0.7)}>
          <VolunteerCTA />
        </motion.div>

        <Button variant="secondary" size="lg" onClick={() => navigate('/')}>
          Volver al inicio
        </Button>
      </div>

      <SiteFooter />
    </main>
  )
}

// Solo se puede ver después de enviar el formulario con éxito
export default function ThanksPage() {
  if (!hasSubmitted()) return <Navigate to="/" replace />
  return <Thanks />
}
