import * as Y from 'yjs'
import { nanoid } from 'nanoid'
import type { Shape } from '../types/shape'
import { localTransact } from './undo'
import { canCreateShape } from '../storage/capacity'

export type ShapesMap = Y.Map<Y.Map<unknown>>

const FIELDS: (keyof Shape)[] = [
  'id',
  'type',
  'points',
  'color',
  'strokeWidth',
  'rotation',
  'text',
  'fontSize',
  'src',
  'createdAt',
]

export function shapeFromYMap(yShape: Y.Map<unknown>): Shape {
  const obj: Record<string, unknown> = {}
  for (const field of FIELDS) {
    const value = yShape.get(field)
    if (value !== undefined) obj[field] = value
  }
  return obj as unknown as Shape
}

export function createShape(shapesMap: ShapesMap, data: Omit<Shape, 'id' | 'createdAt'>): Shape {
  const shape: Shape = { ...data, id: nanoid(), createdAt: Date.now() }
  const doc = shapesMap.doc
  if (!doc) throw new Error('shapesMap is not attached to a doc')
  localTransact(doc, () => {
    const yShape = new Y.Map<unknown>()
    for (const field of FIELDS) {
      const value = shape[field]
      if (value !== undefined) yShape.set(field, value)
    }
    shapesMap.set(shape.id, yShape)
  })
  return shape
}

export function updateShape(shapesMap: ShapesMap, id: string, patch: Partial<Shape>) {
  const yShape = shapesMap.get(id)
  if (!yShape) return
  const doc = shapesMap.doc
  if (!doc) return
  localTransact(doc, () => {
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue
      yShape.set(key, value)
    }
  })
}

export function deleteShape(shapesMap: ShapesMap, id: string) {
  const doc = shapesMap.doc
  if (!doc) return
  localTransact(doc, () => {
    shapesMap.delete(id)
  })
}

export function getShape(shapesMap: ShapesMap, id: string): Shape | null {
  const yShape = shapesMap.get(id)
  return yShape ? shapeFromYMap(yShape) : null
}

export function transactShapes(shapesMap: ShapesMap, fn: () => void) {
  const doc = shapesMap.doc
  if (!doc) return
  localTransact(doc, fn)
}

export function getAllShapes(shapesMap: ShapesMap): Shape[] {
  const shapes: Shape[] = []
  shapesMap.forEach((yShape) => shapes.push(shapeFromYMap(yShape)))
  return shapes
}

export function importShapes(shapesMap: ShapesMap, shapes: Shape[]): number {
  const doc = shapesMap.doc
  if (!doc) return 0
  let count = 0
  localTransact(doc, () => {
    for (const data of shapes) {
      if (!canCreateShape(shapesMap)) break
      const id = nanoid()
      const yShape = new Y.Map<unknown>()
      for (const field of FIELDS) {
        const value = field === 'id' ? id : data[field]
        if (value !== undefined) yShape.set(field, value)
      }
      shapesMap.set(id, yShape)
      count++
    }
  })
  return count
}
