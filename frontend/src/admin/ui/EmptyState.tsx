import type { ReactNode } from 'react'

export default function EmptyState({
  emoji = '🌱',
  title,
  children,
  action,
}: {
  emoji?: string
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-blob bg-white/70 px-6 py-12 text-center shadow-suave">
      <span className="text-5xl" aria-hidden="true">
        {emoji}
      </span>
      <h2 className="text-xl font-extrabold text-slate-800">{title}</h2>
      {children && <p className="max-w-md text-base text-slate-600">{children}</p>}
      {action}
    </div>
  )
}
