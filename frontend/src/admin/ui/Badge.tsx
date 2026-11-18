import type { ReactNode } from 'react'

export type Tone = 'lila' | 'rosa' | 'menta' | 'celeste' | 'durazno' | 'slate'

const TONES: Record<Tone, string> = {
  lila: 'bg-lila-light text-lila-deep ring-lila',
  rosa: 'bg-rosa-light text-rose-900 ring-rosa-dark',
  menta: 'bg-menta-light text-emerald-900 ring-menta-dark',
  celeste: 'bg-celeste-light text-sky-900 ring-celeste-dark',
  durazno: 'bg-durazno-light text-orange-900 ring-durazno-dark',
  slate: 'bg-slate-100 text-slate-700 ring-slate-300',
}

export default function Badge({
  tone = 'slate',
  children,
  className = '',
}: {
  tone?: Tone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-pill px-2.5 py-0.5 text-xs font-extrabold ring-1 ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
