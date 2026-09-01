import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { WebrtcProvider } from 'y-webrtc'
import type { Tab } from '../types/tab'
import type { ShapesMap } from './shapes'
import { initLocalPresence } from './awareness'
import { makeUndoManager } from './undo'

const SIGNALING_SERVERS = ['ws://localhost:4444']

export interface DocSession {
  tabId: string
  doc: Y.Doc
  shapesMap: ShapesMap
  indexeddb: IndexeddbPersistence
  webrtc: WebrtcProvider | null
  undoManager: Y.UndoManager
  synced: Promise<void>
  destroy: () => void
}

let current: DocSession | null = null

export function getCurrentSession(): DocSession | null {
  return current
}

function buildSession(tab: Tab): DocSession {
  const doc = new Y.Doc()
  const shapesMap = doc.getMap('shapes') as ShapesMap
  const indexeddb = new IndexeddbPersistence(`scrawler-${tab.id}`, doc)
  const synced = new Promise<void>((resolve) => {
    indexeddb.once('synced', () => resolve())
  })

  let webrtc: WebrtcProvider | null = null
  if (tab.shared && tab.roomId) {
    webrtc = createWebrtcProvider(tab.roomId, doc, tab.roomPassword)
  }

  const undoManager = makeUndoManager(shapesMap)

  const destroy = () => {
    undoManager.destroy()
    webrtc?.destroy()
    indexeddb.destroy()
    doc.destroy()
  }

  return { tabId: tab.id, doc, shapesMap, indexeddb, webrtc, undoManager, synced, destroy }
}

export function createWebrtcProvider(roomId: string, doc: Y.Doc, password?: string) {
  const provider = new WebrtcProvider(roomId, doc, {
    signaling: SIGNALING_SERVERS,
    password,
  })
  initLocalPresence(provider.awareness)
  return provider
}

export function activateTab(tab: Tab): DocSession {
  if (current && current.tabId === tab.id) return current
  if (current) current.destroy()
  current = buildSession(tab)
  return current
}

export function deactivate() {
  if (current) {
    current.destroy()
    current = null
  }
}

export function attachSharing(roomId: string, password?: string) {
  if (!current) return
  if (current.webrtc) return
  current.webrtc = createWebrtcProvider(roomId, current.doc, password)
}

export function detachSharing() {
  if (!current || !current.webrtc) return
  current.webrtc.destroy()
  current.webrtc = null
}
