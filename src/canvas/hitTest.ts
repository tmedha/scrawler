import type { BBox, Shape } from '../types/shape'
import { bboxContainsPoint, bboxIntersects, rawBBox, type BBoxCache } from './bbox'

function toLocalSpace(shape: Shape, x: number, y: number): [number, number] {
  if (!shape.rotation) return [x, y]
  const box = rawBBox(shape)
  const cx = (box.minX + box.maxX) / 2
  const cy = (box.minY + box.maxY) / 2
  const cos = Math.cos(-shape.rotation)
  const sin = Math.sin(-shape.rotation)
  const dx = x - cx
  const dy = y - cy
  return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos]
}

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}

function distToPolyline(px: number, py: number, points: [number, number][]) {
  if (points.length === 1) return Math.hypot(px - points[0][0], py - points[0][1])
  let min = Infinity
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i]
    const [bx, by] = points[i + 1]
    const d = distToSegment(px, py, ax, ay, bx, by)
    if (d < min) min = d
  }
  return min
}

function distToRectStroke(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)
  const minY = Math.min(y1, y2)
  const maxY = Math.max(y1, y2)
  const edges: [number, number, number, number][] = [
    [minX, minY, maxX, minY],
    [maxX, minY, maxX, maxY],
    [maxX, maxY, minX, maxY],
    [minX, maxY, minX, minY],
  ]
  let min = Infinity
  for (const [ax, ay, bx, by] of edges) {
    const d = distToSegment(px, py, ax, ay, bx, by)
    if (d < min) min = d
  }
  return min
}

function distToEllipseStroke(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  const cx = (x1 + x2) / 2
  const cy = (y1 + y2) / 2
  const rx = Math.max(1, Math.abs(x2 - x1) / 2)
  const ry = Math.max(1, Math.abs(y2 - y1) / 2)
  const nx = (px - cx) / rx
  const ny = (py - cy) / ry
  const r = Math.hypot(nx, ny)
  if (r === 0) return Math.min(rx, ry)
  return Math.abs(r - 1) * Math.min(rx, ry)
}

export function distanceToShape(shape: Shape, x: number, y: number): number {
  const [lx, ly] = toLocalSpace(shape, x, y)

  switch (shape.type) {
    case 'pen':
      return Math.max(0, distToPolyline(lx, ly, shape.points) - shape.strokeWidth / 2)
    case 'line':
    case 'arrow':
      return distToSegment(lx, ly, shape.points[0][0], shape.points[0][1], shape.points[1][0], shape.points[1][1])
    case 'rectangle':
      return distToRectStroke(lx, ly, shape.points[0][0], shape.points[0][1], shape.points[1][0], shape.points[1][1])
    case 'ellipse':
      return distToEllipseStroke(lx, ly, shape.points[0][0], shape.points[0][1], shape.points[1][0], shape.points[1][1])
    case 'text':
      return bboxContainsPoint(rawBBox(shape), lx, ly) ? 0 : Infinity
    default:
      return Infinity
  }
}

export function hitTestPoint(
  shapes: Shape[],
  bboxCache: BBoxCache,
  x: number,
  y: number,
  tolerance: number
): Shape | null {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i]
    const box = bboxCache.get(shape)
    const expanded: BBox = {
      minX: box.minX - tolerance,
      minY: box.minY - tolerance,
      maxX: box.maxX + tolerance,
      maxY: box.maxY + tolerance,
    }
    if (!bboxContainsPoint(expanded, x, y)) continue
    if (distanceToShape(shape, x, y) <= tolerance) return shape
  }
  return null
}

export function rectSelect(shapes: Shape[], bboxCache: BBoxCache, box: BBox): Shape[] {
  return shapes.filter((shape) => bboxIntersects(bboxCache.get(shape), box))
}
