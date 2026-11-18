import { AnimatePresence } from 'framer-motion'
import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import PageTransition from './components/PageTransition'
import Home from './pages/Home'
import Placeholder from './pages/Placeholder'
import Roulette from './pages/Roulette'
import Thanks from './pages/Thanks'

// El formulario carga react-hook-form y zod, así que se descarga solo cuando se necesita
const Form = lazy(() => import('./pages/Form'))
const Volunteer = lazy(() => import('./pages/Volunteer'))
// El panel de administración va en su propio bloque: el sitio público no lo descarga
const AdminApp = lazy(() => import('./admin/AdminApp'))

export default function App() {
  const location = useLocation()

  // El panel gestiona sus propias transiciones; así no se reinicia al cambiar de sección
  if (location.pathname === '/admin' || location.pathname.startsWith('/admin/')) {
    return (
      <Suspense fallback={null}>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/ruleta" element={<PageTransition><Roulette /></PageTransition>} />
        <Route
          path="/formulario"
          element={
            <PageTransition>
              <Suspense fallback={null}>
                <Form />
              </Suspense>
            </PageTransition>
          }
        />
        <Route
          path="/voluntarios"
          element={
            <PageTransition>
              <Suspense fallback={null}>
                <Volunteer />
              </Suspense>
            </PageTransition>
          }
        />
        <Route path="/gracias" element={<PageTransition><Thanks /></PageTransition>} />
        <Route path="*" element={<Placeholder title="Página no encontrada" />} />
      </Routes>
    </AnimatePresence>
  )
}
