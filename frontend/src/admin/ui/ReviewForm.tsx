import { useState } from 'react'
import Button from '../../components/Button'
import TextAreaField from '../../components/form/TextAreaField'
import SelectField from './SelectField'
import Icon from './Icon'
import { useToast } from './useToast'

interface ReviewFormProps {
  statusOptions: readonly { value: string; label: string }[]
  status: string
  notes: string | null
  onSave: (changes: { status: string; notes: string | null }) => Promise<void>
  onDelete: () => void
}

const NOTES_MAX = 2000

// Estado y notas de seguimiento, compartido por solicitudes y voluntarios
export default function ReviewForm({ statusOptions, status, notes, onSave, onDelete }: ReviewFormProps) {
  const [draftStatus, setDraftStatus] = useState(status)
  const [draftNotes, setDraftNotes] = useState(notes ?? '')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const changed = draftStatus !== status || draftNotes.trim() !== (notes ?? '').trim()

  const save = async () => {
    setSaving(true)
    try {
      await onSave({ status: draftStatus, notes: draftNotes.trim() ? draftNotes.trim() : null })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pudimos guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-label="Seguimiento" className="flex flex-col gap-4 rounded-3xl bg-white/70 p-4">
      <SelectField
        label="Estado"
        value={draftStatus}
        onChange={(event) => setDraftStatus(event.target.value)}
        options={statusOptions}
      />
      <TextAreaField
        label="Notas internas"
        hint="Solo las ve el equipo."
        maxLength={NOTES_MAX}
        length={draftNotes.length}
        value={draftNotes}
        onChange={(event) => setDraftNotes(event.target.value)}
        placeholder="Por ejemplo: se llamó el lunes, quedó en responder…"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="danger" onClick={onDelete} disabled={saving}>
          <Icon name="trash" className="size-4" />
          Eliminar
        </Button>
        <Button onClick={() => void save()} disabled={!changed || saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </section>
  )
}
