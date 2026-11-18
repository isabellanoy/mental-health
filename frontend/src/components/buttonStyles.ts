export type Variant = 'primary' | 'secondary' | 'warm' | 'accent' | 'danger'
export type Size = 'md' | 'lg'

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-pill font-extrabold shadow-suave transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep focus-visible:ring-offset-2 focus-visible:ring-offset-crema ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

const variants: Record<Variant, string> = {
  primary: 'bg-lila text-slate-800 hover:bg-lila-dark',
  secondary: 'bg-white text-slate-700 ring-2 ring-lila hover:bg-lila-light',
  // Cálido: invita a pedir más apoyo
  warm: 'bg-durazno text-slate-800 hover:bg-durazno-dark',
  // Acento verde menta para el voluntariado
  accent: 'bg-menta text-slate-800 hover:bg-menta-dark',
  // Acciones destructivas (eliminar)
  danger: 'bg-rosa text-slate-900 ring-2 ring-rosa-dark hover:bg-rosa-dark',
}

const sizes: Record<Size, string> = {
  md: 'px-6 py-2.5 text-base',
  lg: 'min-h-14 px-8 py-4 text-xl sm:text-2xl',
}

// También se usa para enlaces (<Link>) que deben verse como botones
export const buttonClasses = (variant: Variant = 'primary', size: Size = 'md') =>
  `${base} ${variants[variant]} ${sizes[size]}`
