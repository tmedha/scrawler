import { nanoid } from 'nanoid'
import type { Tab } from '../types/tab'
import { setTabShared } from '../storage/tabs'
import { attachSharing, detachSharing, getCurrentSession } from './YDocManager'

export interface JoinInfo {
  roomId: string
  password: string
}

export function buildShareUrl(roomId: string, password: string): string {
  const url = new URL(window.location.href)
  url.hash = `/join/${roomId}/${password}`
  return url.toString()
}

export function parseJoinHash(hash: string): JoinInfo | null {
  const match = hash.match(/^#\/join\/([^/]+)\/([^/]+)$/)
  if (!match) return null
  return { roomId: match[1], password: match[2] }
}

export function shareTab(tab: Tab): { url: string; roomId: string; password: string } {
  const roomId = nanoid()
  const password = nanoid(24)
  setTabShared(tab.id, true, roomId, password)

  const session = getCurrentSession()
  if (session && session.tabId === tab.id) {
    detachSharing()
    attachSharing(roomId, password)
  }

  return { url: buildShareUrl(roomId, password), roomId, password }
}

export function unshareTab(tab: Tab) {
  setTabShared(tab.id, false)
  const session = getCurrentSession()
  if (session && session.tabId === tab.id) {
    detachSharing()
  }
}
