import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { useAuth } from '../auth/useAuth'
import { useAsync } from '../hooks/useAsync'
import { formatBytes } from '../lib/format'
import Badge from '../ui/Badge'
import ConfirmDialog from '../ui/ConfirmDialog'
import EmptyState from '../ui/EmptyState'
import Icon from '../ui/Icon'
import PageHeader from '../ui/PageHeader'
import { Skeleton } from '../ui/Skeleton'
import { useToast } from '../ui/useToast'
import type { RouletteImageRow } from '../types'

const MB = 1024 * 1024
const MAX_BYTES = 5 * MB
const SOFT_LIMIT_BYTES = 4 * MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

interface UploadItem {
  id: number
  file: File
  status: 'waiting' | 'uploading' | 'done' | 'error'
  progress: number
  error?: string
  heavy: boolean
}

function rejectionReason(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXTENSIONS.includes(extension)) {
    return `“${file.name}”: formato no permitido. Usa JPG, PNG o WebP.`
  }
  if (file.size > MAX_BYTES) {
    return `“${file.name}”: pesa ${formatBytes(file.size)} y el máximo es 5 MB.`
  }
  if (file.size === 0) return `“${file.name}”: el archivo está vacío.`
  return null
}

function UploadRow({ item, onRetry }: { item: UploadItem; onRetry: () => void }) {
  return (
    <li className="rounded-2xl bg-white p-3 shadow-suave">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-bold text-slate-800">{item.file.name}</p>
        <p className="shrink-0 text-xs font-semibold text-slate-600">
          {item.status === 'waiting' && 'En espera'}
          {item.status === 'uploading' && `${item.progress}%`}
          {item.status === 'done' && '¡Lista! ✅'}
          {item.status === 'error' && 'No se subió'}
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={`Progreso de ${item.file.name}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={item.progress}
        className="mt-2 h-2 overflow-hidden rounded-pill bg-lila-light"
      >
        <div
          className={`h-full rounded-pill transition-[width] duration-200 motion-reduce:transition-none ${
            item.status === 'error' ? 'bg-rosa-dark' : 'bg-lila-deep'
          }`}
          style={{ width: `${item.status === 'error' ? 100 : item.progress}%` }}
        />
      </div>
      {item.heavy && item.status !== 'done' && (
        <p className="mt-2 text-xs font-semibold text-orange-800">
          Pesa {formatBytes(item.file.size)}: en Vercel puede fallar por encima de 4 MB.
        </p>
      )}
      {item.status === 'error' && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p role="alert" className="text-sm font-semibold text-rose-800">
            {item.error}
          </p>
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      )}
    </li>
  )
}

export default function Roulette() {
  const { client } = useAuth()
  const toast = useToast()
  const { data, error, loading, reload, setData } = useAsync(
    (signal) => client.listRoulette(signal),
    'roulette',
  )
  const [queue, setQueue] = useState<UploadItem[]>([])
  const [rejected, setRejected] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<RouletteImageRow | null>(null)
  const [deleting, setDeleting] = useState<RouletteImageRow | null>(null)
  const nextId = useRef(0)
  // Las subidas van de a una: cada lote espera a que termine el anterior
  const chain = useRef<Promise<void>>(Promise.resolve())

  const patchItem = (id: number, patch: Partial<UploadItem>) =>
    setQueue((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))

  const uploadItems = (items: UploadItem[]) => {
    chain.current = chain.current.then(async () => {
      let uploaded = 0
      for (const item of items) {
        patchItem(item.id, { status: 'uploading', progress: 0, error: undefined })
        try {
          await client.uploadRouletteImage(item.file, (progress) => patchItem(item.id, { progress }))
          patchItem(item.id, { status: 'done', progress: 100 })
          uploaded += 1
        } catch (caught) {
          patchItem(item.id, {
            status: 'error',
            error: caught instanceof Error ? caught.message : 'No pudimos subir la imagen.',
          })
        }
      }
      if (uploaded > 0) {
        reload()
        toast.success(uploaded === 1 ? 'Imagen subida.' : `${uploaded} imágenes subidas.`)
      }
    })
  }

  const addFiles = (files: FileList | File[]) => {
    const accepted: UploadItem[] = []
    const problems: string[] = []
    for (const file of Array.from(files)) {
      const reason = rejectionReason(file)
      if (reason) {
        problems.push(reason)
        continue
      }
      accepted.push({
        id: nextId.current++,
        file,
        status: 'waiting',
        progress: 0,
        heavy: file.size > SOFT_LIMIT_BYTES,
      })
    }
    setRejected(problems)
    if (accepted.length === 0) return
    setQueue((current) => [...current, ...accepted])
    uploadItems(accepted)
  }

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragging(false)
    addFiles(event.dataTransfer.files)
  }

  const toggleActive = async (image: RouletteImageRow) => {
    try {
      const updated = await client.setRouletteActive(image.id, !image.active)
      setData((current) => current?.map((item) => (item.id === updated.id ? updated : item)))
      toast.success(updated.active ? 'La imagen ya aparece en la ruleta.' : 'La imagen quedó oculta.')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos cambiar el estado.')
    }
  }

  const remove = async (image: RouletteImageRow) => {
    await client.deleteRouletteImage(image.id)
    setData((current) => current?.filter((item) => item.id !== image.id))
    toast.success('Imagen eliminada.')
  }

  const busy = queue.some((item) => item.status === 'waiting' || item.status === 'uploading')
  const hasFinished = queue.some((item) => item.status === 'done' || item.status === 'error')
  const activeCount = data?.filter((image) => image.active).length ?? 0

  return (
    <>
      <PageHeader
        title="Ruleta"
        description="Las imágenes activas son las frases que reciben las personas al girar la ruleta."
      />

      <section aria-labelledby="subir" className="mb-8 flex flex-col gap-3">
        <h2 id="subir" className="text-xl font-extrabold text-slate-800">
          Subir imágenes
        </h2>
        <label
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-blob border-2 border-dashed px-4 py-8 text-center transition-colors focus-within:ring-4 focus-within:ring-lila-deep ${
            dragging ? 'border-lila-deep bg-lila-light' : 'border-lila bg-white/70 hover:bg-lila-light/60'
          }`}
        >
          <Icon name="upload" className="size-8 text-lila-deep" />
          <span className="text-lg font-extrabold text-slate-800">
            Arrastra tus imágenes aquí o toca para elegirlas
          </span>
          <span className="text-sm text-slate-600">
            JPG, PNG o WebP · máximo 5 MB cada una · puedes elegir varias
          </span>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files)
              event.target.value = ''
            }}
          />
        </label>
        <p className="text-sm text-slate-600">
          Se suben de a una. Si el backend está en Vercel, conviene que cada imagen pese menos de 4 MB (el
          servidor rechaza peticiones más grandes).
        </p>

        <div aria-live="polite">
          {rejected.length > 0 && (
            <ul className="rounded-2xl bg-rosa-light p-3 text-sm font-semibold text-slate-800">
              {rejected.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
        </div>

        {queue.length > 0 && (
          <div className="flex flex-col gap-2">
            <ul className="flex flex-col gap-2">
              {queue.map((item) => (
                <UploadRow
                  key={item.id}
                  item={item}
                  onRetry={() => {
                    patchItem(item.id, { status: 'waiting', progress: 0, error: undefined })
                    uploadItems([item])
                  }}
                />
              ))}
            </ul>
            {hasFinished && !busy && (
              <div>
                <Button variant="secondary" onClick={() => setQueue((current) => current.filter((item) => item.status === 'error'))}>
                  Limpiar lista
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="galeria">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="galeria" className="text-xl font-extrabold text-slate-800">
            Galería
          </h2>
          {data && data.length > 0 && (
            <p className="text-sm font-semibold text-slate-600">
              {activeCount} activa{activeCount === 1 ? '' : 's'} de {data.length}
            </p>
          )}
        </div>

        {loading && !data && (
          <div role="status" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <span className="sr-only">Cargando imágenes…</span>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="aspect-[4/5]" />
            ))}
          </div>
        )}

        {error && !data && (
          <EmptyState emoji="😕" title="No pudimos cargar las imágenes" action={<Button onClick={reload}>Intentar de nuevo</Button>}>
            {error.message}
          </EmptyState>
        )}

        {data && data.length === 0 && (
          <EmptyState emoji="🖼️" title="Todavía no hay imágenes">
            Sube la primera frase motivacional. Mientras no haya imágenes activas, la ruleta usará las de ejemplo.
          </EmptyState>
        )}

        {data && data.length > 0 && (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.map((image) => (
              <li key={image.id} className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-suave">
                <button
                  type="button"
                  onClick={() => setPreview(image)}
                  aria-label="Ver imagen en grande"
                  className={`relative aspect-[4/5] bg-lila-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-lila-deep ${
                    image.active ? '' : 'opacity-60'
                  }`}
                >
                  <img src={image.imageUrl} alt="Frase de la ruleta" loading="lazy" className="size-full object-contain" />
                </button>
                <div className="flex flex-col gap-2 p-3">
                  <Badge tone={image.active ? 'menta' : 'slate'} className="self-start">
                    {image.active ? 'Visible' : 'Oculta'}
                  </Badge>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={image.active}
                      onClick={() => void toggleActive(image)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-pill pr-2 text-sm font-bold text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep"
                    >
                      <span
                        aria-hidden="true"
                        className={`relative h-6 w-11 shrink-0 rounded-pill transition-colors ${image.active ? 'bg-lila-deep' : 'bg-slate-300'}`}
                      >
                        <span
                          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${image.active ? 'left-[1.4rem]' : 'left-0.5'}`}
                        />
                      </span>
                      Activa
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(image)}
                      aria-label="Eliminar imagen"
                      title="Eliminar imagen"
                      className="flex size-11 items-center justify-center rounded-pill text-rose-800 hover:bg-rosa-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep"
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal open={preview !== null} onClose={() => setPreview(null)} title="Vista previa">
        {preview && (
          <img
            src={preview.imageUrl}
            alt="Frase de la ruleta en tamaño grande"
            className="mx-auto max-h-[70dvh] w-full rounded-2xl bg-lila-light object-contain"
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="¿Eliminar esta imagen?"
        description="Dejará de aparecer en la ruleta y se borrará el archivo. Si solo quieres pausarla, desactívala en su lugar."
        onConfirm={() => (deleting ? remove(deleting) : Promise.resolve())}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}
