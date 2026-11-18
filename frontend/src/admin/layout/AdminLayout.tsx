import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Suspense, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Button from '../../components/Button'
import { useAuth } from '../auth/useAuth'
import Badge from '../ui/Badge'
import Icon from '../ui/Icon'
import { ListSkeleton } from '../ui/Skeleton'
import Tip from '../ui/Tip'
import type { AdminUser } from '../types'
import { NAV_ITEMS, ROLE_LABELS } from './nav'
import type { NavItem } from './nav'

const COLLAPSE_KEY = 'mh-admin-sidebar-collapsed'

function linkClass(isActive: boolean, collapsed: boolean) {
  return `flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep ${
    collapsed ? 'justify-center' : ''
  } ${isActive ? 'bg-lila text-slate-900 shadow-suave' : 'text-slate-700 hover:bg-lila-light'}`
}

function NavList({
  items,
  collapsed = false,
  onNavigate,
}: {
  items: NavItem[]
  collapsed?: boolean
  onNavigate?: () => void
}) {
  return (
    <nav aria-label="Secciones del panel">
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const link = (
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              aria-label={collapsed ? item.label : undefined}
              className={({ isActive }) => linkClass(isActive, collapsed)}
            >
              <Icon name={item.icon} className="size-5 shrink-0" />
              {!collapsed && <span className="min-w-0 truncate">{item.label}</span>}
            </NavLink>
          )
          return (
            <li key={item.to}>
              {collapsed ? (
                <Tip label={item.label} side="right">
                  {link}
                </Tip>
              ) : (
                link
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

const FOCUSABLE = 'a[href], button:not([disabled])'

function NavDrawer({
  open,
  items,
  onClose,
  user,
}: {
  open: boolean
  items: NavItem[]
  onClose: () => void
  user: AdminUser | null
}) {
  const reduceMotion = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.({ preventScroll: true })
    }
  }, [open, onClose])

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !panelRef.current) return
    const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label="Cerrar menú"
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            onKeyDown={trapFocus}
            className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col gap-4 overflow-y-auto bg-crema p-4 shadow-suave-lg"
            initial={{ x: reduceMotion ? 0 : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: reduceMotion ? 0 : '-100%' }}
            transition={{ type: 'tween', duration: 0.22 }}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="px-2 text-lg font-extrabold text-slate-800">💜 Panel</p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar menú"
                className="flex size-11 items-center justify-center rounded-pill bg-white shadow-suave hover:bg-lila-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep"
              >
                <Icon name="close" />
              </button>
            </div>
            {user && (
              <div className="rounded-2xl bg-white p-3 shadow-suave">
                <p className="truncate text-sm font-extrabold text-slate-800">{user.name}</p>
                <p className="truncate text-xs text-slate-600">{user.email}</p>
                <Badge tone={user.role === 'superadmin' ? 'lila' : 'celeste'} className="mt-2">
                  {ROLE_LABELS[user.role]}
                </Badge>
              </div>
            )}
            <NavList items={items} onNavigate={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function AdminLayout() {
  const { admin, signOut } = useAuth()
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1'
    } catch {
      return false
    }
  })

  const items = NAV_ITEMS.filter((item) => !item.role || item.role === admin?.role)
  const current = items.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
  )

  useEffect(() => {
    document.title = `${current?.label ?? 'Panel'} · Panel de administración`
  }, [current?.label])

  // Al cambiar de sección se lleva el foco al contenido para que lectores de pantalla y teclado sigan el cambio
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    mainRef.current?.focus({ preventScroll: true })
  }, [location.pathname])

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, value ? '0' : '1')
      } catch {
        // la preferencia simplemente no se recuerda
      }
      return !value
    })
  }

  return (
    <div className="flex min-h-dvh bg-crema bg-pastel-aurora">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-pill focus:bg-white focus:px-4 focus:py-2 focus:font-bold focus:shadow-suave-lg"
      >
        Saltar al contenido
      </a>

      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 flex-col gap-4 border-r border-lila-light bg-white/80 p-3 backdrop-blur transition-[width] duration-200 motion-reduce:transition-none lg:flex ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between px-2'}`}>
          {!collapsed && <p className="text-lg font-extrabold text-slate-800">💜 Panel</p>}
          <Tip label={collapsed ? 'Expandir menú' : 'Contraer menú'} side="right">
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
              aria-expanded={!collapsed}
              className="flex size-11 items-center justify-center rounded-pill text-slate-600 hover:bg-lila-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep"
            >
              <Icon name="sidebar" />
            </button>
          </Tip>
        </div>
        <NavList items={items} collapsed={collapsed} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-lila-light bg-white/85 px-3 py-2 backdrop-blur sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menú"
              aria-haspopup="dialog"
              className="flex size-11 shrink-0 items-center justify-center rounded-pill text-slate-700 hover:bg-lila-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep lg:hidden"
            >
              <Icon name="menu" />
            </button>
            <p className="truncate text-base font-extrabold text-slate-800 lg:hidden">
              {current?.label ?? 'Panel'}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-extrabold text-slate-800">{admin?.name}</p>
              <p className="truncate text-xs text-slate-600">{admin?.email}</p>
            </div>
            {admin && (
              <Badge tone={admin.role === 'superadmin' ? 'lila' : 'celeste'} className="hidden sm:inline-flex">
                {ROLE_LABELS[admin.role]}
              </Badge>
            )}
            <Button variant="secondary" onClick={signOut} aria-label="Cerrar sesión" className="shrink-0 px-3 sm:px-6">
              <Icon name="logout" className="size-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </Button>
          </div>
        </header>

        <main
          id="contenido"
          ref={mainRef}
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl flex-1 px-3 py-6 outline-none sm:px-6 sm:py-8"
        >
          <Suspense fallback={<ListSkeleton label="Cargando sección…" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <NavDrawer open={drawerOpen} items={items} onClose={() => setDrawerOpen(false)} user={admin} />
    </div>
  )
}
