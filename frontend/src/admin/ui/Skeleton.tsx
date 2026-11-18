export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-2xl bg-white/80 motion-safe:animate-pulse ${className}`}
    />
  )
}

// Marcador de carga para listas: anuncia el estado una sola vez a lectores de pantalla
export function ListSkeleton({ rows = 5, label = 'Cargando…' }: { rows?: number; label?: string }) {
  return (
    <div role="status" className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-16" />
      ))}
    </div>
  )
}
