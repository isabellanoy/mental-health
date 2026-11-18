import { useState } from 'react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { useToast } from './useToast'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  // Debe lanzar un error si falla; el diálogo se queda abierto y avisa con un toast
  onConfirm: () => Promise<void>
  onClose: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Eliminar',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pudimos completar la acción.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={busy ? () => undefined : onClose} title={title}>
      <p className="mb-5 text-center text-base text-slate-700">{description}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button variant="secondary" onClick={onClose} disabled={busy} className="w-full">
          Cancelar
        </Button>
        <Button variant="danger" onClick={() => void confirm()} disabled={busy} className="w-full">
          {busy ? 'Un momento…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
