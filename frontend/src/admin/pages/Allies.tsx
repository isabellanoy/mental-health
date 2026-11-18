import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import CheckboxField from '../../components/form/CheckboxField'
import FieldError from '../../components/form/FieldError'
import TextField from '../../components/form/TextField'
import { useAuth } from '../auth/useAuth'
import { useAsync } from '../hooks/useAsync'
import { formatBytes, isHttpUrl } from '../lib/format'
import Badge from '../ui/Badge'
import ConfirmDialog from '../ui/ConfirmDialog'
import EmptyState from '../ui/EmptyState'
import Icon from '../ui/Icon'
import PageHeader from '../ui/PageHeader'
import { ListSkeleton } from '../ui/Skeleton'
import Tip from '../ui/Tip'
import { useToast } from '../ui/useToast'
import type { AllyRow } from '../types'

const MAX_LOGO_BYTES = 2 * 1024 * 1024
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const LOGO_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'svg']

function logoProblem(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!LOGO_TYPES.includes(file.type) || !LOGO_EXTENSIONS.includes(extension)) {
    return 'Formato no permitido. Usa PNG, JPG, WebP o SVG.'
  }
  if (file.size > MAX_LOGO_BYTES) {
    return `El logo pesa ${formatBytes(file.size)} y el máximo es 2 MB.`
  }
  return null
}

interface AllyFormProps {
  ally: AllyRow | null
  onSaved: () => void
  onCancel: () => void
}

function AllyForm({ ally, onSaved, onCancel }: AllyFormProps) {
  const { client } = useAuth()
  const toast = useToast()
  const logoId = useId()
  const logoErrorId = `${logoId}-error`
  const [name, setName] = useState(ally?.name ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(ally?.websiteUrl ?? '')
  const [active, setActive] = useState(ally?.active ?? true)
  const [logo, setLogo] = useState<{ file: File; url: string } | null>(null)
  const [errors, setErrors] = useState<{ name?: string; url?: string; logo?: string }>({})
  const [saving, setSaving] = useState(false)

  // Libera la vista previa anterior cuando se elige otro logo o se cierra el formulario
  useEffect(() => {
    if (!logo) return
    const { url } = logo
    return () => URL.revokeObjectURL(url)
  }, [logo])

  const validate = () => {
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'Escribe el nombre del aliado.'
    else if (name.trim().length > 80) next.name = 'El nombre puede tener hasta 80 caracteres.'
    if (!websiteUrl.trim()) next.url = 'Escribe la dirección web del aliado.'
    else if (!isHttpUrl(websiteUrl)) next.url = 'Usa una dirección válida que empiece con http:// o https://'
    if (!ally && !logo) next.logo = 'Elige el logo del aliado.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const pickLogo = (file: File | undefined) => {
    if (!file) return
    const problem = logoProblem(file)
    if (problem) {
      setLogo(null)
      setErrors((current) => ({ ...current, logo: problem }))
      return
    }
    setLogo({ file, url: URL.createObjectURL(file) })
    setErrors((current) => ({ ...current, logo: undefined }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving || !validate()) return
    setSaving(true)
    try {
      const input = { name: name.trim(), websiteUrl: websiteUrl.trim(), active, logo: logo?.file ?? null }
      if (ally) await client.updateAlly(ally.id, input)
      else await client.createAlly(input)
      toast.success(ally ? 'Aliado actualizado.' : 'Aliado creado.')
      onSaved()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos guardar al aliado.')
      setSaving(false)
    }
  }

  const shownLogo = logo?.url ?? ally?.logoUrl

  return (
    <form onSubmit={(event) => void submit(event)} noValidate aria-busy={saving} className="flex flex-col gap-4">
      <TextField label="Nombre" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} error={errors.name} />
      <TextField
        label="Sitio web"
        type="url"
        inputMode="url"
        placeholder="https://ejemplo.org"
        value={websiteUrl}
        onChange={(event) => setWebsiteUrl(event.target.value)}
        maxLength={500}
        error={errors.url}
      />

      <div className="flex flex-col text-left">
        <label htmlFor={logoId} className="mb-1 px-1 text-base font-bold text-slate-700">
          Logo {ally && <span className="font-semibold text-slate-600">(opcional: reemplaza el actual)</span>}
        </label>
        <p className="mb-2 px-1 text-sm text-slate-600">PNG, JPG, WebP o SVG · máximo 2 MB.</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-20 w-28 items-center justify-center rounded-2xl bg-white p-2 shadow-suave ring-1 ring-lila-light">
            {shownLogo ? (
              <img src={shownLogo} alt="Vista previa del logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-xs font-semibold text-slate-500">Sin logo</span>
            )}
          </div>
          <input
            id={logoId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            aria-invalid={errors.logo ? true : undefined}
            aria-describedby={logoErrorId}
            onChange={(event) => {
              pickLogo(event.target.files?.[0])
              event.target.value = ''
            }}
            className="min-h-11 max-w-full text-sm file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-pill file:border-0 file:bg-lila file:px-4 file:py-2 file:font-bold file:text-slate-800 hover:file:bg-lila-dark"
          />
        </div>
        {logo && <p className="mt-1 px-1 text-sm text-slate-600">{logo.file.name} · {formatBytes(logo.file.size)}</p>}
        <FieldError id={logoErrorId} message={errors.logo} />
      </div>

      <CheckboxField checked={active} onChange={(event) => setActive(event.target.checked)}>
        Mostrar en la página pública “Gracias”
      </CheckboxField>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button variant="secondary" onClick={onCancel} disabled={saving} className="w-full">
          Cancelar
        </Button>
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Guardando…' : ally ? 'Guardar cambios' : 'Crear aliado'}
        </Button>
      </div>
    </form>
  )
}

export default function Allies() {
  const { client } = useAuth()
  const toast = useToast()
  const { data, error, loading, reload, setData } = useAsync((signal) => client.listAllies(signal), 'allies')
  // `undefined` = cerrado, `null` = creando, AllyRow = editando
  const [editing, setEditing] = useState<AllyRow | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<AllyRow | null>(null)
  const [reordering, setReordering] = useState(false)

  const move = async (index: number, offset: -1 | 1) => {
    if (!data || reordering) return
    const target = index + offset
    if (target < 0 || target >= data.length) return

    const next = [...data]
    ;[next[index], next[target]] = [next[target], next[index]]
    const renumbered = next.map((ally, position) => ({ ...ally, position }))
    setData(() => renumbered)
    setReordering(true)
    try {
      // Solo se guardan las posiciones que cambiaron, una por una
      for (const [position, ally] of next.entries()) {
        if (ally.position !== position) await client.setAllyPosition(ally.id, position)
      }
      toast.success('Orden actualizado.')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos guardar el nuevo orden.')
      reload()
    } finally {
      setReordering(false)
    }
  }

  const toggleActive = async (ally: AllyRow) => {
    try {
      const updated = await client.updateAlly(ally.id, {
        name: ally.name,
        websiteUrl: ally.websiteUrl,
        active: !ally.active,
      })
      setData((current) => current?.map((item) => (item.id === updated.id ? updated : item)))
      toast.success(updated.active ? 'El aliado ya aparece en “Gracias”.' : 'El aliado quedó oculto.')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos cambiar el estado.')
    }
  }

  const remove = async (ally: AllyRow) => {
    await client.deleteAlly(ally.id)
    toast.success('Aliado eliminado.')
    reload()
  }

  return (
    <>
      <PageHeader
        title="Aliados"
        description="Organizaciones que aparecen en la página “Gracias”. Los cambios se ven allí de inmediato."
        actions={
          <Button onClick={() => setEditing(null)}>
            <Icon name="plus" className="size-4" />
            Nuevo aliado
          </Button>
        }
      />

      {loading && !data && <ListSkeleton label="Cargando aliados…" />}

      {error && !data && (
        <EmptyState emoji="😕" title="No pudimos cargar los aliados" action={<Button onClick={reload}>Intentar de nuevo</Button>}>
          {error.message}
        </EmptyState>
      )}

      {data && data.length === 0 && (
        <EmptyState emoji="🤝" title="Aún no hay aliados" action={<Button onClick={() => setEditing(null)}>Agregar el primero</Button>}>
          Mientras no haya aliados activos, la página “Gracias” mostrará unos de ejemplo.
        </EmptyState>
      )}

      {data && data.length > 0 && (
        <ol aria-busy={reordering} className="flex flex-col gap-3">
          {data.map((ally, index) => (
            <li key={ally.id} className={`flex flex-col gap-3 rounded-3xl bg-white p-3 shadow-suave sm:flex-row sm:items-center ${ally.active ? '' : 'opacity-75'}`}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="w-6 shrink-0 text-center text-sm font-extrabold text-slate-500" aria-hidden="true">
                  {index + 1}
                </span>
                <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-2xl bg-crema p-2 ring-1 ring-lila-light">
                  <img src={ally.logoUrl} alt={`Logo de ${ally.name}`} loading="lazy" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-extrabold text-slate-800">{ally.name}</p>
                  <a
                    href={ally.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-1 truncate text-sm font-semibold text-lila-deep underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep"
                  >
                    <span className="truncate">{ally.websiteUrl}</span>
                    <Icon name="external" className="size-3.5 shrink-0" />
                    <span className="sr-only">(se abre en una pestaña nueva)</span>
                  </a>
                  <div className="mt-1">
                    <Badge tone={ally.active ? 'menta' : 'slate'}>{ally.active ? 'Visible' : 'Oculto'}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1 sm:justify-end">
                <Tip label="Subir">
                  <button
                    type="button"
                    onClick={() => void move(index, -1)}
                    disabled={index === 0 || reordering}
                    aria-label={`Subir a ${ally.name}`}
                    className="flex size-11 items-center justify-center rounded-pill text-slate-700 hover:bg-lila-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep disabled:opacity-40"
                  >
                    <Icon name="arrowUp" />
                  </button>
                </Tip>
                <Tip label="Bajar">
                  <button
                    type="button"
                    onClick={() => void move(index, 1)}
                    disabled={index === data.length - 1 || reordering}
                    aria-label={`Bajar a ${ally.name}`}
                    className="flex size-11 items-center justify-center rounded-pill text-slate-700 hover:bg-lila-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep disabled:opacity-40"
                  >
                    <Icon name="arrowDown" />
                  </button>
                </Tip>
                <Tip label="Editar">
                  <button
                    type="button"
                    onClick={() => setEditing(ally)}
                    aria-label={`Editar a ${ally.name}`}
                    className="flex size-11 items-center justify-center rounded-pill text-slate-700 hover:bg-lila-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep"
                  >
                    <Icon name="edit" />
                  </button>
                </Tip>
                <button
                  type="button"
                  role="switch"
                  aria-checked={ally.active}
                  aria-label={`Mostrar a ${ally.name}`}
                  onClick={() => void toggleActive(ally)}
                  className="flex min-h-11 items-center rounded-pill px-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep"
                >
                  <span aria-hidden="true" className={`relative h-6 w-11 rounded-pill transition-colors ${ally.active ? 'bg-lila-deep' : 'bg-slate-300'}`}>
                    <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${ally.active ? 'left-[1.4rem]' : 'left-0.5'}`} />
                  </span>
                </button>
                <Tip label="Eliminar">
                  <button
                    type="button"
                    onClick={() => setDeleting(ally)}
                    aria-label={`Eliminar a ${ally.name}`}
                    className="flex size-11 items-center justify-center rounded-pill text-rose-800 hover:bg-rosa-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep"
                  >
                    <Icon name="trash" />
                  </button>
                </Tip>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Modal open={editing !== undefined} onClose={() => setEditing(undefined)} title={editing ? 'Editar aliado' : 'Nuevo aliado'} size="lg">
        {editing !== undefined && (
          <AllyForm
            key={editing?.id ?? 'nuevo'}
            ally={editing}
            onCancel={() => setEditing(undefined)}
            onSaved={() => {
              setEditing(undefined)
              reload()
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="¿Eliminar a este aliado?"
        description={`${deleting?.name ?? 'El aliado'} dejará de aparecer en la página “Gracias” y se borrará su logo. Esta acción no se puede deshacer.`}
        onConfirm={() => (deleting ? remove(deleting) : Promise.resolve())}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}
