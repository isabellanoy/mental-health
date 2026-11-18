export default function FieldError({ id, message }: { id: string; message?: string }) {
  // La región siempre existe para que los lectores de pantalla anuncien el cambio
  return (
    <p id={id} aria-live="polite" className="min-h-6 pt-1 text-sm font-semibold text-rose-700">
      {message}
    </p>
  )
}
