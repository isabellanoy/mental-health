import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Icon from './Icon'
import { ToastContext } from './toastContext'
import type { ToastApi } from './toastContext'

type Tone = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  tone: Tone
  message: string
}

const TONES: Record<Tone, string> = {
  success: 'bg-menta-light ring-menta-dark',
  error: 'bg-rosa-light ring-rosa-dark',
  info: 'bg-celeste-light ring-celeste-dark',
}

const ICONS = { success: 'check', error: 'alert', info: 'alert' } as const

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)
  const reduceMotion = useReducedMotion()

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (tone: Tone, message: string) => {
      const id = nextId.current++
      setToasts((current) => [...current.slice(-3), { id, tone, message }])
      window.setTimeout(() => dismiss(id), tone === 'error' ? 8000 : 5000)
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      info: (message) => push('info', message),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              layout={!reduceMotion}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl p-3 pr-1 text-slate-800 shadow-suave-lg ring-2 ${TONES[toast.tone]}`}
            >
              <Icon name={ICONS[toast.tone]} className="mt-2.5 size-5 shrink-0" />
              <p className="flex-1 py-2 text-sm font-semibold leading-snug">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Cerrar aviso"
                className="flex size-11 shrink-0 items-center justify-center rounded-pill hover:bg-white/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep"
              >
                <Icon name="close" className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
