import type { Point } from '../types/shape'
import type { Tool, PointerInfo } from './types'
import { createShape } from '../collab/shapes'
import { drawShape } from '../canvas/draw'
import { setDrawingPreview } from '../collab/awareness'

let points: Point[] = []
let drawing = false

function pointDistance(a: Point, b: Point) {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

export const penTool: Tool = {
  id: 'pen',

  onPointerDown(ctx, p) {
    if (!ctx.hasCapacity()) return
    drawing = true
    points = [p.world]
    ctx.requestOverlayRender()
  },

  onPointerMove(ctx, p: PointerInfo) {
    if (!drawing) return
    const last = points[points.length - 1]
    const minDist = 2 / ctx.camera.zoom
    if (!last || pointDistance(last, p.world) >= minDist) {
      points.push(p.world)
    }
    if (ctx.awareness) {
      setDrawingPreview(ctx.awareness, {
        color: ctx.color,
        strokeWidth: ctx.strokeWidth,
        points: [...points],
      })
    }
    ctx.requestOverlayRender()
  },

  onPointerUp(ctx) {
    if (!drawing) return
    drawing = false
    if (points.length > 0 && ctx.hasCapacity()) {
      createShape(ctx.shapesMap, {
        type: 'pen',
        points,
        color: ctx.color,
        strokeWidth: ctx.strokeWidth,
        rotation: 0,
      })
    }
    points = []
    if (ctx.awareness) setDrawingPreview(ctx.awareness, null)
    ctx.requestRender()
    ctx.requestOverlayRender()
  },

  onDeactivate(ctx) {
    drawing = false
    points = []
    if (ctx.awareness) setDrawingPreview(ctx.awareness, null)
  },

  drawOverlay(ctx, canvasCtx) {
    if (drawing && points.length > 0) {
      drawShape(canvasCtx, {
        id: '__preview__',
        type: 'pen',
        points,
        color: ctx.color,
        strokeWidth: ctx.strokeWidth,
        rotation: 0,
        createdAt: 0,
      })
    }
  },
}
