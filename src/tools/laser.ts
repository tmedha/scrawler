import type { Point } from '../types/shape'
import type { Tool } from './types'
import { setLaser } from '../collab/awareness'

const TRAIL_MS = 500

let active = false
let trail: { point: Point; t: number }[] = []

function pushPoint(p: Point) {
  const now = performance.now()
  trail.push({ point: p, t: now })
  trail = trail.filter((entry) => now - entry.t < TRAIL_MS)
}

export function isLaserActive(): boolean {
  if (active) return true
  const now = performance.now()
  return trail.some((entry) => now - entry.t < TRAIL_MS)
}

export const laserTool: Tool = {
  id: 'laser',

  onPointerDown(ctx, p) {
    active = true
    pushPoint(p.world)
    if (ctx.awareness) setLaser(ctx.awareness, p.world)
    ctx.requestOverlayRender()
  },

  onPointerMove(ctx, p) {
    if (!active) return
    pushPoint(p.world)
    if (ctx.awareness) setLaser(ctx.awareness, p.world)
    ctx.requestOverlayRender()
  },

  onPointerUp(ctx) {
    active = false
    if (ctx.awareness) setLaser(ctx.awareness, null)
    ctx.requestOverlayRender()
  },

  onDeactivate(ctx) {
    active = false
    trail = []
    if (ctx.awareness) setLaser(ctx.awareness, null)
  },

  drawOverlay(_ctx, canvasCtx) {
    const now = performance.now()
    trail = trail.filter((entry) => now - entry.t < TRAIL_MS)
    for (const entry of trail) {
      const age = now - entry.t
      const opacity = 1 - age / TRAIL_MS
      canvasCtx.beginPath()
      canvasCtx.arc(entry.point[0], entry.point[1], 5, 0, Math.PI * 2)
      canvasCtx.fillStyle = `rgba(255, 40, 40, ${opacity})`
      canvasCtx.fill()
    }
  },
}
