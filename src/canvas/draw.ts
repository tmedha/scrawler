import getStroke from 'perfect-freehand'
import type { Shape } from '../types/shape'
import { rawBBox } from './bbox'

function strokeOutlinePath(points: [number, number][], strokeWidth: number): Path2D {
  const outline = getStroke(points, {
    size: strokeWidth,
    thinning: 0.6,
    smoothing: 0.5,
    streamline: 0.5,
  })
  const path = new Path2D()
  if (outline.length === 0) return path
  path.moveTo(outline[0][0], outline[0][1])
  for (let i = 1; i < outline.length; i++) {
    path.lineTo(outline[i][0], outline[i][1])
  }
  path.closePath()
  return path
}

function withShapeTransform(ctx: CanvasRenderingContext2D, shape: Shape, fn: () => void) {
  if (!shape.rotation) {
    fn()
    return
  }
  const box = rawBBox(shape)
  const cx = (box.minX + box.maxX) / 2
  const cy = (box.minY + box.maxY) / 2
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(shape.rotation)
  ctx.translate(-cx, -cy)
  fn()
  ctx.restore()
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  x2: number,
  y2: number,
  angle: number,
  strokeWidth: number
) {
  const headLen = Math.max(10, strokeWidth * 4)
  const headAngle = Math.PI / 7
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - headLen * Math.cos(angle - headAngle), y2 - headLen * Math.sin(angle - headAngle))
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - headLen * Math.cos(angle + headAngle), y2 - headLen * Math.sin(angle + headAngle))
  ctx.stroke()
}

export function drawShape(ctx: CanvasRenderingContext2D, shape: Shape) {
  if (shape.type === 'pen' && shape.points.length === 0) return
  if (shape.type !== 'pen' && shape.type !== 'text' && shape.points.length < 2) return

  withShapeTransform(ctx, shape, () => {
    ctx.strokeStyle = shape.color
    ctx.fillStyle = shape.color
    ctx.lineWidth = shape.strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    switch (shape.type) {
      case 'pen': {
        if (shape.points.length === 1) {
          const [x, y] = shape.points[0]
          ctx.beginPath()
          ctx.arc(x, y, shape.strokeWidth / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fill(strokeOutlinePath(shape.points, shape.strokeWidth))
        }
        break
      }
      case 'line': {
        const [[x1, y1], [x2, y2]] = shape.points
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        break
      }
      case 'arrow': {
        const [[x1, y1], [x2, y2]] = shape.points
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        drawArrowhead(ctx, x2, y2, Math.atan2(y2 - y1, x2 - x1), shape.strokeWidth)
        break
      }
      case 'rectangle': {
        const [[x1, y1], [x2, y2]] = shape.points
        ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1))
        break
      }
      case 'ellipse': {
        const [[x1, y1], [x2, y2]] = shape.points
        const cx = (x1 + x2) / 2
        const cy = (y1 + y2) / 2
        const rx = Math.abs(x2 - x1) / 2
        const ry = Math.abs(y2 - y1) / 2
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        ctx.stroke()
        break
      }
      case 'text': {
        const [x, y] = shape.points[0] ?? [0, 0]
        ctx.font = `${shape.fontSize ?? 20}px sans-serif`
        ctx.textBaseline = 'top'
        ctx.fillText(shape.text ?? '', x, y)
        break
      }
    }
  })
}
