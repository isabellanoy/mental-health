import type { AdminUser } from '../types'

const STORAGE_KEY = 'mh-admin-session-v1'

export interface Session {
  token: string
  admin: AdminUser
}

// Lee la fecha de expiración (en ms) del JWT; null si no se puede leer
export function tokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const { exp } = JSON.parse(json) as { exp?: unknown }
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Session> | null
    if (!parsed || typeof parsed.token !== 'string' || typeof parsed.admin?.id !== 'string') {
      return null
    }
    const expiry = tokenExpiry(parsed.token)
    if (expiry !== null && expiry <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed as Session
  } catch {
    return null
  }
}

export function saveSession(session: Session) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // sin sessionStorage la sesión solo dura mientras la pestaña no se recargue
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // nada que limpiar
  }
}

// Token en memoria: el cliente HTTP lo lee en cada petición sin depender del renderizado
let currentToken: string | null = null
export const getToken = () => currentToken
export const setToken = (token: string | null) => {
  currentToken = token
}
