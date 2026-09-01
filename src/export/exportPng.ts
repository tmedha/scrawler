import type { Shape } from '../types/shape'
import { rotatedBBox, unionBBox } from '../canvas/bbox'
import { drawShape } from '../canvas/draw'

const MAX_DIMENSION = 8000
const MARGIN = 40
const PIXEL_DENSITY = 2

export function exportShapesToPng(shapes: Shape[], filename: string) {
  if (shapes.length === 0) return

  const box = unionBBox(shapes.map(rotatedBBox))
  if (!box) return

  const width = Math.min(MAX_DIMENSION, box.maxX - box.minX + MARGIN * 2)
  const height = Math.min(MAX_DIMENSION, box.maxY - box.minY + MARGIN * 2)

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * PIXEL_DENSITY)
  canvas.height = Math.round(height * PIXEL_DENSITY)
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(PIXEL_DENSITY, 0, 0, PIXEL_DENSITY, 0, 0)
  ctx.translate(-box.minX + MARGIN, -box.minY + MARGIN)

  for (const shape of shapes) {
    drawShape(ctx, shape)
  }

  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename.endsWith('.png') ? filename : `${filename}.png`
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
