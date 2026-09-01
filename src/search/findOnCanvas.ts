import type { Shape } from '../types/shape'

export function findMatches(shapes: Shape[], query: string): Shape[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return shapes.filter((s) => s.type === 'text' && (s.text ?? '').toLowerCase().includes(q))
}
