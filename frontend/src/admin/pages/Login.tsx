import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/Button'
import FloatingDecor from '../../components/FloatingDecor'
import TextField from '../../components/form/TextField'
import { ApiError } from '../api/adminClient'
import { useAuth } from '../auth/useAuth'
import PasswordField from '../ui/PasswordField'

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return 'Demasiados intentos seguidos. Respira un momento y vuelve a intentarlo en un minuto.'
    }
    if (error.status === 401) return 'Correo o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.'
    if (error.status === 403) return error.message
    if (error.status === 0) return error.message
  }
  return 'No pudimos iniciar sesión en este momento. Inténtalo de nuevo en un momento.'
}

export default function Login() {
  const { admin, signIn, sessionExpired, dismissExpired } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: string } | null)?.from
  const destination = from && from.startsWith('/admin') && from !== '/admin/login' ? from : '/admin'

  if (admin) return <Navigate to={destination} replace />

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    if (!email.trim() || !password) {
      setError('Escribe tu correo y tu contraseña para entrar.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await signIn(email, password)
      navigate(destination, { replace: true })
    } catch (caught) {
      setError(messageFor(caught))
      setSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-crema bg-pastel-aurora px-4 py-10">
      <FloatingDecor density="light" />
      <div className="relative z-10 flex w-full max-w-md flex-col gap-5">
        <header className="text-center">
          <p className="text-5xl" aria-hidden="true">
            💜
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-800">Panel de administración</h1>
          <p className="mt-1 text-base text-slate-600">Entra con tu cuenta para continuar.</p>
        </header>

        <form onSubmit={(event) => void submit(event)} noValidate aria-busy={submitting} className="card-suave flex flex-col gap-4">
          {sessionExpired && (
            <p role="status" className="rounded-2xl bg-celeste-light p-3 text-center text-sm font-semibold text-slate-700">
              Tu sesión terminó por seguridad. Vuelve a entrar para seguir trabajando.
            </p>
          )}
          <TextField
            label="Correo electrónico"
            type="email"
            inputMode="email"
            autoComplete="username"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              if (sessionExpired) dismissExpired()
            }}
          />
          <PasswordField
            label="Contraseña"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
          {error && (
            <p role="alert" className="rounded-2xl bg-rosa-light p-3 text-center text-sm font-semibold text-slate-800">
              {error}
            </p>
          )}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <span
                  className="size-4 rounded-full border-2 border-slate-800/30 border-t-slate-800 motion-safe:animate-spin"
                  aria-hidden="true"
                />
                Entrando…
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>

        <Link
          to="/"
          className="mx-auto inline-flex min-h-11 items-center rounded-pill px-3 font-bold text-lila-deep underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep"
        >
          ← Volver al sitio
        </Link>
      </div>
    </main>
  )
}
