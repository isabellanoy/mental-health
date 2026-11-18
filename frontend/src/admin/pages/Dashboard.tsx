import { Link } from 'react-router-dom'
import Button from '../../components/Button'
import { useAuth } from '../auth/useAuth'
import { useAsync } from '../hooks/useAsync'
import EmptyState from '../ui/EmptyState'
import Icon from '../ui/Icon'
import type { IconName } from '../ui/Icon'
import PageHeader from '../ui/PageHeader'
import { Skeleton } from '../ui/Skeleton'
import DailyChart from './DailyChart'

interface StatCardProps {
  label: string
  value: number
  icon: IconName
  to: string
  tone: string
  highlight?: boolean
}

function StatCard({ label, value, icon, to, tone, highlight = false }: StatCardProps) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-4 rounded-3xl p-4 shadow-suave transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${tone} ${
        highlight ? 'ring-2 ring-rosa-dark' : ''
      }`}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/80">
        <Icon name={icon} className="size-6" />
      </span>
      <span className="min-w-0">
        <span className="block text-3xl font-extrabold leading-none text-slate-800">{value}</span>
        <span className="mt-1 block text-sm font-bold text-slate-700">{label}</span>
      </span>
    </Link>
  )
}

function pending(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`
}

export default function Dashboard() {
  const { client, admin } = useAuth()
  const { data, error, loading, reload } = useAsync((signal) => client.stats(signal), 'stats')

  return (
    <>
      <PageHeader
        title={`Hola, ${admin?.name.split(' ')[0] ?? ''} 👋`}
        description="Así va todo hoy. Empieza por lo que está pendiente."
        actions={
          <Button variant="secondary" onClick={reload} disabled={loading}>
            <Icon name="refresh" className="size-4" />
            Actualizar
          </Button>
        }
      />

      {loading && !data && (
        <div role="status" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <span className="sr-only">Cargando resumen…</span>
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      )}

      {error && !data && (
        <EmptyState
          emoji="😕"
          title="No pudimos cargar el resumen"
          action={<Button onClick={reload}>Intentar de nuevo</Button>}
        >
          {error.message}
        </EmptyState>
      )}

      {data && (
        <div className="flex flex-col gap-6">
          <section aria-label="Totales" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Solicitudes de ayuda" value={data.total} icon="inbox" to="/admin/solicitudes" tone="bg-lila-light" />
            <StatCard label="Solicitudes nuevas" value={data.nuevos} icon="inbox" to="/admin/solicitudes?status=nuevo" tone="bg-celeste-light" />
            <StatCard
              label="Prioridad alta"
              value={data.prioridadAlta}
              icon="alert"
              to="/admin/solicitudes?priority=alta"
              tone="bg-rosa-light"
              highlight={data.prioridadAlta > 0}
            />
            <StatCard label="Voluntarios" value={data.voluntariosTotal} icon="heart" to="/admin/voluntarios" tone="bg-menta-light" />
            <StatCard label="Voluntarios nuevos" value={data.voluntariosNuevos} icon="heart" to="/admin/voluntarios?status=nuevo" tone="bg-durazno-light" />
          </section>

          <section aria-labelledby="pendientes" className="card-suave">
            <h2 id="pendientes" className="mb-3 text-xl font-extrabold text-slate-800">
              Pendiente por atender
            </h2>
            {data.prioridadAlta + data.nuevos + data.voluntariosNuevos === 0 ? (
              <p className="text-base text-slate-600">
                No hay nada pendiente. ¡Buen trabajo! 🌿
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.prioridadAlta > 0 && (
                  <li>
                    <Link
                      to="/admin/solicitudes?priority=alta&status=nuevo"
                      className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-rosa-light px-4 py-3 font-bold text-slate-800 hover:bg-rosa focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep"
                    >
                      <span>{pending(data.prioridadAlta, 'solicitud de prioridad alta', 'solicitudes de prioridad alta')}</span>
                      <Icon name="chevronRight" className="size-4 shrink-0" />
                    </Link>
                  </li>
                )}
                {data.nuevos > 0 && (
                  <li>
                    <Link
                      to="/admin/solicitudes?status=nuevo"
                      className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-celeste-light px-4 py-3 font-bold text-slate-800 hover:bg-celeste focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep"
                    >
                      <span>{pending(data.nuevos, 'solicitud nueva sin revisar', 'solicitudes nuevas sin revisar')}</span>
                      <Icon name="chevronRight" className="size-4 shrink-0" />
                    </Link>
                  </li>
                )}
                {data.voluntariosNuevos > 0 && (
                  <li>
                    <Link
                      to="/admin/voluntarios?status=nuevo"
                      className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-menta-light px-4 py-3 font-bold text-slate-800 hover:bg-menta focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep"
                    >
                      <span>{pending(data.voluntariosNuevos, 'voluntario por contactar', 'voluntarios por contactar')}</span>
                      <Icon name="chevronRight" className="size-4 shrink-0" />
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </section>

          <section aria-labelledby="grafico" className="card-suave">
            <h2 id="grafico" className="mb-1 text-xl font-extrabold text-slate-800">
              Solicitudes por día
            </h2>
            <p className="mb-4 text-sm text-slate-600">Últimos 14 días (hora UTC).</p>
            <DailyChart data={data.enviosPorDia} />
          </section>
        </div>
      )}
    </>
  )
}
