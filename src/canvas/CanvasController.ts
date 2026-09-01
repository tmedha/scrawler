import type { DocSession } from '../collab/YDocManager'
import { deleteShape, getAllShapes, transactShapes } from '../collab/shapes'
import { canCreateShape } from '../storage/capacity'
import { getRemoteStates, setCursor } from '../collab/awareness'
import type { BBox, Point, Shape } from '../types/shape'
import { BBoxCache, bboxIntersects, rotatedBBox, unionBBox } from './bbox'
import { drawShape } from './draw'
import {
  createCamera,
  panCamera,
  screenToWorld,
  visibleWorldRect,
  worldToScreen,
  zoomCameraAt,
  type Camera,
} from './viewport'
import { getTool } from '../tools'
import { getToolState, subscribeToolState } from '../tools/store'
import { subscribeSelection, getSelection, clearSelection } from './selection'
import { isLaserActive } from '../tools/laser'
import type { ToolContext } from '../tools/types'

const PADDING = 40
const PRESENCE_FADE_MS = 600

export type TextEditorRequest = { shapeId: string | null; world: Point; screen: Point } | null

type Awareness = NonNullable<DocSession['webrtc']>['awareness']

export class CanvasController {
  private content: HTMLCanvasElement
  private overlay: HTMLCanvasElement
  private contentCtx: CanvasRenderingContext2D
  private overlayCtx: CanvasRenderingContext2D

  private session: DocSession | null = null
  private camera: Camera = createCamera()
  private cameraByTab = new Map<string, Camera>()
  private bboxCache = new BBoxCache()
  private shapes: Shape[] = []
  private width = 0
  private height = 0
  private dpr = 1

  private contentDirty = true
  private overlayFrame: number | null = null

  private pointers = new Map<number, Point>()
  private spaceDown = false
  private panPointerId: number | null = null
  private panLast: Point | null = null
  private pinchLastDist = 0
  private pinchLastMid: Point = [0, 0]

  private resizeObserver: ResizeObserver
  private unsubTool: () => void
  private unsubSelection: () => void
  private unobserveShapes: (() => void) | null = null
  private unbindAwareness: (() => void) | null = null
  private unbindUndoStack: (() => void) | null = null

  onTextEditorRequest: (req: TextEditorRequest) => void = () => {}
  onCapacityChange: (atCapacity: boolean) => void = () => {}
  onCameraChange: (camera: Camera) => void = () => {}
  onUndoStateChange: (state: { canUndo: boolean; canRedo: boolean }) => void = () => {}

  constructor(content: HTMLCanvasElement, overlay: HTMLCanvasElement) {
    this.content = content
    this.overlay = overlay
    this.contentCtx = content.getContext('2d')!
    this.overlayCtx = overlay.getContext('2d')!

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(content)

    overlay.addEventListener('pointerdown', this.handlePointerDown)
    window.addEventListener('pointermove', this.handlePointerMove)
    window.addEventListener('pointerup', this.handlePointerUp)
    window.addEventListener('pointercancel', this.handlePointerUp)
    overlay.addEventListener('wheel', this.handleWheel, { passive: false })
    overlay.addEventListener('dblclick', this.handleDoubleClick)
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)

    this.unsubTool = subscribeToolState(() => this.scheduleOverlay())
    this.unsubSelection = subscribeSelection(() => this.scheduleOverlay())

    this.resize()
  }

  destroy() {
    this.resizeObserver.disconnect()
    this.overlay.removeEventListener('pointerdown', this.handlePointerDown)
    window.removeEventListener('pointermove', this.handlePointerMove)
    window.removeEventListener('pointerup', this.handlePointerUp)
    window.removeEventListener('pointercancel', this.handlePointerUp)
    this.overlay.removeEventListener('wheel', this.handleWheel)
    this.overlay.removeEventListener('dblclick', this.handleDoubleClick)
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    this.unsubTool()
    this.unsubSelection()
    this.unobserveShapes?.()
    this.unbindAwareness?.()
    this.unbindUndoStack?.()
    if (this.overlayFrame) cancelAnimationFrame(this.overlayFrame)
  }

  setSession(session: DocSession, tabId: string) {
    this.unobserveShapes?.()
    this.unbindUndoStack?.()
    this.session = session
    this.setCamera(this.cameraByTab.get(tabId) ?? createCamera())
    this.cameraByTab.set(tabId, this.camera)
    this.bboxCache.clear()
    this.refreshShapes()

    const observer = () => {
      this.bboxCache.clear()
      this.refreshShapes()
      this.scheduleRender()
      this.onCapacityChange(!canCreateShape(session.shapesMap))
    }
    session.shapesMap.observeDeep(observer)
    this.unobserveShapes = () => session.shapesMap.unobserveDeep(observer)

    const reportUndoState = () =>
      this.onUndoStateChange({
        canUndo: session.undoManager.undoStack.length > 0,
        canRedo: session.undoManager.redoStack.length > 0,
      })
    session.undoManager.on('stack-item-added', reportUndoState)
    session.undoManager.on('stack-item-popped', reportUndoState)
    this.unbindUndoStack = () => {
      session.undoManager.off('stack-item-added', reportUndoState)
      session.undoManager.off('stack-item-popped', reportUndoState)
    }
    reportUndoState()

    this.rebindAwareness()
    this.onCapacityChange(!canCreateShape(session.shapesMap))
    this.scheduleRender()
  }

  private setCamera(camera: Camera) {
    this.camera = camera
    this.onCameraChange(camera)
  }

  rebindAwareness() {
    this.unbindAwareness?.()
    this.unbindAwareness = null
    const awareness = this.session?.webrtc?.awareness
    if (!awareness) return
    const handler = () => this.scheduleOverlay()
    awareness.on('change', handler)
    this.unbindAwareness = () => awareness.off('change', handler)
    this.scheduleOverlay()
  }

  saveCamera(tabId: string) {
    this.cameraByTab.set(tabId, this.camera)
  }

  getShapes(): Shape[] {
    return this.shapes
  }

  private refreshShapes() {
    if (!this.session) return
    this.shapes = getAllShapes(this.session.shapesMap).sort((a, b) => a.createdAt - b.createdAt)
  }

  private resize() {
    const rect = this.content.getBoundingClientRect()
    this.dpr = window.devicePixelRatio || 1
    this.width = rect.width
    this.height = rect.height
    for (const canvas of [this.content, this.overlay]) {
      canvas.width = Math.max(1, Math.round(rect.width * this.dpr))
      canvas.height = Math.max(1, Math.round(rect.height * this.dpr))
    }
    this.scheduleRender()
  }

  private scheduleRender() {
    this.contentDirty = true
    this.scheduleOverlay()
  }

  private scheduleOverlay() {
    if (this.overlayFrame) return
    this.overlayFrame = requestAnimationFrame(() => {
      this.overlayFrame = null
      this.frame()
    })
  }

  private frame() {
    if (this.contentDirty) {
      this.contentDirty = false
      this.renderContent()
    }
    this.renderOverlay()

    if (this.isOverlayActive()) {
      this.scheduleOverlay()
    }
  }

  private isOverlayActive(): boolean {
    if (isLaserActive()) return true
    if (this.session?.webrtc) {
      const now = Date.now()
      for (const state of getRemoteStates(this.session.webrtc.awareness).values()) {
        if (state.drawingPreview) return true
        if (state.laserAt && now - state.laserAt < PRESENCE_FADE_MS) return true
      }
    }
    return false
  }

  private applyTransform(ctx: CanvasRenderingContext2D) {
    const s = this.dpr * this.camera.zoom
    ctx.setTransform(s, 0, 0, s, -s * this.camera.x, -s * this.camera.y)
  }

  private renderContent() {
    const ctx = this.contentCtx
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.content.width, this.content.height)
    this.applyTransform(ctx)

    const view = visibleWorldRect(this.camera, this.width, this.height)
    const padded: BBox = {
      minX: view.minX - PADDING / this.camera.zoom,
      minY: view.minY - PADDING / this.camera.zoom,
      maxX: view.maxX + PADDING / this.camera.zoom,
      maxY: view.maxY + PADDING / this.camera.zoom,
    }

    for (const shape of this.shapes) {
      const box = this.bboxCache.get(shape)
      if (!bboxIntersects(box, padded)) continue
      drawShape(ctx, shape)
    }
  }

  private renderOverlay() {
    const ctx = this.overlayCtx
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.overlay.width, this.overlay.height)
    this.applyTransform(ctx)

    if (this.session?.webrtc) {
      this.drawRemotePresence(ctx, this.session.webrtc.awareness)
    }

    if (this.session) {
      const toolCtx = this.buildToolContext()
      const tool = getTool(getToolState().activeTool)
      tool.drawOverlay?.(toolCtx, ctx)
    }
  }

  private drawRemotePresence(ctx: CanvasRenderingContext2D, awareness: Awareness) {
    const now = Date.now()
    getRemoteStates(awareness).forEach((state) => {
      if (state.drawingPreview) {
        drawShape(ctx, {
          id: '__remote__',
          type: 'pen',
          points: state.drawingPreview.points,
          color: state.drawingPreview.color,
          strokeWidth: state.drawingPreview.strokeWidth,
          rotation: 0,
          createdAt: 0,
        })
      }
      if (state.laser && state.laserAt && now - state.laserAt < PRESENCE_FADE_MS) {
        const opacity = 1 - (now - state.laserAt) / PRESENCE_FADE_MS
        ctx.beginPath()
        ctx.arc(state.laser[0], state.laser[1], 6, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 40, 40, ${opacity})`
        ctx.fill()
      }
      if (state.cursor) {
        ctx.beginPath()
        ctx.arc(state.cursor[0], state.cursor[1], 4 / this.camera.zoom, 0, Math.PI * 2)
        ctx.fillStyle = state.color
        ctx.fill()
        ctx.font = `${12 / this.camera.zoom}px sans-serif`
        ctx.fillStyle = state.color
        ctx.fillText(
          state.name,
          state.cursor[0] + 8 / this.camera.zoom,
          state.cursor[1] - 8 / this.camera.zoom
        )
      }
    })
  }

  private buildToolContext(): ToolContext {
    const state = getToolState()
    const session = this.session!
    return {
      shapesMap: session.shapesMap,
      getShapes: () => this.shapes,
      bboxCache: this.bboxCache,
      camera: this.camera,
      color: state.color,
      strokeWidth: state.strokeWidth,
      awareness: session.webrtc?.awareness ?? null,
      requestRender: () => this.scheduleRender(),
      requestOverlayRender: () => this.scheduleOverlay(),
      hasCapacity: () => canCreateShape(session.shapesMap),
      openTextEditor: (shapeId, world) => {
        const screen = this.worldToClientScreen(world)
        this.onTextEditorRequest({ shapeId, world, screen })
      },
      beginAction: () => session.undoManager.stopCapturing(),
    }
  }

  private worldToClientScreen(world: Point): Point {
    const rect = this.content.getBoundingClientRect()
    const [sx, sy] = worldToScreen(this.camera, world[0], world[1])
    return [rect.left + sx, rect.top + sy]
  }

  private screenPoint(e: PointerEvent): Point {
    const rect = this.content.getBoundingClientRect()
    return [e.clientX - rect.left, e.clientY - rect.top]
  }

  fitToBBox(box: BBox) {
    const w = box.maxX - box.minX || 200
    const h = box.maxY - box.minY || 200
    const zoom = Math.min(this.width / (w + 200), this.height / (h + 200), 4)
    this.setCamera({
      zoom,
      x: (box.minX + box.maxX) / 2 - this.width / 2 / zoom,
      y: (box.minY + box.maxY) / 2 - this.height / 2 / zoom,
    })
    this.scheduleRender()
  }

  fitToContent() {
    const box = unionBBox(this.shapes.map(rotatedBBox))
    if (box) this.fitToBBox(box)
  }

  getZoom(): number {
    return this.camera.zoom
  }

  zoomBy(factor: number) {
    this.setCamera(zoomCameraAt(this.camera, this.width / 2, this.height / 2, factor))
    this.scheduleRender()
  }

  resetZoom() {
    this.zoomBy(1 / this.camera.zoom)
  }

  undo() {
    this.session?.undoManager.undo()
  }

  redo() {
    this.session?.undoManager.redo()
  }

  private handlePointerDown = (e: PointerEvent) => {
    e.preventDefault()
    this.overlay.setPointerCapture(e.pointerId)
    const screen = this.screenPoint(e)
    this.pointers.set(e.pointerId, screen)

    if (this.pointers.size === 2) {
      this.beginPinch()
      return
    }

    if (e.button === 1 || this.spaceDown) {
      this.panPointerId = e.pointerId
      this.panLast = screen
      return
    }

    if (e.button !== 0 && e.pointerType === 'mouse') return
    if (!this.session) return

    const world = screenToWorld(this.camera, screen[0], screen[1])
    const toolCtx = this.buildToolContext()
    const tool = getTool(getToolState().activeTool)
    tool.onPointerDown?.(toolCtx, { world, screen, pointerId: e.pointerId, shiftKey: e.shiftKey }, e)
  }

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.pointers.has(e.pointerId) && e.pointerId !== this.panPointerId) {
      if (this.session) this.updateOwnCursor(e)
      return
    }
    const screen = this.screenPoint(e)
    if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, screen)

    if (this.pointers.size === 2) {
      this.updatePinch()
      return
    }

    if (this.panPointerId === e.pointerId && this.panLast) {
      const dx = screen[0] - this.panLast[0]
      const dy = screen[1] - this.panLast[1]
      this.setCamera(panCamera(this.camera, dx, dy))
      this.panLast = screen
      this.scheduleRender()
      return
    }

    if (!this.session) return
    const world = screenToWorld(this.camera, screen[0], screen[1])
    this.updateOwnCursor(e, world)
    const toolCtx = this.buildToolContext()
    const tool = getTool(getToolState().activeTool)
    tool.onPointerMove?.(toolCtx, { world, screen, pointerId: e.pointerId, shiftKey: e.shiftKey }, e)
  }

  private handlePointerUp = (e: PointerEvent) => {
    this.pointers.delete(e.pointerId)

    if (this.panPointerId === e.pointerId) {
      this.panPointerId = null
      this.panLast = null
      return
    }

    if (this.pointers.size < 2) {
      this.pinchLastDist = 0
    }

    if (!this.session) return
    const screen = this.screenPoint(e)
    const world = screenToWorld(this.camera, screen[0], screen[1])
    const toolCtx = this.buildToolContext()
    const tool = getTool(getToolState().activeTool)
    tool.onPointerUp?.(toolCtx, { world, screen, pointerId: e.pointerId, shiftKey: e.shiftKey }, e)
  }

  private updateOwnCursor(e: PointerEvent, world?: Point) {
    if (!this.session?.webrtc) return
    const screen = this.screenPoint(e)
    const w = world ?? screenToWorld(this.camera, screen[0], screen[1])
    setCursor(this.session.webrtc.awareness, w)
  }

  private beginPinch() {
    const pts = [...this.pointers.values()]
    this.pinchLastDist = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1])
    this.pinchLastMid = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2]
  }

  private updatePinch() {
    const pts = [...this.pointers.values()]
    const dist = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1])
    const mid: Point = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2]

    if (this.pinchLastDist > 0) {
      const factor = dist / this.pinchLastDist
      let camera = zoomCameraAt(this.camera, mid[0], mid[1], factor)
      const dx = mid[0] - this.pinchLastMid[0]
      const dy = mid[1] - this.pinchLastMid[1]
      camera = panCamera(camera, dx, dy)
      this.setCamera(camera)
    }
    this.pinchLastDist = dist
    this.pinchLastMid = mid
    this.scheduleRender()
  }

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    const rect = this.content.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top

    if (e.ctrlKey || e.metaKey) {
      const factor = Math.exp(-e.deltaY * 0.01)
      this.setCamera(zoomCameraAt(this.camera, sx, sy, factor))
    } else {
      this.setCamera(panCamera(this.camera, -e.deltaX, -e.deltaY))
    }
    this.scheduleRender()
  }

  private handleDoubleClick = (e: MouseEvent) => {
    if (!this.session || getToolState().activeTool !== 'select') return
    const rect = this.content.getBoundingClientRect()
    const screen: Point = [e.clientX - rect.left, e.clientY - rect.top]
    const world = screenToWorld(this.camera, screen[0], screen[1])
    const toolCtx = this.buildToolContext()
    const tool = getTool('text')
    tool.onPointerDown?.(toolCtx, { world, screen, pointerId: -1, shiftKey: false }, e as unknown as PointerEvent)
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null
    const isEditing =
      target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

    if (e.code === 'Space' && !isEditing) {
      this.spaceDown = true
    }

    if (isEditing) return

    if ((e.key === 'Delete' || e.key === 'Backspace') && this.session) {
      const ids = getSelection()
      if (ids.size > 0) {
        e.preventDefault()
        const session = this.session
        transactShapes(session.shapesMap, () => {
          ids.forEach((id) => deleteShape(session.shapesMap, id))
        })
        clearSelection()
      }
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && this.session) {
      e.preventDefault()
      if (e.shiftKey) this.session.undoManager.redo()
      else this.session.undoManager.undo()
    }

    if (e.key === 'Escape') {
      clearSelection()
    }
  }

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') this.spaceDown = false
  }
}
