import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import CheckboxField from '../../components/form/CheckboxField'
import TextField from '../../components/form/TextField'
import type { AdminChanges } from '../api/adminClient'
import { useAuth } from '../auth/useAuth'
import { useAsync } from '../hooks/useAsync'
import { formatLastAccess } from '../lib/format'
import { MIN_PASSWORD_LENGTH } from '../lib/passwords'
import { ROLE_LABELS } from '../layout/nav'
import Badge from '../ui/Badge'
import ConfirmDialog from '../ui/ConfirmDialog'
import EmptyState from '../ui/EmptyState'
import Icon from '../ui/Icon'
import PageHeader from '../ui/PageHeader'
import PasswordField from '../ui/PasswordField'
import SelectField from '../ui/SelectField'
import { ListSkeleton } from '../ui/Skeleton'
import Tip from '../ui/Tip'
import { useToast } from '../ui/useToast'
import type { AdminRole, AdminUser } from '../types'

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin · gestiona el contenido' },
  { value: 'superadmin', label: 'Superadmin · además gestiona administradores' },
] as const

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; admin: AdminUser }
  | { kind: 'reset'; admin: AdminUser }
  | { kind: 'delete'; admin: AdminUser }
  | null

function CreateForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { client } = useAuth()
  const toast = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AdminRole>('admin')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Escribe el nombre de la persona.'
    if (!EMAIL.test(email.trim())) next.email = 'Revisa el correo (por ejemplo: nombre@correo.com).'
    if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSaving(true)
    try {
      await client.createAdmin({ name: name.trim(), email: email.trim(), password, role })
      toast.success('Administrador creado. Comparte la contraseña por un canal seguro.')
      onDone()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos crear al administrador.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate aria-busy={saving} className="flex flex-col gap-4">
      <TextField label="Nombre" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} autoComplete="off" error={errors.name} />
      <TextField label="Correo electrónico" type="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="off" error={errors.email} />
      <PasswordField
        label="Contraseña inicial"
        hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres. Puedes generar una segura y copiarla.`}
        value={password}
        onChange={setPassword}
        error={errors.password}
        generator
      />
      <SelectField label="Rol" value={role} onChange={(event) => setRole(event.target.value as AdminRole)} options={ROLE_OPTIONS} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button variant="secondary" onClick={onCancel} disabled={saving} className="w-full">
          Cancelar
        </Button>
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Creando…' : 'Crear administrador'}
        </Button>
      </div>
    </form>
  )
}

function EditForm({
  target,
  isSelf,
  isLastSuperadmin,
  onDone,
  onCancel,
}: {
  target: AdminUser
  isSelf: boolean
  isLastSuperadmin: boolean
  onDone: () => void
  onCancel: () => void
}) {
  const { client } = useAuth()
  const toast = useToast()
  const [name, setName] = useState(target.name)
  const [role, setRole] = useState<AdminRole>(target.role)
  const [active, setActive] = useState(target.active)
  const [nameError, setNameError] = useState('')
  const [saving, setSaving] = useState(false)

  const locked = isSelf || isLastSuperadmin
  const lockReason = isSelf
    ? 'No puedes cambiar tu propio rol ni desactivarte. Pídeselo a otro superadministrador.'
    : 'Es el único superadministrador activo: debe quedar al menos uno.'

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    if (!name.trim()) {
      setNameError('Escribe el nombre de la persona.')
      return
    }
    const changes: AdminChanges = {}
    if (name.trim() !== target.name) changes.name = name.trim()
    if (role !== target.role) changes.role = role
    if (active !== target.active) changes.active = active
    if (Object.keys(changes).length === 0) {
      onCancel()
      return
    }
    setSaving(true)
    try {
      await client.updateAdmin(target.id, changes)
      toast.success('Cambios guardados.')
      onDone()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos guardar los cambios.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate aria-busy={saving} className="flex flex-col gap-4">
      <p className="text-center text-sm text-slate-600">{target.email}</p>
      <TextField label="Nombre" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} error={nameError} />
      <SelectField label="Rol" value={role} onChange={(event) => setRole(event.target.value as AdminRole)} options={ROLE_OPTIONS} disabled={locked} hint={locked ? lockReason : undefined} />
      <CheckboxField checked={active} onChange={(event) => setActive(event.target.checked)} disabled={locked}>
        Cuenta activa (si la desactivas, pierde el acceso de inmediato)
      </CheckboxField>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button variant="secondary" onClick={onCancel} disabled={saving} className="w-full">
          Cancelar
        </Button>
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}

function ResetForm({ target, onDone, onCancel }: { target: AdminUser; onDone: () => void; onCancel: () => void }) {
  const { client } = useAuth()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      return
    }
    setError('')
    setSaving(true)
    try {
      await client.updateAdmin(target.id, { password })
      toast.success('Contraseña restablecida. Compártela por un canal seguro.')
      onDone()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos restablecer la contraseña.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate aria-busy={saving} className="flex flex-col gap-4">
      <p className="text-center text-sm text-slate-600">
        {target.name} · {target.email}
      </p>
      <PasswordField label="Contraseña nueva" hint="Cópiala antes de guardar: después no se puede volver a ver." value={password} onChange={setPassword} error={error} generator />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button variant="secondary" onClick={onCancel} disabled={saving} className="w-full">
          Cancelar
        </Button>
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Guardando…' : 'Restablecer contraseña'}
        </Button>
      </div>
    </form>
  )
}

const rowButton =
  'flex size-11 items-center justify-center rounded-pill text-slate-700 hover:bg-lila-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep disabled:cursor-not-allowed disabled:opacity-40'

export default function Admins() {
  const { client, admin: me } = useAuth()
  const toast = useToast()
  const { data, error, loading, reload } = useAsync((signal) => client.listAdmins(signal), 'admins')
  const [dialog, setDialog] = useState<Dialog>(null)

  const close = () => setDialog(null)
  const done = () => {
    close()
    reload()
  }

  const activeSuperadmins = data?.filter((item) => item.role === 'superadmin' && item.active).length ?? 0
  const isLast = (item: AdminUser) => item.role === 'superadmin' && item.active && activeSuperadmins <= 1

  const remove = async (target: AdminUser) => {
    await client.deleteAdmin(target.id)
    toast.success('Administrador eliminado.')
    reload()
  }

  return (
    <>
      <PageHeader
        title="Administradores"
        description="Quién puede entrar al panel. Desactivar una cuenta le corta el acceso de inmediato."
        actions={
          <Button onClick={() => setDialog({ kind: 'create' })}>
            <Icon name="plus" className="size-4" />
            Nuevo administrador
          </Button>
        }
      />

      {loading && !data && <ListSkeleton label="Cargando administradores…" />}

      {error && !data && (
        <EmptyState emoji="😕" title="No pudimos cargar los administradores" action={<Button onClick={reload}>Intentar de nuevo</Button>}>
          {error.message}
        </EmptyState>
      )}

      {data && (
        <ul className="flex flex-col gap-3">
          {data.map((item) => {
            const self = item.id === me?.id
            const last = isLast(item)
            const deleteBlocked = self || last
            const blockedReason = self ? 'No puedes eliminarte a ti mismo' : 'Debe quedar al menos un superadmin activo'
            return (
              <li key={item.id} className={`flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-suave md:flex-row md:items-center ${item.active ? '' : 'opacity-75'}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-lg font-extrabold text-slate-800">{item.name}</p>
                    {self && <Badge tone="lila">Tú</Badge>}
                    <Badge tone={item.role === 'superadmin' ? 'lila' : 'celeste'}>{ROLE_LABELS[item.role]}</Badge>
                    <Badge tone={item.active ? 'menta' : 'rosa'}>{item.active ? 'Activo' : 'Desactivado'}</Badge>
                  </div>
                  <p className="truncate text-sm text-slate-600">{item.email}</p>
                  <p className="text-xs text-slate-500">Último acceso: {formatLastAccess(item.lastLoginAt)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Tip label="Editar">
                    <button type="button" className={rowButton} aria-label={`Editar a ${item.name}`} onClick={() => setDialog({ kind: 'edit', admin: item })}>
                      <Icon name="edit" />
                    </button>
                  </Tip>
                  {!self && (
                    <Tip label="Restablecer contraseña">
                      <button type="button" className={rowButton} aria-label={`Restablecer la contraseña de ${item.name}`} onClick={() => setDialog({ kind: 'reset', admin: item })}>
                        <Icon name="key" />
                      </button>
                    </Tip>
                  )}
                  <Tip label={deleteBlocked ? blockedReason : 'Eliminar'}>
                    <button
                      type="button"
                      className={`${rowButton} text-rose-800 hover:bg-rosa-light`}
                      aria-label={`Eliminar a ${item.name}`}
                      aria-disabled={deleteBlocked}
                      disabled={deleteBlocked}
                      onClick={() => setDialog({ kind: 'delete', admin: item })}
                    >
                      <Icon name="trash" />
                    </button>
                  </Tip>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Modal open={dialog?.kind === 'create'} onClose={close} title="Nuevo administrador" size="lg">
        {dialog?.kind === 'create' && <CreateForm onDone={done} onCancel={close} />}
      </Modal>

      <Modal open={dialog?.kind === 'edit'} onClose={close} title="Editar administrador" size="lg">
        {dialog?.kind === 'edit' && (
          <EditForm
            key={dialog.admin.id}
            target={dialog.admin}
            isSelf={dialog.admin.id === me?.id}
            isLastSuperadmin={isLast(dialog.admin)}
            onDone={done}
            onCancel={close}
          />
        )}
      </Modal>

      <Modal open={dialog?.kind === 'reset'} onClose={close} title="Restablecer contraseña" size="lg">
        {dialog?.kind === 'reset' && <ResetForm key={dialog.admin.id} target={dialog.admin} onDone={done} onCancel={close} />}
      </Modal>

      <ConfirmDialog
        open={dialog?.kind === 'delete'}
        title="¿Eliminar a este administrador?"
        description={`${dialog?.kind === 'delete' ? dialog.admin.name : 'Esta persona'} perderá el acceso al panel de forma permanente. Si solo quieres pausarlo, desactiva su cuenta.`}
        onConfirm={() => (dialog?.kind === 'delete' ? remove(dialog.admin) : Promise.resolve())}
        onClose={close}
      />
    </>
  )
}
