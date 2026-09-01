import type { BBox, Point } from '../types/shape'

export interface Camera {
  x: number
  y: number
  zoom: number
}

export const MIN_ZOOM = 0.05
export const MAX_ZOOM = 8

export function createCamera(): Camera {
  return { x: 0, y: 0, zoom: 1 }
}

export function screenToWorld(camera: Camera, sx: number, sy: number): Point {
  return [sx / camera.zoom + camera.x, sy / camera.zoom + camera.y]
}

export function worldToScreen(camera: Camera, wx: number, wy: number): Point {
  return [(wx - camera.x) * camera.zoom, (wy - camera.y) * camera.zoom]
}

export function panCamera(camera: Camera, dxScreen: number, dyScreen: number): Camera {
  return {
    ...camera,
    x: camera.x - dxScreen / camera.zoom,
    y: camera.y - dyScreen / camera.zoom,
  }
}

export function zoomCameraAt(
  camera: Camera,
  sx: number,
  sy: number,
  factor: number
): Camera {
  const newZoom = clamp(camera.zoom * factor, MIN_ZOOM, MAX_ZOOM)
  const [wx, wy] = screenToWorld(camera, sx, sy)
  return {
    zoom: newZoom,
    x: wx - sx / newZoom,
    y: wy - sy / newZoom,
  }
}

export function visibleWorldRect(camera: Camera, width: number, height: number): BBox {
  const [minX, minY] = screenToWorld(camera, 0, 0)
  const [maxX, maxY] = screenToWorld(camera, width, height)
  return { minX, minY, maxX, maxY }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}
