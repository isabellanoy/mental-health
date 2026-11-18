export type AdminRole = 'superadmin' | 'admin'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: AdminRole
  active: boolean
  createdAt: string
  lastLoginAt: string | null
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  admin: AdminUser
}

export interface PageMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface Paged<T> {
  data: T[]
  meta: PageMeta
}

export type SubmissionStatus = 'nuevo' | 'contactado' | 'cerrado'
export type Priority = 'alta' | 'normal'

export interface SubmissionRow {
  id: string
  createdAt: string
  name: string
  age: number
  mood: number
  emotions: string[]
  duration: string
  impact: number
  sleep: string
  appetite: string
  selfHarmThoughts: string
  priority: Priority
  email: string
  phone: string | null
  bestTime: string
  consent: boolean
  status: SubmissionStatus
  notes: string | null
}

export type VolunteerStatus = 'nuevo' | 'contactado' | 'activo' | 'descartado'

export interface VolunteerRow {
  id: string
  createdAt: string
  firstName: string
  lastName: string
  career: string
  semester: string | null
  email: string
  phone: string
  helpAreas: string[]
  availability: string
  message: string | null
  consent: boolean
  status: VolunteerStatus
  notes: string | null
}

export interface DailyCount {
  date: string
  count: number
}

export interface Stats {
  total: number
  nuevos: number
  prioridadAlta: number
  voluntariosTotal: number
  voluntariosNuevos: number
  enviosPorDia: DailyCount[]
}

export interface RouletteImageRow {
  id: string
  createdAt: string
  imageUrl: string
  storagePath: string
  active: boolean
}

export interface AllyRow {
  id: string
  createdAt: string
  name: string
  logoUrl: string
  storagePath: string
  websiteUrl: string
  position: number
  active: boolean
}
