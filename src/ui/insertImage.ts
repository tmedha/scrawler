import type { CanvasController } from '../canvas/CanvasController'
import { getCurrentSession, type DocSession } from '../collab/YDocManager'
import { createShape } from '../collab/shapes'
import { canCreateShape } from '../storage/capacity'
import { setActiveTool } from '../tools/store'
import { setSelection } from '../canvas/selection'
import type { Point } from '../types/shape'
import type { RenderedPage } from './renderPdf'

const MAX_STORED_DIMENSION = 1600
const JPEG_QUALITY = 0.82
const MAX_DISPLAY_DIMENSION = 480
const PAGE_GAP = 24

function readResizedImage(file: File): Promise<RenderedPage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not decode image'))
      img.onload = () => {
        const scale = Math.min(1, MAX_STORED_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight))
        const width = Math.max(1, Math.round(img.naturalWidth * scale))
        const height = Math.max(1, Math.round(img.naturalHeight * scale))

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        const losslessType = file.type === 'image/png' || file.type === 'image/gif' || file.type === 'image/webp'
        const preserveAlpha = losslessType && scale === 1
        const src = preserveAlpha ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', JPEG_QUALITY)
        resolve({ src, width, height })
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

function placePages(pages: RenderedPage[], center: Point, session: DocSession): string[] {
  const scaled = pages.map((p) => {
    const scale = Math.min(1, MAX_DISPLAY_DIMENSION / Math.max(p.width, p.height))
    return { src: p.src, w: p.width * scale, h: p.height * scale }
  })

  const totalWidth = scaled.reduce((sum, p) => sum + p.w, 0) + PAGE_GAP * (scaled.length - 1)
  let x = center[0] - totalWidth / 2
  const ids: string[] = []

  for (const p of scaled) {
    if (!canCreateShape(session.shapesMap)) break
    const points: [Point, Point] = [
      [x, center[1] - p.h / 2],
      [x + p.w, center[1] + p.h / 2],
    ]
    const shape = createShape(session.shapesMap, {
      type: 'image',
      points,
      color: '#000000',
      strokeWidth: 0,
      rotation: 0,
      src: p.src,
    })
    ids.push(shape.id)
    x += p.w + PAGE_GAP
  }

  return ids
}

export async function insertFile(file: File, controller: CanvasController | null) {
  if (!controller) return
  const session = getCurrentSession()
  if (!session || !canCreateShape(session.shapesMap)) return

  let pages: RenderedPage[]
  if (file.type === 'application/pdf') {
    const { renderPdfPages } = await import('./renderPdf')
    pages = await renderPdfPages(file)
  } else if (file.type.startsWith('image/')) {
    pages = [await readResizedImage(file)]
  } else {
    return
  }

  if (pages.length === 0 || !canCreateShape(session.shapesMap)) return

  const center = controller.getViewportCenterWorld()
  const ids = placePages(pages, center, session)
  if (ids.length === 0) return

  setActiveTool('select')
  setSelection(ids)
}
