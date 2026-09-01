import type { ToolId } from './types'

type Listener = () => void

const listeners = new Set<Listener>()

export const PALETTE = ['#1e1e1e', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#9c36b5']
export const STROKE_WIDTHS = [2, 4, 8, 16]

export interface ToolState {
  activeTool: ToolId
  color: string
  strokeWidth: number
}

const state: ToolState = {
  activeTool: 'pen',
  color: PALETTE[0],
  strokeWidth: STROKE_WIDTHS[1],
}

function notify() {
  listeners.forEach((l) => l())
}

export function getToolState(): ToolState {
  return state
}

export function setActiveTool(tool: ToolId) {
  state.activeTool = tool
  notify()
}

export function setColor(color: string) {
  state.color = color
  notify()
}

export function setStrokeWidth(width: number) {
  state.strokeWidth = width
  notify()
}

export function subscribeToolState(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
