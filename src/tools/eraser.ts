import type { Tool, ToolContext } from './types'
import { hitTestPoint } from '../canvas/hitTest'
import { deleteShape } from '../collab/shapes'

let erasing = false

function eraseAt(ctx: ToolContext, x: number, y: number) {
  const tolerance = 6 / ctx.camera.zoom
  const shape = hitTestPoint(ctx.getShapes(), ctx.bboxCache, x, y, tolerance)
  if (shape) {
    deleteShape(ctx.shapesMap, shape.id)
    ctx.bboxCache.invalidate(shape.id)
    ctx.requestRender()
  }
}

export const eraserTool: Tool = {
  id: 'eraser',

  onPointerDown(ctx, p) {
    erasing = true
    eraseAt(ctx, p.world[0], p.world[1])
  },

  onPointerMove(ctx, p) {
    if (!erasing) return
    eraseAt(ctx, p.world[0], p.world[1])
  },

  onPointerUp() {
    erasing = false
  },

  onDeactivate() {
    erasing = false
  },
}
