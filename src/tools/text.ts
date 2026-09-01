import type { Tool } from './types'
import { hitTestPoint } from '../canvas/hitTest'

export const textTool: Tool = {
  id: 'text',

  onPointerDown(ctx, p) {
    const tolerance = 6 / ctx.camera.zoom
    const shapes = ctx.getShapes().filter((s) => s.type === 'text')
    const hit = hitTestPoint(shapes, ctx.bboxCache, p.world[0], p.world[1], tolerance)
    if (hit) {
      ctx.openTextEditor(hit.id, p.world)
      return
    }
    if (!ctx.hasCapacity()) return
    ctx.openTextEditor(null, p.world)
  },
}
