import { Link } from 'react-router-dom'

interface SiteFooterProps {
  // Se oculta donde ya hay otro acceso a voluntarios (inicio y el propio formulario)
  showVolunteerLink?: boolean
}

export default function SiteFooter({ showVolunteerLink = true }: SiteFooterProps) {
  return (
    <footer className="relative z-10 mt-auto flex w-full flex-col items-center gap-1 pt-12 text-center text-sm text-slate-600">
      {showVolunteerLink && (
        <p>
          ¿Quieres ayudar?{' '}
          <Link
            to="/voluntarios"
            className="inline-flex min-h-11 items-center rounded-pill px-2 font-bold text-lila-deep underline underline-offset-4 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep"
          >
            Únete como voluntario
          </Link>
        </p>
      )}
      <p className={showVolunteerLink ? '' : 'min-h-11 content-center'}>Hecho con cariño 💜</p>
    </footer>
  )
}
