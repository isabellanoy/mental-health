import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import {
  BEST_TIMES,
  DURATIONS,
  EMOTIONS,
  MOODS,
  QUALITY,
  SELF_HARM,
} from '../../lib/formSchema'
import type { SubmissionFilters } from '../api/adminClient'
import { useAuth } from '../auth/useAuth'
import { useAsync } from '../hooks/useAsync'
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
import type { Priority, SubmissionRow, SubmissionStatus } from '../types'

const PAGE_SIZE = 15

const STATUS_OPTIONS = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'cerrado', label: 'Cerrado' },
] as const

const PRIORITY_OPTIONS = [
  { value: 'alta', label: 'Alta' },
  { value: 'normal', label: 'Normal' },
] as const

const STATUS_TONES = { nuevo: 'celeste', contactado: 'lila', cerrado: 'slate' } as const

function oneOf<T extends string>(value: string | null, options: readonly { value: T }[]): T | '' {
  return options.find((option) => option.value === value)?.value ?? ''
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{labelOf(STATUS_OPTIONS, status)}</Badge>
}

function PriorityBadge({ priority }: { priority: Priority }) {
  return priority === 'alta' ? (
    <Badge tone="rosa">
      <Icon name="alert" className="size-3.5" />
      Prioridad alta
    </Badge>
  ) : (
    <Badge>Normal</Badge>
  )
}

function Mood({ value }: { value: number }) {
  const mood = MOODS.find((item) => item.value === value)
  return (
    <span title={mood?.label}>
      <span aria-hidden="true" className="text-xl">
        {mood?.emoji}
      </span>
      <span className="sr-only">{mood?.label ?? value}</span>
    </span>
  )
}

function SubmissionDetail({
  row,
  onSaved,
  onDelete,
}: {
  row: SubmissionRow
  onSaved: (row: SubmissionRow) => void
  onDelete: () => void
}) {
  const { client } = useAuth()
  const toast = useToast()
  const mood = MOODS.find((item) => item.value === row.mood)
  const selfHarmAlert = row.selfHarmThoughts !== 'no'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <PriorityBadge priority={row.priority} />
        <StatusBadge status={row.status} />
        <span className="text-sm text-slate-600">{formatDateTime(row.createdAt)}</span>
      </div>

      {selfHarmAlert && (
        <p role="note" className="rounded-2xl bg-rosa-light p-3 text-sm font-bold text-slate-800 ring-2 ring-rosa-dark">
          Esta persona indicó pensamientos de hacerse daño ({labelOf(SELF_HARM, row.selfHarmThoughts).toLowerCase()}). Conviene contactarla pronto.
        </p>
      )}

      <section aria-label="Contacto" className="flex flex-col gap-2">
        <h3 className="text-lg font-extrabold text-slate-800">
          {row.name} · {row.age} años
        </h3>
        <ContactLinks email={row.email} phone={row.phone} />
        <p className="text-sm text-slate-600">
          Mejor horario: {labelOf(BEST_TIMES, row.bestTime)} · Consentimiento: {row.consent ? 'sí' : 'no'}
        </p>
      </section>

      <DetailGrid>
        <Detail label="Ánimo">
          <span aria-hidden="true" className="mr-2 text-2xl align-middle">
            {mood?.emoji}
          </span>
          {mood?.label ?? row.mood}
        </Detail>
        <Detail label="Duración">{labelOf(DURATIONS, row.duration)}</Detail>
        <Detail label="Emociones" wide>
          <span className="flex flex-wrap gap-1.5">
            {row.emotions.map((emotion) => (
              <Badge key={emotion} tone="lila">
                {labelOf(EMOTIONS, emotion)}
              </Badge>
            ))}
          </span>
        </Detail>
        <Detail label="Impacto">
          {row.impact} / 10
          <span aria-hidden="true" className="mt-1.5 block h-2 overflow-hidden rounded-pill bg-lila-light">
            <span className="block h-full rounded-pill bg-lila-deep" style={{ width: `${row.impact * 10}%` }} />
          </span>
        </Detail>
        <Detail label="Pensamientos de hacerse daño">{labelOf(SELF_HARM, row.selfHarmThoughts)}</Detail>
        <Detail label="Sueño">{labelOf(QUALITY, row.sleep)}</Detail>
        <Detail label="Apetito">{labelOf(QUALITY, row.appetite)}</Detail>
      </DetailGrid>

      <ReviewForm
        statusOptions={STATUS_OPTIONS}
        status={row.status}
        notes={row.notes}
        onDelete={onDelete}
        onSave={async ({ status, notes }) => {
          const updated = await client.updateSubmission(row.id, {
            status: status as SubmissionStatus,
            notes,
          })
          toast.success('Cambios guardados.')
          onSaved(updated)
        }}
      />
    </div>
  )
}

export default function Submissions() {
  const { client } = useAuth()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const status = oneOf(params.get('status'), STATUS_OPTIONS)
  const priority = oneOf(params.get('priority'), PRIORITY_OPTIONS)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<SubmissionRow | null>(null)
  const [deleting, setDeleting] = useState<SubmissionRow | null>(null)

  const filters: SubmissionFilters = { status, priority }
  const { data, error, loading, reload, setData } = useAsync(
    (signal) => client.listSubmissions({ ...filters, page, pageSize: PAGE_SIZE }, signal),
    JSON.stringify({ status, priority, page }),
  )

  const setFilter = (key: 'status' | 'priority', value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
    setPage(1)
  }

  const replaceRow = (row: SubmissionRow) => {
    setData((current) =>
      current ? { ...current, data: current.data.map((item) => (item.id === row.id ? row : item)) } : current,
    )
    setSelected(row)
  }

  const remove = async (row: SubmissionRow) => {
    await client.deleteSubmission(row.id)
    toast.success('Solicitud eliminada.')
    // Si era la última de la página, se vuelve a la anterior
    if (rows.length === 1 && page > 1) setPage(page - 1)
    else reload()
  }

  const rows = data?.data ?? []
  const filtered = Boolean(status || priority)

  return (
    <>
      <PageHeader
        title="Solicitudes de ayuda"
        description="Personas que llenaron el formulario. Las de prioridad alta aparecen resaltadas."
        actions={<ExportControl onExport={(delimiter) => client.exportSubmissions(filters, delimiter)} />}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
        <SelectField label="Estado" value={status} onChange={(event) => setFilter('status', event.target.value)} options={STATUS_OPTIONS} placeholder="Todos" />
        <SelectField label="Prioridad" value={priority} onChange={(event) => setFilter('priority', event.target.value)} options={PRIORITY_OPTIONS} placeholder="Todas" />
      </div>

      {loading && !data && <ListSkeleton label="Cargando solicitudes…" />}

      {error && !data && (
        <EmptyState emoji="😕" title="No pudimos cargar las solicitudes" action={<Button onClick={reload}>Intentar de nuevo</Button>}>
          {error.message}
        </EmptyState>
      )}

      {data && rows.length === 0 && (
        <EmptyState emoji="🌿" title={filtered ? 'No hay solicitudes con esos filtros' : 'Aún no hay solicitudes'}>
          {filtered ? 'Prueba quitando algún filtro.' : 'Cuando alguien llene el formulario, aparecerá aquí.'}
        </EmptyState>
      )}

      {data && rows.length > 0 && (
        <div aria-busy={loading} className={`flex flex-col gap-3 ${loading ? 'opacity-70' : ''}`}>
          <div className="hidden overflow-hidden rounded-3xl bg-white shadow-suave md:block">
            <table className="w-full text-left">
              <caption className="sr-only">Solicitudes de ayuda</caption>
              <thead className="bg-lila-light/60 text-xs font-extrabold uppercase tracking-wide text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3">Fecha</th>
                  <th scope="col" className="px-4 py-3">Nombre</th>
                  <th scope="col" className="px-4 py-3">Ánimo</th>
                  <th scope="col" className="px-4 py-3">Prioridad</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lila-light/70">
                {rows.map((row) => (
                  <tr key={row.id} className={row.priority === 'alta' ? 'bg-rosa-light/50' : ''}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{formatDateTime(row.createdAt)}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{row.name}</td>
                    <td className="px-4 py-3"><Mood value={row.mood} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={row.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="secondary" onClick={() => setSelected(row)} aria-label={`Ver detalle de ${row.name}`}>
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
              <li
                key={row.id}
                className={`rounded-3xl p-4 shadow-suave ${row.priority === 'alta' ? 'bg-rosa-light ring-2 ring-rosa-dark' : 'bg-white'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-extrabold text-slate-800">{row.name}</p>
                    <p className="text-sm text-slate-600">{formatDateTime(row.createdAt)}</p>
                  </div>
                  <Mood value={row.mood} />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <PriorityBadge priority={row.priority} />
                  <StatusBadge status={row.status} />
                </div>
                <Button variant="secondary" onClick={() => setSelected(row)} className="mt-3 w-full" aria-label={`Ver detalle de ${row.name}`}>
                  <Icon name="eye" className="size-4" />
                  Ver detalle
                </Button>
              </li>
            ))}
          </ul>

          <Pagination meta={data.meta} onPage={setPage} disabled={loading} />
        </div>
      )}

      <Modal open={selected !== null} onClose={() => setSelected(null)} title="Detalle de la solicitud" size="lg">
        {selected && (
          <SubmissionDetail
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
        title="¿Eliminar esta solicitud?"
        description={`Se borrará la solicitud de ${deleting?.name ?? 'esta persona'} de forma permanente. Esta acción no se puede deshacer.`}
        onConfirm={() => (deleting ? remove(deleting) : Promise.resolve())}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}
