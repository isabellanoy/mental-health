import { useId } from 'react'
import type { ComponentProps } from 'react'
import FieldError from './FieldError'

interface TextFieldProps extends ComponentProps<'input'> {
  label: string
  hideLabel?: boolean
  hint?: string
  error?: string
}

export default function TextField({
  label,
  hideLabel = false,
  hint,
  error,
  className = '',
  ...props
}: TextFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col text-left">
      <label
        htmlFor={id}
        className={hideLabel ? 'sr-only' : 'mb-1 px-1 text-base font-bold text-slate-700'}
      >
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mb-1 px-1 text-sm text-slate-600">
          {hint}
        </p>
      )}
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${hint ? `${hintId} ` : ''}${errorId}`}
        className={`min-h-14 w-full rounded-2xl border-2 bg-white px-5 py-3 text-lg text-slate-800 shadow-suave transition placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep/40 ${
          error ? 'border-rose-400' : 'border-lila-light focus-visible:border-lila-deep'
        } ${className}`}
        {...props}
      />
      <FieldError id={errorId} message={error} />
    </div>
  )
}
