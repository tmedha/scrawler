export type ShapeType = 'pen' | 'line' | 'arrow' | 'rectangle' | 'ellipse' | 'text' | 'image'

export type Point = [number, number]

export interface Shape {
  id: string
  type: ShapeType
  points: Point[]
  color: string
  strokeWidth: number
  rotation: number
  text?: string
  fontSize?: number
  src?: string
  createdAt: number
}

export interface BBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export const SHAPE_CAP = 5000
