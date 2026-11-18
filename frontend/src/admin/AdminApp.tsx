import { lazy } from 'react'
import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AuthProvider from './auth/AuthProvider'
import { RequireAuth, RequireRole } from './auth/guards'
import AdminLayout from './layout/AdminLayout'
import Login from './pages/Login'
import ToastProvider from './ui/ToastProvider'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Submissions = lazy(() => import('./pages/Submissions'))
const Volunteers = lazy(() => import('./pages/Volunteers'))
const Roulette = lazy(() => import('./pages/Roulette'))
const Allies = lazy(() => import('./pages/Allies'))
const Admins = lazy(() => import('./pages/Admins'))
const Account = lazy(() => import('./pages/Account'))

// Las páginas del panel no deben aparecer en buscadores
function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])
}

export default function AdminApp() {
  useNoIndex()

  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="solicitudes" element={<Submissions />} />
            <Route path="voluntarios" element={<Volunteers />} />
            <Route path="ruleta" element={<Roulette />} />
            <Route path="aliados" element={<Allies />} />
            <Route
              path="administradores"
              element={
                <RequireRole role="superadmin">
                  <Admins />
                </RequireRole>
              }
            />
            <Route path="cuenta" element={<Account />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ToastProvider>
  )
}
