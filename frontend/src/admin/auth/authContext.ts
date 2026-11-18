import { createContext } from 'react'
import type { AdminClient } from '../api/adminClient'
import type { AdminUser } from '../types'

export interface AuthContextValue {
  admin: AdminUser | null
  // Cliente HTTP que adjunta el token y cierra la sesión ante un 401
  client: AdminClient
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  updateAdmin: (admin: AdminUser) => void
  // true cuando la sesión se cerró porque el servidor la rechazó o el token venció
  sessionExpired: boolean
  dismissExpired: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
