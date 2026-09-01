import type { Awareness } from 'y-protocols/awareness'
import { nanoid } from 'nanoid'

export interface PresenceState {
  name: string
  color: string
  cursor: [number, number] | null
  laser: [number, number] | null
  laserAt: number | null
  drawingPreview: { color: string; strokeWidth: number; points: [number, number][] } | null
}

const GUEST_COLORS = [
  '#e03131',
  '#2f9e44',
  '#1971c2',
  '#f08c00',
  '#9c36b5',
  '#0c8599',
  '#e8590c',
]

export function randomGuestName(): string {
  const id = nanoid(4).toUpperCase()
  return `Guest-${id}`
}

export function randomGuestColor(): string {
  return GUEST_COLORS[Math.floor(Math.random() * GUEST_COLORS.length)]
}

export function initLocalPresence(awareness: Awareness) {
  const state: PresenceState = {
    name: randomGuestName(),
    color: randomGuestColor(),
    cursor: null,
    laser: null,
    laserAt: null,
    drawingPreview: null,
  }
  awareness.setLocalState(state)
}

export function setCursor(awareness: Awareness, cursor: [number, number] | null) {
  awareness.setLocalStateField('cursor', cursor)
}

export function setLaser(awareness: Awareness, point: [number, number] | null) {
  awareness.setLocalStateField('laser', point)
  awareness.setLocalStateField('laserAt', point ? Date.now() : null)
}

export function setDrawingPreview(
  awareness: Awareness,
  preview: PresenceState['drawingPreview']
) {
  awareness.setLocalStateField('drawingPreview', preview)
}

export function getRemoteStates(awareness: Awareness): Map<number, PresenceState> {
  const states = new Map<number, PresenceState>()
  awareness.getStates().forEach((state, clientId) => {
    if (clientId === awareness.clientID) return
    states.set(clientId, state as PresenceState)
  })
  return states
}
