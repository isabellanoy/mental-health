import { Link } from 'react-router-dom'
import { buttonClasses } from './buttonStyles'

interface VolunteerCTAProps {
  // "card" es una tarjeta destacada; "compact" es un enlace discreto en forma de píldora
  variant?: 'card' | 'compact'
  className?: string
}

export default function VolunteerCTA({ variant = 'card', className = '' }: VolunteerCTAProps) {
  if (variant === 'compact') {
    return (
      <Link
        to="/voluntarios"
        className={`inline-flex min-h-11 items-center gap-2 rounded-pill bg-white/70 px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-menta-dark transition-colors hover:bg-menta-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep ${className}`}
      >
        <span aria-hidden="true">💚</span>
        ¿Quieres ayudar? Participa y ayúdanos a salvar vidas.
      </Link>
    )
  }

  return (
    <aside
      aria-labelledby="voluntarios-cta-titulo"
      className={`flex w-full max-w-xl flex-col items-center gap-3 rounded-blob bg-menta-light/80 p-5 text-center shadow-suave ring-1 ring-menta sm:flex-row sm:gap-5 sm:text-left ${className}`}
    >
      <span className="text-4xl" aria-hidden="true">
        💚
      </span>
      <div className="flex-1">
        <h2 id="voluntarios-cta-titulo" className="text-lg font-extrabold text-slate-800">
          ¿Quieres ayudar?
        </h2>
        <p className="text-base text-slate-700">Participa y ayúdanos a salvar vidas.</p>
      </div>
      <Link to="/voluntarios" className={`${buttonClasses('accent')} shrink-0 text-center`}>
        Llenar formulario
      </Link>
    </aside>
  )
}
