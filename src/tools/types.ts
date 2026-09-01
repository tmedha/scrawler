import type { Awareness } from 'y-protocols/awareness'
import type { Camera } from '../canvas/viewport'
import type { BBoxCache } from '../canvas/bbox'
import type { Shape, Point } from '../types/shape'
import type { ShapesMap } from '../collab/shapes'

export type ToolId =
  | 'select'
  | 'pen'
  | 'eraser'
  | 'line'
  | 'arrow'
  | 'rectangle'
  | 'ellipse'
  | 'text'
  | 'laser'

export interface ToolContext {
  shapesMap: ShapesMap
  getShapes: () => Shape[]
  bboxCache: BBoxCache
  camera: Camera
  color: string
  strokeWidth: number
  awareness: Awareness | null
  requestRender: () => void
  requestOverlayRender: () => void
  hasCapacity: () => boolean
  openTextEditor: (shapeId: string | null, worldPoint: Point) => void
}

export interface PointerInfo {
  world: Point
  screen: Point
  pointerId: number
  shiftKey: boolean
}

export interface Tool {
  id: ToolId
  onPointerDown?(ctx: ToolContext, p: PointerInfo, e: PointerEvent): void
  onPointerMove?(ctx: ToolContext, p: PointerInfo, e: PointerEvent): void
  onPointerUp?(ctx: ToolContext, p: PointerInfo, e: PointerEvent): void
  onDeactivate?(ctx: ToolContext): void
  drawOverlay?(ctx: ToolContext, canvasCtx: CanvasRenderingContext2D): void
}
