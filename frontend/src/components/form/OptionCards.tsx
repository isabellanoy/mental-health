import FieldError from './FieldError'

export interface Option<T extends string> {
  value: T
  label: string
  emoji?: string
}

interface OptionCardsProps<T extends string> {
  name: string
  legend: string
  // Oculta la leyenda visualmente pero la deja disponible para lectores de pantalla
  hideLegend?: boolean
  options: readonly Option<T>[]
  value: T | undefined
  onChange: (value: T) => void
  onBlur?: () => void
  layout?: 'stack' | 'grid' | 'row'
  error?: string
}

const layouts = {
  stack: 'grid-cols-1',
  grid: 'grid-cols-1 min-[420px]:grid-cols-2',
  row: 'grid-cols-3',
}

export default function OptionCards<T extends string>({
  name,
  legend,
  hideLegend = false,
  options,
  value,
  onChange,
  onBlur,
  layout = 'stack',
  error,
}: OptionCardsProps<T>) {
  const errorId = `${name}-error`

  return (
    <fieldset aria-describedby={errorId} className="min-w-0">
      <legend
        className={hideLegend ? 'sr-only' : 'mb-2 w-full px-1 text-center text-base font-bold text-slate-700'}
      >
        {legend}
      </legend>
      <div className={`grid gap-3 ${layouts[layout]}`}>
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
            <span className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl bg-white px-3 py-3 text-center text-lg font-bold text-slate-700 shadow-suave ring-2 ring-transparent transition hover:bg-lila-light/60 peer-checked:bg-lila-light peer-checked:ring-lila-deep peer-focus-visible:ring-4 peer-focus-visible:ring-lila-deep peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-crema">
              {option.emoji && (
                <span className="text-3xl" aria-hidden="true">
                  {option.emoji}
                </span>
              )}
              {option.label}
            </span>
          </label>
        ))}
      </div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  )
}
