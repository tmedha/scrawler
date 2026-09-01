import { nanoid } from 'nanoid'
import type { Tab } from '../types/tab'

const STORAGE_KEY = 'scrawler:tabs'
const ACTIVE_KEY = 'scrawler:activeTab'

type Listener = () => void

const listeners = new Set<Listener>()

function read(): Tab[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Tab[]
  } catch {
    return []
  }
}

function write(tabs: Tab[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs))
  listeners.forEach((l) => l())
}

export function subscribeTabs(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getTabs(): Tab[] {
  return read().sort((a, b) => a.order - b.order)
}

export function getActiveTabId(): string | null {
  return localStorage.getItem(ACTIVE_KEY)
}

export function setActiveTabId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id)
  listeners.forEach((l) => l())
}

export function createTab(name = 'Untitled'): Tab {
  const tabs = read()
  const tab: Tab = {
    id: nanoid(),
    name,
    order: tabs.length ? Math.max(...tabs.map((t) => t.order)) + 1 : 0,
    shared: false,
  }
  write([...tabs, tab])
  return tab
}

export function createJoinedTab(roomId: string, password: string, name = 'Shared canvas'): Tab {
  const tabs = read()
  const existing = tabs.find((t) => t.roomId === roomId)
  if (existing) return existing
  const tab: Tab = {
    id: nanoid(),
    name,
    order: tabs.length ? Math.max(...tabs.map((t) => t.order)) + 1 : 0,
    shared: true,
    roomId,
    roomPassword: password,
  }
  write([...tabs, tab])
  return tab
}

export function renameTab(id: string, name: string) {
  write(read().map((t) => (t.id === id ? { ...t, name } : t)))
}

export function deleteTab(id: string) {
  write(read().filter((t) => t.id !== id))
}

export function setTabShared(
  id: string,
  shared: boolean,
  roomId?: string,
  roomPassword?: string
) {
  write(
    read().map((t) =>
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
  const tabs = read()
  const byId = new Map(tabs.map((t) => [t.id, t]))
  const reordered = orderedIds
    .map((id, i) => {
      const t = byId.get(id)
      return t ? { ...t, order: i } : null
    })
    .filter((t): t is Tab => t !== null)
  write(reordered)
}

export function ensureAtLeastOneTab(): Tab {
  const tabs = getTabs()
  if (tabs.length > 0) return tabs[0]
  return createTab('My canvas')
}
