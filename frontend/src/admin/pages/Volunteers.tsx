import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { AVAILABILITIES, HELP_AREAS } from '../../lib/volunteerSchema'
import type { VolunteerFilters } from '../api/adminClient'
import { useAuth } from '../auth/useAuth'
import { useAsync } from '../hooks/useAsync'
import { useDebounced } from '../hooks/useDebounced'
import { formatDateTime, labelOf } from '../lib/format'
import Badge from '../ui/Badge'
import ConfirmDialog from '../ui/ConfirmDialog'
import { ContactLinks, Detail, DetailGrid } from '../ui/Detail'
import EmptyState from '../ui/EmptyState'
import ExportControl from '../ui/ExportControl'
import Icon from '../ui/Icon'
import PageHeader from '../ui/PageHeader'
import Pagination from '../ui/Pagination'
import ReviewForm from '../ui/ReviewForm'
import SelectField from '../ui/SelectField'
import { ListSkeleton } from '../ui/Skeleton'
import { useToast } from '../ui/useToast'
import type { VolunteerRow, VolunteerStatus } from '../types'

const PAGE_SIZE = 15

const STATUS_OPTIONS = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'activo', label: 'Activo' },
  { value: 'descartado', label: 'Descartado' },
] as const

const STATUS_TONES = {
  nuevo: 'celeste',
  contactado: 'lila',
  activo: 'menta',
  descartado: 'slate',
} as const

function StatusBadge({ status }: { status: VolunteerStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{labelOf(STATUS_OPTIONS, status)}</Badge>
}

const fullName = (row: VolunteerRow) => `${row.firstName} ${row.lastName}`

function VolunteerDetail({
  row,
  onSaved,
  onDelete,
}: {
  row: VolunteerRow
  onSaved: (row: VolunteerRow) => void
  onDelete: () => void
}) {
  const { client } = useAuth()
  const toast = useToast()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={row.status} />
        <span className="text-sm text-slate-600">{formatDateTime(row.createdAt)}</span>
      </div>

      <section aria-label="Contacto" className="flex flex-col gap-2">
        <h3 className="text-lg font-extrabold text-slate-800">{fullName(row)}</h3>
        <ContactLinks email={row.email} phone={row.phone} />
      </section>

      <DetailGrid>
        <Detail label="Carrera o profesión">{row.career}</Detail>
        <Detail label="Semestre o año">{row.semester ?? 'No indicó'}</Detail>
        <Detail label="Cómo quiere ayudar" wide>
          <span className="flex flex-wrap gap-1.5">
            {row.helpAreas.map((area) => (
              <Badge key={area} tone="menta">
                {labelOf(HELP_AREAS, area)}
              </Badge>
            ))}
          </span>
        </Detail>
        <Detail label="Disponibilidad">{labelOf(AVAILABILITIES, row.availability)}</Detail>
        <Detail label="Consentimiento">{row.consent ? 'Sí' : 'No'}</Detail>
        <Detail label="Mensaje" wide>
          {row.message ? <span className="whitespace-pre-wrap">{row.message}</span> : 'No dejó mensaje'}
        </Detail>
      </DetailGrid>

      <ReviewForm
        statusOptions={STATUS_OPTIONS}
        status={row.status}
        notes={row.notes}
        onDelete={onDelete}
        onSave={async ({ status, notes }) => {
          const updated = await client.updateVolunteer(row.id, {
            status: status as VolunteerStatus,
            notes,
          })
          toast.success('Cambios guardados.')
          onSaved(updated)
        }}
      />
    </div>
  )
}

export default function Volunteers() {
  const { client } = useAuth()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const status = (STATUS_OPTIONS.find((option) => option.value === params.get('status'))?.value ??
    '') as VolunteerStatus | ''
  const [searchText, setSearchText] = useState('')
  const search = useDebounced(searchText.trim())
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<VolunteerRow | null>(null)
  const [deleting, setDeleting] = useState<VolunteerRow | null>(null)

  const filters: VolunteerFilters = { status, search }
  const { data, error, loading, reload, setData } = useAsync(
    (signal) => client.listVolunteers({ ...filters, page, pageSize: PAGE_SIZE }, signal),
    JSON.stringify({ status, search, page }),
  )

  const setStatus = (value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set('status', value)
    else next.delete('status')
    setParams(next, { replace: true })
    setPage(1)
  }

  const replaceRow = (row: VolunteerRow) => {
    setData((current) =>
      current ? { ...current, data: current.data.map((item) => (item.id === row.id ? row : item)) } : current,
    )
    setSelected(row)
  }

  const remove = async (row: VolunteerRow) => {
    await client.deleteVolunteer(row.id)
    toast.success('Voluntario eliminado.')
    // Si era el último de la página, se vuelve a la anterior
    if (rows.length === 1 && page > 1) setPage(page - 1)
    else reload()
  }

  const rows = data?.data ?? []
  const filtered = Boolean(status || search)

  return (
    <>
      <PageHeader
        title="Voluntarios"
        description="Personas que quieren ayudar. Busca por nombre o correo."
        actions={<ExportControl onExport={(delimiter) => client.exportVolunteers(filters, delimiter)} />}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
        <div className="flex flex-col text-left">
          <label htmlFor="buscar-voluntarios" className="mb-1 px-1 text-sm font-bold text-slate-700">
            Buscar
          </label>
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-500" />
            <input
              id="buscar-voluntarios"
              type="search"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value)
                setPage(1)
              }}
              placeholder="Nombre o correo"
              maxLength={100}
              className="min-h-11 w-full rounded-2xl border-2 border-lila-light bg-white py-2 pl-10 pr-4 text-base font-semibold text-slate-800 shadow-suave focus-visible:border-lila-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep/40"
            />
          </div>
        </div>
        <SelectField label="Estado" value={status} onChange={(event) => setStatus(event.target.value)} options={STATUS_OPTIONS} placeholder="Todos" />
      </div>

      {loading && !data && <ListSkeleton label="Cargando voluntarios…" />}

      {error && !data && (
        <EmptyState emoji="😕" title="No pudimos cargar los voluntarios" action={<Button onClick={reload}>Intentar de nuevo</Button>}>
          {error.message}
        </EmptyState>
      )}

      {data && rows.length === 0 && (
        <EmptyState emoji="💚" title={filtered ? 'No encontramos voluntarios con esos filtros' : 'Aún no hay voluntarios'}>
          {filtered ? 'Prueba con otra búsqueda o quita el filtro de estado.' : 'Cuando alguien se registre desde /voluntarios, aparecerá aquí.'}
        </EmptyState>
      )}

      {data && rows.length > 0 && (
        <div aria-busy={loading} className={`flex flex-col gap-3 ${loading ? 'opacity-70' : ''}`}>
          <div className="hidden overflow-hidden rounded-3xl bg-white shadow-suave md:block">
            <table className="w-full text-left">
              <caption className="sr-only">Voluntarios</caption>
              <thead className="bg-lila-light/60 text-xs font-extrabold uppercase tracking-wide text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3">Fecha</th>
                  <th scope="col" className="px-4 py-3">Nombre</th>
                  <th scope="col" className="px-4 py-3">Carrera o profesión</th>
                  <th scope="col" className="px-4 py-3">Disponibilidad</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lila-light/70">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{formatDateTime(row.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">{fullName(row)}</p>
                      <p className="text-sm text-slate-600">{row.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.career}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{labelOf(AVAILABILITIES, row.availability)}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="secondary" onClick={() => setSelected(row)} aria-label={`Ver detalle de ${fullName(row)}`}>
                        <Icon name="eye" className="size-4" />
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((row) => (
              <li key={row.id} className="rounded-3xl bg-white p-4 shadow-suave">
                <p className="truncate text-lg font-extrabold text-slate-800">{fullName(row)}</p>
                <p className="truncate text-sm text-slate-600">{row.email}</p>
                <p className="mt-1 text-sm text-slate-700">
                  {row.career} · {labelOf(AVAILABILITIES, row.availability)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={row.status} />
                  <span className="text-xs text-slate-600">{formatDateTime(row.createdAt)}</span>
                </div>
                <Button variant="secondary" onClick={() => setSelected(row)} className="mt-3 w-full" aria-label={`Ver detalle de ${fullName(row)}`}>
                  <Icon name="eye" className="size-4" />
                  Ver detalle
                </Button>
              </li>
            ))}
          </ul>

          <Pagination meta={data.meta} onPage={setPage} disabled={loading} />
        </div>
      )}

      <Modal open={selected !== null} onClose={() => setSelected(null)} title="Detalle del voluntario" size="lg">
        {selected && (
          <VolunteerDetail
            key={selected.id}
            row={selected}
            onSaved={replaceRow}
            onDelete={() => {
              setDeleting(selected)
              setSelected(null)
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="¿Eliminar a este voluntario?"
        description={`Se borrarán los datos de ${deleting ? fullName(deleting) : 'esta persona'} de forma permanente. Esta acción no se puede deshacer.`}
        onConfirm={() => (deleting ? remove(deleting) : Promise.resolve())}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}
