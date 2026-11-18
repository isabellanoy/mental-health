import { useState } from 'react'
import Button from '../../components/Button'
import type { Delimiter } from '../api/adminClient'
import Icon from './Icon'
import SelectField from './SelectField'
import { useToast } from './useToast'

const DELIMITERS = [
  { value: ',', label: 'CSV con coma (,)' },
  { value: ';', label: 'CSV con punto y coma (;) · Excel' },
]

export default function ExportControl({
  onExport,
}: {
  onExport: (delimiter: Delimiter) => Promise<void>
}) {
  const [delimiter, setDelimiter] = useState<Delimiter>(';')
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const run = async () => {
    setBusy(true)
    try {
      await onExport(delimiter)
      toast.success('Descargamos tu archivo CSV con los filtros actuales.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pudimos exportar el CSV.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
      <SelectField
        label="Formato del CSV"
        hideLabel
        value={delimiter}
        onChange={(event) => setDelimiter(event.target.value as Delimiter)}
        options={DELIMITERS}
      />
      <Button variant="secondary" onClick={() => void run()} disabled={busy}>
        <Icon name="download" className="size-4" />
        {busy ? 'Exportando…' : 'Exportar CSV'}
      </Button>
    </div>
  )
}
