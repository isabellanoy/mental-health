import FieldError from './FieldError'

export interface ChipOption<T extends string> {
  value: T
  label: string
}

interface ChipGroupProps<T extends string> {
  name: string
  legend: string
  options: readonly ChipOption<T>[]
  value: T[]
  onChange: (value: T[]) => void
  onBlur?: () => void
  error?: string
}

export default function ChipGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  onBlur,
  error,
}: ChipGroupProps<T>) {
  const errorId = `${name}-error`

  const toggle = (option: T) =>
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option])

  return (
    <fieldset aria-describedby={errorId} className="min-w-0">
      <legend className="sr-only">{legend}</legend>
      <div className="flex flex-wrap justify-center gap-3">
        {options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="checkbox"
              name={name}
              value={option.value}
              checked={value.includes(option.value)}
              onChange={() => toggle(option.value)}
              onBlur={onBlur}
              className="peer sr-only"
            />
            <span className="flex min-h-11 items-center rounded-pill bg-white px-5 py-2 text-base font-bold text-slate-700 shadow-suave ring-2 ring-transparent transition hover:bg-lila-light/60 peer-checked:bg-lila peer-checked:text-slate-900 peer-checked:ring-lila-deep peer-focus-visible:ring-4 peer-focus-visible:ring-lila-deep peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-crema">
              {option.label}
            </span>
          </label>
        ))}
      </div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  )
}
