import type { BBox, Shape } from '../types/shape'

export function rawBBox(shape: Shape): BBox {
  const pad = shape.strokeWidth / 2

  if (shape.type === 'text') {
    const [x, y] = shape.points[0] ?? [0, 0]
    const fontSize = shape.fontSize ?? 20
    const width = (shape.text?.length ?? 0) * fontSize * 0.6 + 1
    const height = fontSize * 1.3
    return { minX: x, minY: y, maxX: x + width, maxY: y + height }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of shape.points) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad }
}

export function rotatedBBox(shape: Shape): BBox {
  const box = rawBBox(shape)
  if (!shape.rotation) return box
  const cx = (box.minX + box.maxX) / 2
  const cy = (box.minY + box.maxY) / 2
  const corners: [number, number][] = [
    [box.minX, box.minY],
    [box.maxX, box.minY],
    [box.maxX, box.maxY],
    [box.minX, box.maxY],
  ]
  const cos = Math.cos(shape.rotation)
  const sin = Math.sin(shape.rotation)
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of corners) {
    const dx = x - cx
    const dy = y - cy
    const rx = cx + dx * cos - dy * sin
    const ry = cy + dx * sin + dy * cos
    if (rx < minX) minX = rx
    if (ry < minY) minY = ry
    if (rx > maxX) maxX = rx
    if (ry > maxY) maxY = ry
  }
  return { minX, minY, maxX, maxY }
}

export function unionBBox(boxes: BBox[]): BBox | null {
  if (boxes.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const b of boxes) {
    if (b.minX < minX) minX = b.minX
    if (b.minY < minY) minY = b.minY
    if (b.maxX > maxX) maxX = b.maxX
    if (b.maxY > maxY) maxY = b.maxY
  }
  return { minX, minY, maxX, maxY }
}

export function bboxIntersects(a: BBox, b: BBox): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY
}

export function bboxContainsPoint(b: BBox, x: number, y: number): boolean {
  return x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY
}

export class BBoxCache {
  private cache = new Map<string, BBox>()

  get(shape: Shape): BBox {
    let box = this.cache.get(shape.id)
    if (!box) {
      box = rotatedBBox(shape)
      this.cache.set(shape.id, box)
    }
    return box
  }

  clear() {
    this.cache.clear()
  }
}
