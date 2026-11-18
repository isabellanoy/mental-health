import { useId, useState } from 'react'
import FieldError from '../../components/form/FieldError'
import { generatePassword } from '../lib/passwords'
import Icon from './Icon'
import { useToast } from './useToast'

interface PasswordFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  autoComplete?: 'current-password' | 'new-password'
  // Muestra los botones "Generar" y "Copiar"
  generator?: boolean
}

const iconButton =
  'flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-suave transition-colors hover:bg-lila-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep disabled:opacity-50'

export default function PasswordField({
  label,
  value,
  onChange,
  error,
  hint,
  autoComplete = 'new-password',
  generator = false,
}: PasswordFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const [visible, setVisible] = useState(false)
  const toast = useToast()

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success('Contraseña copiada. Guárdala en un lugar seguro.')
    } catch {
      toast.error('No pudimos copiarla automáticamente. Selecciónala y cópiala a mano.')
    }
  }

  return (
    <div className="flex flex-col text-left">
      <label htmlFor={id} className="mb-1 px-1 text-base font-bold text-slate-700">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mb-1 px-1 text-sm text-slate-600">
          {hint}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${hint ? `${hintId} ` : ''}${errorId}`}
          className={`min-h-14 min-w-0 flex-1 basis-40 rounded-2xl border-2 bg-white px-4 py-3 text-lg text-slate-800 shadow-suave focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep/40 ${
            error ? 'border-rose-400' : 'border-lila-light focus-visible:border-lila-deep'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className={iconButton}
        >
          <Icon name={visible ? 'eyeOff' : 'eye'} />
        </button>
        {generator && (
          <>
            <button
              type="button"
              onClick={() => {
                onChange(generatePassword())
                setVisible(true)
              }}
              aria-label="Generar contraseña segura"
              title="Generar contraseña segura"
              className={iconButton}
            >
              <Icon name="refresh" />
            </button>
            <button
              type="button"
              onClick={() => void copy()}
              disabled={!value}
              aria-label="Copiar contraseña"
              title="Copiar contraseña"
              className={iconButton}
            >
              <Icon name="copy" />
            </button>
          </>
        )}
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  )
}
