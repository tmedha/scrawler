import { useState, useSyncExternalStore } from 'react'
import {
  createTab,
  deleteTab,
  getActiveTabId,
  getTabs,
  renameTab,
  setActiveTabId,
  subscribeTabs,
} from '../storage/tabs'

export function TabBar() {
  const tabs = useSyncExternalStore(subscribeTabs, getTabs)
  const activeId = useSyncExternalStore(subscribeTabs, getActiveTabId)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  function startRename(id: string, name: string) {
    setEditingId(id)
    setDraft(name)
  }

  function commitRename() {
    if (editingId && draft.trim()) renameTab(editingId, draft.trim())
    setEditingId(null)
  }

  function handleNewTab() {
    const tab = createTab(`Canvas ${tabs.length + 1}`)
    setActiveTabId(tab.id)
  }

  function handleClose(id: string) {
    if (tabs.length <= 1) return
    const wasActive = id === activeId
    deleteTab(id)
    if (wasActive) {
      const remaining = getTabs()
      if (remaining.length > 0) setActiveTabId(remaining[0].id)
    }
  }

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={tab.id === activeId ? 'tab active' : 'tab'}
          onClick={() => setActiveTabId(tab.id)}
          onDoubleClick={() => startRename(tab.id, tab.name)}
        >
          {tab.shared && <span className="tab-shared-dot" title="Shared" />}
          {editingId === tab.id ? (
            <input
              className="tab-rename-input"
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') setEditingId(null)
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="tab-name">{tab.name}</span>
          )}
          {tabs.length > 1 && (
            <button
              className="tab-close"
              title="Close tab"
              onClick={(e) => {
                e.stopPropagation()
                handleClose(tab.id)
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button className="tab-add" title="New canvas" onClick={handleNewTab}>
        +
      </button>
    </div>
  )
}
