import { useId } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import FieldError from './FieldError'

interface CheckboxFieldProps extends Omit<ComponentProps<'input'>, 'type' | 'children'> {
  children: ReactNode
  error?: string
}

export default function CheckboxField({ children, error, ...props }: CheckboxFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className="text-left">
      <label
        htmlFor={id}
        className="flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl bg-white p-4 shadow-suave"
      >
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className="peer mt-0.5 size-6 shrink-0 cursor-pointer accent-lila-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep/50"
          {...props}
        />
        <span className="text-base font-semibold leading-snug text-slate-700">{children}</span>
      </label>
      <FieldError id={errorId} message={error} />
    </div>
  )
}
