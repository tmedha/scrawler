import type { BBox, Point, Shape } from '../types/shape'
import type { Tool, ToolContext } from './types'
import { hitTestPoint, rectSelect } from '../canvas/hitTest'
import { unionBBox } from '../canvas/bbox'
import { transactShapes, updateShape } from '../collab/shapes'
import {
  clearSelection,
  getSelection,
  setSelection,
  toggleSelection,
} from '../canvas/selection'

type DragMode = 'none' | 'move' | 'resize' | 'rotate' | 'rubberband'
type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate'

interface Snapshot {
  points: Point[]
  rotation: number
  fontSize?: number
}

const HANDLE_TOLERANCE_PX = 10
const ROTATE_OFFSET_PX = 28

let mode: DragMode = 'none'
let dragStart: Point = [0, 0]
let dragCurrent: Point = [0, 0]
let snapshots = new Map<string, Snapshot>()
let groupBoxAtStart: BBox | null = null
let activeHandle: Handle | null = null

function groupBBox(ctx: ToolContext): BBox | null {
  const ids = getSelection()
  if (ids.size === 0) return null
  const boxes = ctx
    .getShapes()
    .filter((s) => ids.has(s.id))
    .map((s) => ctx.bboxCache.get(s))
  return unionBBox(boxes)
}

function handlePositions(box: BBox, zoom: number): Record<Handle, Point> {
  const midX = (box.minX + box.maxX) / 2
  const midY = (box.minY + box.maxY) / 2
  return {
    nw: [box.minX, box.minY],
    n: [midX, box.minY],
    ne: [box.maxX, box.minY],
    e: [box.maxX, midY],
    se: [box.maxX, box.maxY],
    s: [midX, box.maxY],
    sw: [box.minX, box.maxY],
    w: [box.minX, midY],
    rotate: [midX, box.minY - ROTATE_OFFSET_PX / zoom],
  }
}

function hitTestHandle(box: BBox, zoom: number, x: number, y: number): Handle | null {
  const positions = handlePositions(box, zoom)
  const tolerance = HANDLE_TOLERANCE_PX / zoom
  for (const [handle, [hx, hy]] of Object.entries(positions) as [Handle, Point][]) {
    if (Math.hypot(x - hx, y - hy) <= tolerance) return handle
  }
  return null
}

function captureSnapshot(ctx: ToolContext) {
  const ids = getSelection()
  snapshots = new Map()
  for (const shape of ctx.getShapes()) {
    if (ids.has(shape.id)) {
      snapshots.set(shape.id, {
        points: shape.points.map((pt) => [pt[0], pt[1]] as Point),
        rotation: shape.rotation,
        fontSize: shape.fontSize,
      })
    }
  }
}

function rotatePoint(p: Point, center: Point, angle: number): Point {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = p[0] - center[0]
  const dy = p[1] - center[1]
  return [center[0] + dx * cos - dy * sin, center[1] + dx * sin + dy * cos]
}

function applyMove(ctx: ToolContext, delta: Point) {
  transactShapes(ctx.shapesMap, () => {
    snapshots.forEach((snap, id) => {
      const points = snap.points.map((p) => [p[0] + delta[0], p[1] + delta[1]] as Point)
      updateShape(ctx.shapesMap, id, { points })
    })
  })
}

function applyResize(ctx: ToolContext, handle: Handle, box: BBox, current: Point) {
  const hasW = handle.includes('w')
  const hasE = handle.includes('e')
  const hasN = handle.includes('n')
  const hasS = handle.includes('s')
  const midX = (box.minX + box.maxX) / 2
  const midY = (box.minY + box.maxY) / 2

  const anchorX = hasW ? box.maxX : hasE ? box.minX : midX
  const anchorY = hasN ? box.maxY : hasS ? box.minY : midY
  const startX = hasW ? box.minX : hasE ? box.maxX : anchorX
  const startY = hasN ? box.minY : hasS ? box.maxY : anchorY

  const sx = hasW || hasE ? (current[0] - anchorX) / (startX - anchorX || 1) : 1
  const sy = hasN || hasS ? (current[1] - anchorY) / (startY - anchorY || 1) : 1
  const avgScale = hasW || hasE ? (hasN || hasS ? (Math.abs(sx) + Math.abs(sy)) / 2 : Math.abs(sx)) : Math.abs(sy)

  transactShapes(ctx.shapesMap, () => {
    snapshots.forEach((snap, id) => {
      const points = snap.points.map(
        (p) => [anchorX + (p[0] - anchorX) * sx, anchorY + (p[1] - anchorY) * sy] as Point
      )
      const patch: Partial<Shape> = { points }
      if (snap.fontSize) patch.fontSize = Math.max(6, snap.fontSize * (avgScale || 1))
      updateShape(ctx.shapesMap, id, patch)
    })
  })
}

function applyRotate(ctx: ToolContext, center: Point, angle: number) {
  transactShapes(ctx.shapesMap, () => {
    snapshots.forEach((snap, id) => {
      const oldCenter: Point = [
        snap.points.reduce((a, p) => a + p[0], 0) / snap.points.length,
        snap.points.reduce((a, p) => a + p[1], 0) / snap.points.length,
      ]
      const newCenter = rotatePoint(oldCenter, center, angle)
      const translation: Point = [newCenter[0] - oldCenter[0], newCenter[1] - oldCenter[1]]
      const points = snap.points.map((p) => [p[0] + translation[0], p[1] + translation[1]] as Point)
      updateShape(ctx.shapesMap, id, { points, rotation: snap.rotation + angle })
    })
  })
}

export const selectTool: Tool = {
  id: 'select',

  onPointerDown(ctx, p) {
    const box = groupBBox(ctx)
    if (box) {
      const handle = hitTestHandle(box, ctx.camera.zoom, p.world[0], p.world[1])
      if (handle) {
        mode = handle === 'rotate' ? 'rotate' : 'resize'
        activeHandle = handle
        dragStart = p.world
        groupBoxAtStart = box
        captureSnapshot(ctx)
        return
      }
    }

    const tolerance = 6 / ctx.camera.zoom
    const hit = hitTestPoint(ctx.getShapes(), ctx.bboxCache, p.world[0], p.world[1], tolerance)

    if (hit) {
      if (p.shiftKey) {
        toggleSelection(hit.id)
        return
      }
      if (!getSelection().has(hit.id)) {
        setSelection([hit.id])
      }
      mode = 'move'
      dragStart = p.world
      captureSnapshot(ctx)
      return
    }

    if (!p.shiftKey) clearSelection()
    mode = 'rubberband'
    dragStart = p.world
    dragCurrent = p.world
    ctx.requestOverlayRender()
  },

  onPointerMove(ctx, p) {
    dragCurrent = p.world
    if (mode === 'move') {
      applyMove(ctx, [dragCurrent[0] - dragStart[0], dragCurrent[1] - dragStart[1]])
    } else if (mode === 'resize' && activeHandle && groupBoxAtStart) {
      applyResize(ctx, activeHandle, groupBoxAtStart, dragCurrent)
    } else if (mode === 'rotate' && groupBoxAtStart) {
      const center: Point = [
        (groupBoxAtStart.minX + groupBoxAtStart.maxX) / 2,
        (groupBoxAtStart.minY + groupBoxAtStart.maxY) / 2,
      ]
      const startAngle = Math.atan2(dragStart[1] - center[1], dragStart[0] - center[0])
      const currentAngle = Math.atan2(dragCurrent[1] - center[1], dragCurrent[0] - center[0])
      applyRotate(ctx, center, currentAngle - startAngle)
    } else if (mode === 'rubberband') {
      const box: BBox = {
        minX: Math.min(dragStart[0], dragCurrent[0]),
        minY: Math.min(dragStart[1], dragCurrent[1]),
        maxX: Math.max(dragStart[0], dragCurrent[0]),
        maxY: Math.max(dragStart[1], dragCurrent[1]),
      }
      const ids = rectSelect(ctx.getShapes(), ctx.bboxCache, box).map((s) => s.id)
      setSelection(ids)
      ctx.requestOverlayRender()
    }
  },

  onPointerUp() {
    mode = 'none'
    activeHandle = null
    groupBoxAtStart = null
    snapshots = new Map()
  },

  onDeactivate() {
    mode = 'none'
    activeHandle = null
    groupBoxAtStart = null
    snapshots = new Map()
  },

  drawOverlay(ctx, canvasCtx) {
    const box = mode === 'rubberband' ? null : groupBBox(ctx)

    if (mode === 'rubberband') {
      const x = Math.min(dragStart[0], dragCurrent[0])
      const y = Math.min(dragStart[1], dragCurrent[1])
      const w = Math.abs(dragCurrent[0] - dragStart[0])
      const h = Math.abs(dragCurrent[1] - dragStart[1])
      canvasCtx.strokeStyle = '#4285f4'
      canvasCtx.lineWidth = 1 / ctx.camera.zoom
      canvasCtx.setLineDash([4 / ctx.camera.zoom, 4 / ctx.camera.zoom])
      canvasCtx.strokeRect(x, y, w, h)
      canvasCtx.fillStyle = 'rgba(66, 133, 244, 0.08)'
      canvasCtx.fillRect(x, y, w, h)
      canvasCtx.setLineDash([])
      return
    }

    if (!box) return

    canvasCtx.strokeStyle = '#4285f4'
    canvasCtx.lineWidth = 1.5 / ctx.camera.zoom
    canvasCtx.strokeRect(box.minX, box.minY, box.maxX - box.minX, box.maxY - box.minY)

    const positions = handlePositions(box, ctx.camera.zoom)
    const handleSize = 8 / ctx.camera.zoom
    canvasCtx.fillStyle = '#ffffff'
    for (const [handle, [x, y]] of Object.entries(positions) as [Handle, Point][]) {
      if (handle === 'rotate') {
        canvasCtx.beginPath()
        canvasCtx.moveTo((box.minX + box.maxX) / 2, box.minY)
        canvasCtx.lineTo(x, y)
        canvasCtx.stroke()
        canvasCtx.beginPath()
        canvasCtx.arc(x, y, handleSize / 2, 0, Math.PI * 2)
        canvasCtx.fill()
        canvasCtx.stroke()
        continue
      }
      canvasCtx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize)
      canvasCtx.strokeRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize)
    }
  },
}
