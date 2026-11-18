import { useId } from 'react'
import type { ComponentProps } from 'react'
import FieldError from './FieldError'

interface TextAreaFieldProps extends ComponentProps<'textarea'> {
  label: string
  hint?: string
  error?: string
  // Con `maxLength` y `length` se muestra el contador de caracteres
  length?: number
}

export default function TextAreaField({
  label,
  hint,
  error,
  length,
  maxLength,
  className = '',
  ...props
}: TextAreaFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const overLimit = maxLength !== undefined && length !== undefined && length >= maxLength

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
      <textarea
        id={id}
        rows={4}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${hint ? `${hintId} ` : ''}${errorId}`}
        className={`w-full resize-y rounded-2xl border-2 bg-white px-5 py-3 text-lg text-slate-800 shadow-suave transition placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep/40 ${
          error ? 'border-rose-400' : 'border-lila-light focus-visible:border-lila-deep'
        } ${className}`}
        {...props}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <FieldError id={errorId} message={error} />
        </div>
        {maxLength !== undefined && length !== undefined && (
          <p
            className={`pt-1 text-sm font-semibold ${overLimit ? 'text-rose-700' : 'text-slate-600'}`}
          >
            <span className="sr-only">Caracteres usados: </span>
            {length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}
