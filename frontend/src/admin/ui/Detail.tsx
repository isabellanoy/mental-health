import type { ReactNode } from 'react'
import { telLink, whatsappLink } from '../lib/format'
import Icon from './Icon'

const link =
  'inline-flex min-h-11 items-center gap-2 rounded-pill bg-white px-4 py-2 text-sm font-bold text-lila-deep shadow-suave ring-1 ring-lila transition-colors hover:bg-lila-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep'

export function ContactLinks({ email, phone }: { email: string; phone?: string | null }) {
  return (
    <div className="flex flex-wrap gap-2">
      <a href={`mailto:${email}`} className={link}>
        <Icon name="mail" className="size-4" />
        {email}
      </a>
      {phone && (
        <>
          <a href={telLink(phone)} className={link}>
            <Icon name="phone" className="size-4" />
            {phone}
          </a>
          <a
            href={whatsappLink(phone)}
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            <Icon name="external" className="size-4" />
            WhatsApp
            <span className="sr-only"> (se abre en una pestaña nueva)</span>
          </a>
        </>
      )}
    </div>
  )
}

export function DetailGrid({ children }: { children: ReactNode }) {
  return <dl className="grid gap-3 sm:grid-cols-2">{children}</dl>
}

export function Detail({
  label,
  children,
  wide = false,
}: {
  label: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className={`rounded-2xl bg-white p-3 shadow-suave ${wide ? 'sm:col-span-2' : ''}`}>
      <dt className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-base font-semibold text-slate-800">{children}</dd>
    </div>
  )
}
