import type {
  AdminRole,
  AdminUser,
  AllyRow,
  LoginResponse,
  Paged,
  Priority,
  RouletteImageRow,
  Stats,
  SubmissionRow,
  SubmissionStatus,
  VolunteerRow,
  VolunteerStatus,
} from '../types'

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const NETWORK_MESSAGE =
  'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'

function describeStatus(status: number): string {
  if (status === 429) return 'Demasiadas solicitudes. Espera un minuto e inténtalo de nuevo.'
  if (status === 413) return 'El archivo es demasiado grande para el servidor.'
  if (status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo en unos minutos.'
  return 'No pudimos completar la acción. Inténtalo de nuevo.'
}

function messageFrom(body: unknown, fallback: string): string {
  const raw = (body as { message?: unknown } | null)?.message
  if (Array.isArray(raw) && raw.length > 0) return raw.join(' ')
  if (typeof raw === 'string' && raw) return raw
  return fallback
}

async function toApiError(response: Response): Promise<ApiError> {
  let message = describeStatus(response.status)
  try {
    message = messageFrom(await response.json(), message)
  } catch {
    // el cuerpo no era JSON: se usa el mensaje por defecto
  }
  return new ApiError(response.status, message)
}

type Query = object

function withQuery(path: string, query?: Query): string {
  if (!query) return path
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  const text = params.toString()
  return text ? `${path}?${text}` : path
}

// Inicio de sesión: no necesita token ni cierra la sesión ante un 401
export async function login(email: string, password: string): Promise<LoginResponse> {
  let response: Response
  try {
    response = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    throw new ApiError(0, NETWORK_MESSAGE)
  }
  if (!response.ok) throw await toApiError(response)
  return (await response.json()) as LoginResponse
}

export interface AdminClientOptions {
  getToken: () => string | null
  // Se llama cuando el servidor responde 401 con un token guardado
  onUnauthorized: () => void
}

export interface SubmissionFilters {
  status?: SubmissionStatus | ''
  priority?: Priority | ''
}

export interface VolunteerFilters {
  status?: VolunteerStatus | ''
  search?: string
}

export type Delimiter = ',' | ';'

export interface NewAdmin {
  name: string
  email: string
  password: string
  role: AdminRole
}

export interface AdminChanges {
  name?: string
  role?: AdminRole
  active?: boolean
  password?: string
}

export interface AllyInput {
  name: string
  websiteUrl: string
  active: boolean
  logo?: File | null
}

interface SendOptions {
  body?: unknown
  form?: FormData
  query?: Query
  signal?: AbortSignal
}

function filenameFrom(response: Response, fallback: string): string {
  const header = response.headers.get('Content-Disposition') ?? ''
  const match = /filename="?([^";]+)"?/i.exec(header)
  return match?.[1] ?? fallback
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function createAdminClient({ getToken, onUnauthorized }: AdminClientOptions) {
  async function send(method: string, path: string, options: SendOptions = {}): Promise<Response> {
    const token = getToken()
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    let body: BodyInit | undefined
    if (options.form) {
      body = options.form
    } else if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(options.body)
    }

    let response: Response
    try {
      response = await fetch(`${API_URL}${withQuery(path, options.query)}`, {
        method,
        headers,
        body,
        signal: options.signal,
      })
    } catch (error) {
      if (options.signal?.aborted) throw error
      throw new ApiError(0, NETWORK_MESSAGE)
    }

    if (!response.ok) {
      const error = await toApiError(response)
      if (response.status === 401 && token) onUnauthorized()
      throw error
    }
    return response
  }

  async function json<T>(method: string, path: string, options?: SendOptions): Promise<T> {
    const response = await send(method, path, options)
    return (await response.json()) as T
  }

  async function empty(method: string, path: string, options?: SendOptions) {
    await send(method, path, options)
  }

  async function download(path: string, query: Query, fallbackName: string) {
    const response = await send('GET', path, { query })
    saveBlob(await response.blob(), filenameFrom(response, fallbackName))
  }

  // XMLHttpRequest permite informar el progreso de la subida, cosa que fetch todavía no hace
  function upload(path: string, form: FormData, onProgress: (percent: number) => void) {
    return new Promise<void>((resolve, reject) => {
      const token = getToken()
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_URL}${path}`)
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
      }
      xhr.onerror = () => reject(new ApiError(0, NETWORK_MESSAGE))
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100)
          resolve()
          return
        }
        let message = describeStatus(xhr.status)
        try {
          message = messageFrom(JSON.parse(xhr.responseText), message)
        } catch {
          // sin cuerpo JSON
        }
        if (xhr.status === 401 && token) onUnauthorized()
        reject(new ApiError(xhr.status, message))
      }
      xhr.send(form)
    })
  }

  const allyForm = (input: AllyInput) => {
    const form = new FormData()
    form.set('name', input.name)
    form.set('website_url', input.websiteUrl)
    form.set('active', String(input.active))
    if (input.logo) form.set('logo', input.logo)
    return form
  }

  return {
    me: (signal?: AbortSignal) => json<AdminUser>('GET', '/admin/me', { signal }),
    changePassword: (currentPassword: string, newPassword: string) =>
      empty('PATCH', '/admin/me/password', { body: { currentPassword, newPassword } }),

    stats: (signal?: AbortSignal) => json<Stats>('GET', '/admin/stats', { signal }),

    listSubmissions: (
      query: SubmissionFilters & { page: number; pageSize: number },
      signal?: AbortSignal,
    ) => json<Paged<SubmissionRow>>('GET', '/admin/submissions', { query, signal }),
    updateSubmission: (id: string, body: { status?: SubmissionStatus; notes?: string | null }) =>
      json<SubmissionRow>('PATCH', `/admin/submissions/${id}`, { body }),
    deleteSubmission: (id: string) => empty('DELETE', `/admin/submissions/${id}`),
    exportSubmissions: (filters: SubmissionFilters, delimiter: Delimiter) =>
      download('/admin/submissions/export', { ...filters, delimiter }, 'solicitudes.csv'),

    listVolunteers: (
      query: VolunteerFilters & { page: number; pageSize: number },
      signal?: AbortSignal,
    ) => json<Paged<VolunteerRow>>('GET', '/admin/volunteers', { query, signal }),
    updateVolunteer: (id: string, body: { status?: VolunteerStatus; notes?: string | null }) =>
      json<VolunteerRow>('PATCH', `/admin/volunteers/${id}`, { body }),
    deleteVolunteer: (id: string) => empty('DELETE', `/admin/volunteers/${id}`),
    exportVolunteers: (filters: VolunteerFilters, delimiter: Delimiter) =>
      download('/admin/volunteers/export', { ...filters, delimiter }, 'voluntarios.csv'),

    listRoulette: (signal?: AbortSignal) =>
      json<RouletteImageRow[]>('GET', '/admin/roulette-images', { signal }),
    uploadRouletteImage: (file: File, onProgress: (percent: number) => void) => {
      const form = new FormData()
      form.append('files', file)
      return upload('/admin/roulette-images', form, onProgress)
    },
    setRouletteActive: (id: string, active: boolean) =>
      json<RouletteImageRow>('PATCH', `/admin/roulette-images/${id}`, { body: { active } }),
    deleteRouletteImage: (id: string) => empty('DELETE', `/admin/roulette-images/${id}`),

    listAllies: (signal?: AbortSignal) => json<AllyRow[]>('GET', '/admin/allies', { signal }),
    createAlly: (input: AllyInput) =>
      json<AllyRow>('POST', '/admin/allies', { form: allyForm(input) }),
    // Con un logo nuevo se envía multipart; sin logo basta con JSON
    updateAlly: (id: string, input: AllyInput) =>
      input.logo
        ? json<AllyRow>('PATCH', `/admin/allies/${id}`, { form: allyForm(input) })
        : json<AllyRow>('PATCH', `/admin/allies/${id}`, {
            body: { name: input.name, website_url: input.websiteUrl, active: input.active },
          }),
    setAllyPosition: (id: string, position: number) =>
      json<AllyRow>('PATCH', `/admin/allies/${id}`, { body: { position } }),
    deleteAlly: (id: string) => empty('DELETE', `/admin/allies/${id}`),

    listAdmins: (signal?: AbortSignal) => json<AdminUser[]>('GET', '/admin/admins', { signal }),
    createAdmin: (body: NewAdmin) => json<AdminUser>('POST', '/admin/admins', { body }),
    updateAdmin: (id: string, body: AdminChanges) =>
      json<AdminUser>('PATCH', `/admin/admins/${id}`, { body }),
    deleteAdmin: (id: string) => empty('DELETE', `/admin/admins/${id}`),
  }
}

export type AdminClient = ReturnType<typeof createAdminClient>
