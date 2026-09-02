import type { Shape } from '../types/shape'
import type { TabBackground } from '../types/tab'

export const CANVAS_FILE_VERSION = 1

export interface CanvasFile {
  version: number
  name: string
  background: TabBackground
  shapes: Shape[]
}

export function exportCanvasToJson(name: string, background: TabBackground, shapes: Shape[]) {
  const data: CanvasFile = { version: CANVAS_FILE_VERSION, name, background, shapes }
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name || 'canvas'}.json`
  a.click()
  URL.revokeObjectURL(url)
}
