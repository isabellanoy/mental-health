import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '../../components/Button'
import { useAuth } from '../auth/useAuth'
import { formatLastAccess } from '../lib/format'
import { MIN_PASSWORD_LENGTH } from '../lib/passwords'
import { ROLE_LABELS } from '../layout/nav'
import Badge from '../ui/Badge'
import { Detail, DetailGrid } from '../ui/Detail'
import PageHeader from '../ui/PageHeader'
import PasswordField from '../ui/PasswordField'
import { useToast } from '../ui/useToast'

export default function Account() {
  const { admin, client } = useAuth()
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({})
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    const found: typeof errors = {}
    if (!current) found.current = 'Escribe tu contraseña actual.'
    if (next.length < MIN_PASSWORD_LENGTH) {
      found.next = `La contraseña nueva debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
    } else if (next === current) {
      found.next = 'La contraseña nueva debe ser distinta de la actual.'
    }
    if (confirm !== next) found.confirm = 'Las contraseñas no coinciden.'
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    try {
      await client.changePassword(current, next)
      toast.success('Contraseña actualizada. Úsala la próxima vez que entres.')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'No pudimos cambiar la contraseña.'
      toast.error(message)
      setErrors({ current: message.includes('actual') ? message : undefined })
    } finally {
      setSaving(false)
    }
  }

  if (!admin) return null

  return (
    <>
      <PageHeader title="Mi cuenta" description="Tus datos y tu contraseña." />

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="datos" className="card-suave flex flex-col gap-4">
          <h2 id="datos" className="text-xl font-extrabold text-slate-800">
            Mis datos
          </h2>
          <DetailGrid>
            <Detail label="Nombre">{admin.name}</Detail>
            <Detail label="Correo">{admin.email}</Detail>
            <Detail label="Rol">
              <Badge tone={admin.role === 'superadmin' ? 'lila' : 'celeste'}>{ROLE_LABELS[admin.role]}</Badge>
            </Detail>
            <Detail label="Último acceso">{formatLastAccess(admin.lastLoginAt)}</Detail>
          </DetailGrid>
        </section>

        <section aria-labelledby="clave" className="card-suave">
          <h2 id="clave" className="mb-4 text-xl font-extrabold text-slate-800">
            Cambiar contraseña
          </h2>
          <form onSubmit={(event) => void submit(event)} noValidate aria-busy={saving} className="flex flex-col gap-4">
            <PasswordField label="Contraseña actual" value={current} onChange={setCurrent} autoComplete="current-password" error={errors.current} />
            <PasswordField label="Contraseña nueva" hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`} value={next} onChange={setNext} error={errors.next} generator />
            <PasswordField label="Repite la contraseña nueva" value={confirm} onChange={setConfirm} error={errors.confirm} />
            <Button type="submit" disabled={saving} className="self-start">
              {saving ? 'Guardando…' : 'Cambiar contraseña'}
            </Button>
          </form>
        </section>
      </div>
    </>
  )
}
