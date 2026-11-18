import FieldError from './FieldError'

interface EmojiOption {
  value: number
  emoji: string
  label: string
}

interface EmojiScaleProps {
  name: string
  legend: string
  options: readonly EmojiOption[]
  value: number | undefined
  onChange: (value: number) => void
  onBlur?: () => void
  error?: string
}

export default function EmojiScale({
  name,
  legend,
  options,
  value,
  onChange,
  onBlur,
  error,
}: EmojiScaleProps) {
  const errorId = `${name}-error`

  return (
    <fieldset aria-describedby={errorId} className="min-w-0">
      <legend className="sr-only">{legend}</legend>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
        {options.map((option) => (
          <label key={option.value} className="block cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              onBlur={onBlur}
              className="peer sr-only"
            />
            <span className="flex min-h-24 flex-col items-center justify-start gap-1 rounded-2xl bg-white px-0.5 py-3 text-center text-xs font-bold text-slate-700 shadow-suave ring-2 ring-transparent transition hover:bg-lila-light/60 peer-checked:scale-105 peer-checked:bg-lila-light peer-checked:ring-lila-deep peer-focus-visible:ring-4 peer-focus-visible:ring-lila-deep sm:text-sm motion-reduce:peer-checked:scale-100">
              <span className="text-3xl sm:text-5xl" aria-hidden="true">
                {option.emoji}
              </span>
              {option.label}
            </span>
          </label>
        ))}
      </div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  )
}
