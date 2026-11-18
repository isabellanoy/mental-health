import { useCallback, useEffect, useRef, useState } from 'react'

interface AsyncState<T> {
  // Identifica la petición que produjo este estado
  id: string | null
  data: T | undefined
  error: Error | undefined
}

// Carga datos al montar y cada vez que cambia `key` (los parámetros serializados).
// `fetcher` puede cambiar en cada render: se lee desde una referencia.
export function useAsync<T>(fetcher: (signal: AbortSignal) => Promise<T>, key: string) {
  const [state, setState] = useState<AsyncState<T>>({ id: null, data: undefined, error: undefined })
  const [tick, setTick] = useState(0)
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const requestId = `${key}#${tick}`

  useEffect(() => {
    const controller = new AbortController()
    fetcherRef
      .current(controller.signal)
      .then((data) => setState({ id: requestId, data, error: undefined }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({
          id: requestId,
          data: undefined,
          error: error instanceof Error ? error : new Error('Error inesperado'),
        })
      })
    return () => controller.abort()
  }, [requestId])

  const reload = useCallback(() => setTick((value) => value + 1), [])
  const setData = useCallback(
    (update: (current: T | undefined) => T | undefined) =>
      setState((current) => ({ ...current, data: update(current.data) })),
    [],
  )

  const settled = state.id === requestId
  return {
    data: state.data,
    // Mientras llega la respuesta nueva se sigue mostrando la anterior
    loading: !settled,
    error: settled ? state.error : undefined,
    reload,
    setData,
  }
}
