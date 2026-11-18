const dateTime = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' })
const dateOnly = new Intl.DateTimeFormat('es', { dateStyle: 'medium' })

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))
export const formatDate = (iso: string) => dateOnly.format(new Date(iso))

export function formatLastAccess(iso: string | null): string {
  return iso ? formatDateTime(iso) : 'Nunca'
}

export function labelOf(
  options: readonly { value: string | number; label: string }[],
  value: string | number,
): string {
  return options.find((option) => option.value === value)?.label ?? String(value)
}

// wa.me solo acepta dígitos con el código de país
export function whatsappLink(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}`
}

export function telLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
