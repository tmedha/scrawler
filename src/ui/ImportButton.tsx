import { useRef, useState, type ChangeEvent } from 'react'
import type { CanvasController } from '../canvas/CanvasController'
import { importCanvasFile } from './importCanvas'
import { UploadIcon } from './icons'

interface Props {
  getController: () => CanvasController | null
}

export function ImportButton({ getController }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      await importCanvasFile(file, getController())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
      window.setTimeout(() => setError(null), 3000)
    }
  }

  return (
    <div className="share-dialog-wrapper">
      <button className="icon-btn" title="Import canvas file" onClick={() => fileInputRef.current?.click()}>
        <UploadIcon />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      {error && <div className="popover popover-below import-error">{error}</div>}
    </div>
  )
}
