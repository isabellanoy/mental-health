import { motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import FloatingDecor from '../components/FloatingDecor'
import Modal from '../components/Modal'
import SiteFooter from '../components/SiteFooter'
import VolunteerCTA from '../components/VolunteerCTA'
import Wheel from '../components/Wheel'
import type { WheelHandle } from '../components/Wheel'
import { getRouletteImages } from '../services/api'
import type { RouletteImage } from '../services/api'

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; images: RouletteImage[] }

function useRouletteImages() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getRouletteImages(controller.signal)
      .then((images) => setState({ status: 'ready', images }))
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

// Elige una imagen al azar evitando repetir la anterior cuando hay más de una
function pickImage(images: RouletteImage[], previousId: RouletteImage['id'] | null) {
  const candidates = images.length > 1 ? images.filter((image) => image.id !== previousId) : images
  return candidates[Math.floor(Math.random() * candidates.length)]
}

function WheelSkeleton() {
  return (
    <div
      role="status"
      className="flex aspect-square w-[min(86vw,420px)] flex-col items-center justify-center gap-4 rounded-full bg-white/70 shadow-suave motion-safe:animate-pulse"
    >
      <span
        className="size-10 rounded-full border-4 border-lila-light border-t-lila-deep motion-safe:animate-spin"
        aria-hidden="true"
      />
      <p className="px-10 text-center font-bold text-slate-600">Preparando tu ruleta…</p>
    </div>
  )
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="card-suave flex w-[min(92vw,420px)] flex-col items-center gap-5 text-center"
    >
      <p className="text-lg font-bold text-slate-700">
        Ups, no pudimos preparar tu ruleta. Respira, no pasa nada: inténtalo de nuevo en un momento.
      </p>
      <Button onClick={onRetry}>Intentar de nuevo</Button>
    </div>
  )
}

function MessageImage({ image }: { image: RouletteImage }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  return (
    <div className="relative mx-auto aspect-[4/5] max-h-[44dvh] w-full sm:max-h-[56dvh] overflow-hidden rounded-2xl bg-lila-light">
      {!loaded && !failed && (
        <div
          className="absolute inset-0 motion-safe:animate-pulse bg-lila-light"
          aria-hidden="true"
        />
      )}
      {failed ? (
        <p className="absolute inset-0 flex items-center justify-center p-6 text-center font-bold text-slate-600">
          No pudimos mostrar tu mensaje esta vez. Gira de nuevo para recibir otro.
        </p>
      ) : (
        <img
          src={image.imageUrl}
          alt="Frase motivacional para ti"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`size-full object-contain transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  )
}

type ModalAction = 'help' | 'volunteer'

const HIGHLIGHT_MS = 2600

export default function Roulette() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const wheelRef = useRef<WheelHandle>(null)
  const previousId = useRef<RouletteImage['id'] | null>(null)
  const { state, retry } = useRouletteImages()
  const [current, setCurrent] = useState<RouletteImage | null>(null)
  const helpRef = useRef<HTMLElement>(null)
  // Acción elegida en el modal: se ejecuta cuando el modal terminó de cerrarse
  const pendingAction = useRef<ModalAction | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [highlightHelp, setHighlightHelp] = useState(false)

  useEffect(() => {
    if (!highlightHelp) return
    const timer = window.setTimeout(() => setHighlightHelp(false), HIGHLIGHT_MS)
    return () => window.clearTimeout(timer)
  }, [highlightHelp])

  const handleSpinEnd = () => {
    if (state.status !== 'ready') return
    const image = pickImage(state.images, previousId.current)
    previousId.current = image.id
    setCurrent(image)
    setModalOpen(true)
  }

  const closeModal = useCallback(() => setModalOpen(false), [])

  const spinAgain = () => {
    setModalOpen(false)
    wheelRef.current?.spin()
  }

  const chooseAction = (action: ModalAction) => {
    pendingAction.current = action
    setModalOpen(false)
  }

  const goToHelp = () => {
    const section = helpRef.current
    if (!section) return
    section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
    section.focus({ preventScroll: true })
    setHighlightHelp(true)
  }

  const handleModalExited = () => {
    const action = pendingAction.current
    pendingAction.current = null
    if (action === 'help') goToHelp()
    if (action === 'volunteer') navigate('/voluntarios')
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-hidden bg-crema bg-pastel-aurora px-4 pb-8 pt-6 sm:px-6">
      <FloatingDecor density="light" />

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-8 text-center">
        <div className="flex w-full justify-start">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-pill px-3 font-bold text-lila-deep underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep"
          >
            ← Volver al inicio
          </Link>
        </div>

        <div className="flex flex-col items-center gap-2">
          <h1 className="text-balance text-3xl font-extrabold leading-tight text-slate-800 sm:text-4xl lg:text-5xl">
            Gira la ruleta y recibe un mensaje para ti
          </h1>
          <p className="text-lg text-slate-600">Toca el botón o la propia ruleta.</p>
        </div>

        {state.status === 'loading' && <WheelSkeleton />}
        {state.status === 'error' && <LoadError onRetry={retry} />}
        {state.status === 'ready' && <Wheel ref={wheelRef} onSpinEnd={handleSpinEnd} />}

        <motion.section
          ref={helpRef}
          id="mas-ayuda"
          tabIndex={-1}
          aria-label="Más apoyo"
          className={`card-suave flex w-full max-w-xl flex-col items-center gap-5 text-center outline-none transition-shadow ${
            highlightHelp ? 'ring-4 ring-rosa-dark motion-safe:animate-glow' : ''
          }`}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
        >
          <p className="text-lg font-semibold leading-relaxed text-slate-700">
            Sabemos que hay días que con solo una frase no es suficiente. Si sientes que
            necesitas más ayuda o apoyo psicológico primario llena este formulario
          </p>
          <Button size="lg" onClick={() => navigate('/formulario')}>
            Necesito más ayuda
          </Button>
        </motion.section>

        <VolunteerCTA />
      </div>

      <SiteFooter />

      <Modal
        open={modalOpen}
        onClose={closeModal}
        onExited={handleModalExited}
        title="Un mensaje para ti"
      >
        {current && <MessageImage key={current.id} image={current} />}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            variant="warm"
            onClick={() => chooseAction('help')}
            className="min-h-12 w-full text-lg sm:col-span-2"
          >
            Necesito más ayuda
          </Button>
          <Button variant="secondary" onClick={spinAgain} className="w-full text-center leading-tight">
            Girar de nuevo
          </Button>
          <Button
            variant="accent"
            onClick={() => chooseAction('volunteer')}
            className="w-full text-center leading-tight"
          >
            Ayúdanos a salvar vidas
          </Button>
        </div>
      </Modal>
    </main>
  )
}
