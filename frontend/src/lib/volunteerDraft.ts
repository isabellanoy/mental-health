import { volunteerSchema } from './volunteerSchema'
import type { VolunteerValues } from './volunteerSchema'

// Clave distinta a la del formulario de ayuda para que los borradores no se mezclen
const STORAGE_KEY = 'mh-volunteer-draft-v1'

export interface VolunteerDraft {
  step: number
  values: Partial<VolunteerValues>
}

// Conserva solo los valores que siguen siendo válidos para su campo
function sanitize(values: object): Partial<VolunteerValues> {
  const clean: Record<string, unknown> = {}
  for (const [key, schema] of Object.entries(volunteerSchema.shape)) {
    const value = (values as Record<string, unknown>)[key]
    if (value !== undefined && schema.safeParse(value).success) clean[key] = value
  }
  return clean as Partial<VolunteerValues>
}

export function loadVolunteerDraft(): VolunteerDraft | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const { step, values } = parsed as { step?: unknown; values?: unknown }
    if (typeof step !== 'number' || typeof values !== 'object' || values === null) return null
    return { step, values: sanitize(values) }
  } catch {
    return null
  }
}

export function saveVolunteerDraft(draft: VolunteerDraft) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // sessionStorage puede estar bloqueado (modo privado); el formulario sigue funcionando
  }
}

export function clearVolunteerDraft() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // nada que limpiar
  }
}
