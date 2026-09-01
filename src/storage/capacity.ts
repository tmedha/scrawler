import { SHAPE_CAP } from '../types/shape'

export interface SizedMap {
  size: number
}

export function canCreateShape(shapesMap: SizedMap): boolean {
  return shapesMap.size < SHAPE_CAP
}

export function remainingCapacity(shapesMap: SizedMap): number {
  return Math.max(0, SHAPE_CAP - shapesMap.size)
}
