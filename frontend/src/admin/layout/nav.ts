import type { IconName } from '../ui/Icon'
import type { AdminRole } from '../types'

export interface NavItem {
  to: string
  label: string
  icon: IconName
  end?: boolean
  // Si se indica, el enlace solo se muestra a ese rol
  role?: AdminRole
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/admin', label: 'Resumen', icon: 'home', end: true },
  { to: '/admin/solicitudes', label: 'Solicitudes de ayuda', icon: 'inbox' },
  { to: '/admin/voluntarios', label: 'Voluntarios', icon: 'heart' },
  { to: '/admin/ruleta', label: 'Ruleta', icon: 'image' },
  { to: '/admin/aliados', label: 'Aliados', icon: 'link' },
  { to: '/admin/administradores', label: 'Administradores', icon: 'shield', role: 'superadmin' },
  { to: '/admin/cuenta', label: 'Mi cuenta', icon: 'user' },
]

export const ROLE_LABELS: Record<AdminRole, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
}
