import type { Point, ShapeType } from '../types/shape'
import type { Tool } from './types'
import { createShape } from '../collab/shapes'
import { drawShape } from '../canvas/draw'

function makeDragShapeTool(type: Extract<ShapeType, 'line' | 'arrow' | 'rectangle' | 'ellipse'>): Tool {
  let start: Point | null = null
  let end: Point | null = null

  return {
    id: type,

    onPointerDown(ctx, p) {
      if (!ctx.hasCapacity()) return
      start = p.world
      end = p.world
      ctx.requestOverlayRender()
    },

    onPointerMove(ctx, p) {
      if (!start) return
      end = p.world
      ctx.requestOverlayRender()
    },

    onPointerUp(ctx) {
      if (!start || !end) return
      const dist = Math.hypot(end[0] - start[0], end[1] - start[1])
      if (dist >= 2 / ctx.camera.zoom && ctx.hasCapacity()) {
        createShape(ctx.shapesMap, {
          type,
          points: [start, end],
          color: ctx.color,
          strokeWidth: ctx.strokeWidth,
          rotation: 0,
        })
      }
      start = null
      end = null
      ctx.requestRender()
      ctx.requestOverlayRender()
    },

    onDeactivate() {
      start = null
      end = null
    },

    drawOverlay(ctx, canvasCtx) {
      if (!start || !end) return
      drawShape(canvasCtx, {
        id: '__preview__',
        type,
        points: [start, end],
        color: ctx.color,
        strokeWidth: ctx.strokeWidth,
        rotation: 0,
        createdAt: 0,
      })
    },
  }
}

export const lineTool = makeDragShapeTool('line')
export const arrowTool = makeDragShapeTool('arrow')
export const rectangleTool = makeDragShapeTool('rectangle')
export const ellipseTool = makeDragShapeTool('ellipse')
