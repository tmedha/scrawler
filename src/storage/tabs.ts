import { nanoid } from 'nanoid'
import type { Tab, TabBackground } from '../types/tab'

const STORAGE_KEY = 'scrawler:tabs'
const ACTIVE_KEY = 'scrawler:activeTab'

type Listener = () => void

const listeners = new Set<Listener>()

function readFromStorage(): Tab[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Tab[]
    return parsed.map((t) => ({ ...t, background: t.background ?? 'plain' }))
  } catch {
    return []
  }
}

function sortTabs(tabs: Tab[]): Tab[] {
  return [...tabs].sort((a, b) => a.order - b.order)
}

let cache: Tab[] = readFromStorage()
let sortedCache: Tab[] = sortTabs(cache)

function write(tabs: Tab[]) {
  cache = tabs
  sortedCache = sortTabs(tabs)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs))
  listeners.forEach((l) => l())
}

export function subscribeTabs(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getTabs(): Tab[] {
  return sortedCache
}

export function getActiveTabId(): string | null {
  return localStorage.getItem(ACTIVE_KEY)
}

export function setActiveTabId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id)
  listeners.forEach((l) => l())
}

export function createTab(name = 'Untitled'): Tab {
  const tab: Tab = {
    id: nanoid(),
    name,
    order: cache.length ? Math.max(...cache.map((t) => t.order)) + 1 : 0,
    shared: false,
    background: 'plain',
  }
  write([...cache, tab])
  return tab
}

export function createJoinedTab(roomId: string, password: string, name = 'Shared canvas'): Tab {
  const existing = cache.find((t) => t.roomId === roomId)
  if (existing) return existing
  const tab: Tab = {
    id: nanoid(),
    name,
    order: cache.length ? Math.max(...cache.map((t) => t.order)) + 1 : 0,
    shared: true,
    roomId,
    roomPassword: password,
    background: 'plain',
  }
  write([...cache, tab])
  return tab
}

export function renameTab(id: string, name: string) {
  write(cache.map((t) => (t.id === id ? { ...t, name } : t)))
}

export function setTabBackground(id: string, background: TabBackground) {
  write(cache.map((t) => (t.id === id ? { ...t, background } : t)))
}

export function deleteTab(id: string) {
  write(cache.filter((t) => t.id !== id))
}

export function setTabShared(
  id: string,
  shared: boolean,
  roomId?: string,
  roomPassword?: string
) {
  write(
    cache.map((t) =>
      t.id === id
        ? {
            ...t,
            shared,
            roomId: shared ? roomId : undefined,
            roomPassword: shared ? roomPassword : undefined,
          }
        : t
    )
  )
}

export function reorderTabs(orderedIds: string[]) {
  const byId = new Map(cache.map((t) => [t.id, t]))
  const reordered = orderedIds
    .map((id, i) => {
      const t = byId.get(id)
      return t ? { ...t, order: i } : null
    })
    .filter((t): t is Tab => t !== null)
  write(reordered)
}

export function ensureAtLeastOneTab(): Tab {
  if (sortedCache.length > 0) return sortedCache[0]
  return createTab('My canvas')
}
