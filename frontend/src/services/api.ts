import type { SubmissionPayload } from '../lib/formSchema'
import type { VolunteerPayload } from '../lib/volunteerSchema'

export interface RouletteImage {
  id: string | number
  imageUrl: string
}

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

// TODO: quitar este fallback (y los archivos de /public/placeholders) cuando el
// backend exponga GET /roulette-images. Con `false`, los errores se muestran en la UI.
const USE_PLACEHOLDER_FALLBACK = true

const PLACEHOLDER_IMAGES: RouletteImage[] = [1, 2, 3, 4, 5].map((n) => ({
  id: `placeholder-${n}`,
  imageUrl: `/placeholders/frase-${n}.svg`,
}))

function isRouletteImage(value: unknown): value is RouletteImage {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (
    (typeof item.id === 'string' || typeof item.id === 'number') &&
    typeof item.imageUrl === 'string' &&
    item.imageUrl.length > 0
  )
}

async function fetchRouletteImages(signal?: AbortSignal): Promise<RouletteImage[]> {
  const response = await fetch(`${API_URL}/roulette-images`, { signal })
  if (!response.ok) {
    throw new Error(`GET /roulette-images respondió ${response.status}`)
  }
  const data: unknown = await response.json()
  if (!Array.isArray(data)) {
    throw new Error('Respuesta inesperada de /roulette-images')
  }
  return data.filter(isRouletteImage)
}

export async function getRouletteImages(signal?: AbortSignal): Promise<RouletteImage[]> {
  try {
    const images = await fetchRouletteImages(signal)
    if (images.length > 0) return images
    throw new Error('No hay imágenes disponibles')
  } catch (error) {
    if (signal?.aborted || !USE_PLACEHOLDER_FALLBACK) throw error
    console.warn('Usando imágenes de ejemplo para la ruleta:', error)
    return PLACEHOLDER_IMAGES
  }
}

// TODO: el backend aún no implementa POST /submissions. Mientras tanto el formulario
// muestra un error amable con "Reintentar". Cuando exista, no hay nada que quitar aquí.
export async function submitForm(payload: SubmissionPayload, signal?: AbortSignal): Promise<void> {
  const response = await fetch(`${API_URL}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
  if (!response.ok) {
    throw new Error(`POST /submissions respondió ${response.status}`)
  }
}

export async function createVolunteer(
  payload: VolunteerPayload,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${API_URL}/volunteers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
  if (!response.ok) {
    throw new Error(`POST /volunteers respondió ${response.status}`)
  }
}

export interface Ally {
  id: string | number
  name: string
  logoUrl: string
  websiteUrl: string
}

// TODO: quitar este fallback (y los logos de /public/placeholders) cuando el backend
// exponga GET /allies. Con `false`, los errores se muestran en la UI.
const USE_ALLIES_FALLBACK = true

const PLACEHOLDER_ALLIES: Ally[] = [
  { id: 'placeholder-1', name: 'Aliado Uno', logoUrl: '/placeholders/aliado-1.svg', websiteUrl: 'https://example.com' },
  { id: 'placeholder-2', name: 'Aliado Dos', logoUrl: '/placeholders/aliado-2.svg', websiteUrl: 'https://example.org' },
  { id: 'placeholder-3', name: 'Aliado Tres', logoUrl: '/placeholders/aliado-3.svg', websiteUrl: 'https://example.net' },
]

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

function isAlly(value: unknown): value is Ally {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (
    (typeof item.id === 'string' || typeof item.id === 'number') &&
    typeof item.name === 'string' &&
    item.name.length > 0 &&
    typeof item.logoUrl === 'string' &&
    item.logoUrl.length > 0 &&
    typeof item.websiteUrl === 'string' &&
    isHttpUrl(item.websiteUrl)
  )
}

async function fetchAllies(signal?: AbortSignal): Promise<Ally[]> {
  const response = await fetch(`${API_URL}/allies`, { signal })
  if (!response.ok) {
    throw new Error(`GET /allies respondió ${response.status}`)
  }
  const data: unknown = await response.json()
  if (!Array.isArray(data)) {
    throw new Error('Respuesta inesperada de /allies')
  }
  // Solo se conservan aliados con un enlace http(s) válido
  return data.filter(isAlly)
}

// Una lista vacía es válida: la pantalla simplemente oculta la sección
export async function getAllies(signal?: AbortSignal): Promise<Ally[]> {
  try {
    return await fetchAllies(signal)
  } catch (error) {
    if (signal?.aborted || !USE_ALLIES_FALLBACK) throw error
    console.warn('Usando aliados de ejemplo:', error)
    return PLACEHOLDER_ALLIES
  }
}
