import type { ReactNode } from 'react'

// Tooltip solo con CSS: aparece al pasar el cursor o al enfocar el control con el teclado.
// El control interno debe tener su propio aria-label; el tooltip es un refuerzo visual.
export default function Tip({
  label,
  children,
  side = 'top',
}: {
  label: string
  children: ReactNode
  side?: 'top' | 'right'
}) {
  const position =
    side === 'right' ? 'left-full top-1/2 ml-2 -translate-y-1/2' : 'bottom-full left-1/2 mb-2 -translate-x-1/2'
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        aria-hidden="true"
        className={`pointer-events-none absolute z-40 hidden whitespace-nowrap rounded-xl bg-slate-800 px-2.5 py-1 text-xs font-bold text-white shadow-suave-lg group-focus-within/tip:block group-hover/tip:block ${position}`}
      >
        {label}
      </span>
    </span>
  )
}
