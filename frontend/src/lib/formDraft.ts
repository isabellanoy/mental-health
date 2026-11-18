import { formSchema } from './formSchema'
import type { FormValues } from './formSchema'

const STORAGE_KEY = 'mh-form-draft-v1'

export interface Draft {
  step: number
  values: Partial<FormValues>
}

// Conserva solo los valores que siguen siendo válidos para su campo
function sanitize(values: object): Partial<FormValues> {
  const clean: Record<string, unknown> = {}
  for (const [key, schema] of Object.entries(formSchema.shape)) {
    const value = (values as Record<string, unknown>)[key]
    if (value !== undefined && schema.safeParse(value).success) clean[key] = value
  }
  return clean as Partial<FormValues>
}

export function loadDraft(): Draft | null {
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

export function saveDraft(draft: Draft) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // sessionStorage puede estar bloqueado (modo privado); el formulario sigue funcionando
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // nada que limpiar
  }
}
