import { useId } from 'react'
import type { ComponentProps } from 'react'

interface SelectFieldProps extends ComponentProps<'select'> {
  label: string
  hideLabel?: boolean
  hint?: string
  options: readonly { value: string; label: string }[]
  // Texto de la opción vacía (por ejemplo "Todos"); si se omite no hay opción vacía
  placeholder?: string
}

export default function SelectField({
  label,
  hideLabel = false,
  hint,
  options,
  placeholder,
  className = '',
  ...props
}: SelectFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  return (
    <div className="flex flex-col text-left">
      <label
        htmlFor={id}
        className={hideLabel ? 'sr-only' : 'mb-1 px-1 text-sm font-bold text-slate-700'}
      >
        {label}
      </label>
      <select
        id={id}
        aria-describedby={hint ? hintId : undefined}
        className={`min-h-11 w-full rounded-2xl border-2 border-lila-light bg-white px-4 py-2 text-base font-semibold text-slate-800 shadow-suave focus-visible:border-lila-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep/40 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && (
        <p id={hintId} className="mt-1 px-1 text-sm text-slate-600">
          {hint}
        </p>
      )}
    </div>
  )
}
