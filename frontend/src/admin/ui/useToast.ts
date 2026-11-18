import { useContext } from 'react'
import { ToastContext } from './toastContext'

export function useToast() {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return value
}
