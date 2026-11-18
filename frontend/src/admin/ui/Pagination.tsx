import Button from '../../components/Button'
import type { PageMeta } from '../types'
import Icon from './Icon'

export default function Pagination({
  meta,
  onPage,
  disabled = false,
}: {
  meta: PageMeta
  onPage: (page: number) => void
  disabled?: boolean
}) {
  return (
    <nav
      aria-label="Paginación"
      className="flex flex-wrap items-center justify-between gap-3 px-1 pt-2"
    >
      <p className="text-sm font-semibold text-slate-600" aria-live="polite">
        Página {meta.page} de {meta.totalPages} · {meta.total}{' '}
        {meta.total === 1 ? 'resultado' : 'resultados'}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => onPage(meta.page - 1)}
          disabled={disabled || meta.page <= 1}
        >
          <Icon name="chevronLeft" className="size-4" />
          Anterior
        </Button>
        <Button
          variant="secondary"
          onClick={() => onPage(meta.page + 1)}
          disabled={disabled || meta.page >= meta.totalPages}
        >
          Siguiente
          <Icon name="chevronRight" className="size-4" />
        </Button>
      </div>
    </nav>
  )
}
