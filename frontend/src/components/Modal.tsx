import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useId, useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  // Se llama cuando el modal ya se cerró del todo: scroll del fondo liberado y foco devuelto
  onExited?: () => void
  size?: 'md' | 'lg' | 'xl'
}

const SIZES = { md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' }

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Con varios modales abiertos a la vez (uno saliendo y otro entrando) el scroll del fondo
// se bloquea una sola vez y solo el modal de arriba responde a Esc
let scrollLocks = 0
let savedBodyStyle = { overflow: '', paddingRight: '' }
const modalStack: symbol[] = []

function lockScroll() {
  if (scrollLocks === 0) {
    savedBodyStyle = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    }
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`
  }
  scrollLocks += 1
}

function unlockScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1)
  if (scrollLocks === 0) {
    document.body.style.overflow = savedBodyStyle.overflow
    document.body.style.paddingRight = savedBodyStyle.paddingRight
  }
}

function ModalContent({ onClose, title, children, onExited, size = 'md' }: Omit<ModalProps, 'open'>) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const reduceMotion = useReducedMotion()
  const onExitedRef = useRef(onExited)
  useEffect(() => {
    onExitedRef.current = onExited
  })

  // Bloquea el scroll del fondo y evita el salto por la barra de desplazamiento
  useEffect(() => {
    lockScroll()
    return unlockScroll
  }, [])

  // Cierre con Esc (solo el modal que está arriba)
  useEffect(() => {
    const id = Symbol('modal')
    modalStack.push(id)
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && modalStack[modalStack.length - 1] === id) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      modalStack.splice(modalStack.indexOf(id), 1)
    }
  }, [onClose])

  // Foco al abrir y devolución del foco al cerrar
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    return () => previous?.focus?.({ preventScroll: true })
  }, [])

  // Debe declararse al final: sus limpiezas corren después de liberar el scroll y el foco
  useEffect(() => () => onExitedRef.current?.(), [])

  // Mantiene el foco dentro del modal
  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !panelRef.current) return
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={trapFocus}
        className={`relative max-h-[94dvh] w-full ${SIZES[size]} overflow-y-auto rounded-blob bg-crema p-5 shadow-suave-lg`}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 24 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-pill bg-white text-xl font-bold text-slate-700 shadow-suave transition-colors hover:bg-lila-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep"
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <h2
          id={titleId}
          className="mb-4 px-12 text-center text-xl font-extrabold leading-tight text-slate-800"
        >
          {title}
        </h2>
        {children}
      </motion.div>
    </motion.div>
  )
}

export default function Modal({ open, onClose, title, children, onExited, size }: ModalProps) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <ModalContent key="modal" onClose={onClose} title={title} onExited={onExited} size={size}>
          {children}
        </ModalContent>
      )}
    </AnimatePresence>,
    document.body,
  )
}
