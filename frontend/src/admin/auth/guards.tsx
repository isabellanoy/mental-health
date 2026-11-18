import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { AdminRole } from '../types'
import { useAuth } from './useAuth'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { admin } = useAuth()
  const location = useLocation()
  if (!admin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

// Páginas visibles solo para un rol (la API también lo exige: esto solo evita pantallas de error)
export function RequireRole({ role, children }: { role: AdminRole; children: ReactNode }) {
  const { admin } = useAuth()
  if (admin?.role !== role) return <Navigate to="/admin" replace />
  return <>{children}</>
}
