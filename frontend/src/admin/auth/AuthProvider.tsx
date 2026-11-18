import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { createAdminClient, login } from '../api/adminClient'
import type { AdminUser } from '../types'
import { AuthContext } from './authContext'
import type { AuthContextValue } from './authContext'
import { clearSession, getToken, loadSession, saveSession, setToken, tokenExpiry } from './session'
import type { Session } from './session'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const stored = loadSession()
    setToken(stored?.token ?? null)
    return stored
  })
  const [sessionExpired, setSessionExpired] = useState(false)

  const endSession = useCallback((expired: boolean) => {
    setToken(null)
    clearSession()
    setSession(null)
    if (expired) setSessionExpired(true)
  }, [])

  const client = useMemo(
    () =>
      createAdminClient({
        getToken,
        onUnauthorized: () => {
          // Solo importa si todavía había una sesión abierta
          if (getToken()) endSession(true)
        },
      }),
    [endSession],
  )

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await login(email, password)
    const next = { token: result.accessToken, admin: result.admin }
    setToken(next.token)
    saveSession(next)
    setSessionExpired(false)
    setSession(next)
  }, [])

  const signOut = useCallback(() => endSession(false), [endSession])

  const updateAdmin = useCallback((admin: AdminUser) => {
    setSession((current) => {
      if (!current) return current
      const next = { ...current, admin }
      saveSession(next)
      return next
    })
  }, [])

  const token = session?.token ?? null

  // Cierra la sesión justo cuando vence el token
  useEffect(() => {
    if (!token) return
    const expiry = tokenExpiry(token)
    if (expiry === null) return
    const timer = window.setTimeout(() => endSession(true), Math.max(0, expiry - Date.now()))
    return () => window.clearTimeout(timer)
  }, [token, endSession])

  // Al abrir el panel se confirma con el servidor que la sesión sigue vigente y se refrescan nombre y rol
  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    client
      .me(controller.signal)
      .then(updateAdmin)
      .catch(() => undefined)
    return () => controller.abort()
  }, [token, client, updateAdmin])

  const value = useMemo<AuthContextValue>(
    () => ({
      admin: session?.admin ?? null,
      client,
      signIn,
      signOut,
      updateAdmin,
      sessionExpired,
      dismissExpired: () => setSessionExpired(false),
    }),
    [session?.admin, client, signIn, signOut, updateAdmin, sessionExpired],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
