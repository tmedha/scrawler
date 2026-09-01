import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { TabBar } from './ui/TabBar'
import { Toolbar } from './ui/Toolbar'
import { SearchBox } from './ui/SearchBox'
import { ExportButton } from './ui/ExportButton'
import { ShareDialog } from './ui/ShareDialog'
import { CanvasView } from './canvas/CanvasView'
import type { CanvasController } from './canvas/CanvasController'
import {
  createJoinedTab,
  ensureAtLeastOneTab,
  getActiveTabId,
  getTabs,
  setActiveTabId,
  subscribeTabs,
} from './storage/tabs'
import { parseJoinHash } from './collab/share'

export default function App() {
  const tabs = useSyncExternalStore(subscribeTabs, getTabs)
  const activeId = useSyncExternalStore(subscribeTabs, getActiveTabId)
  const [atCapacity, setAtCapacity] = useState(false)
  const controllerRef = useRef<CanvasController | null>(null)

  useEffect(() => {
    const joinInfo = parseJoinHash(window.location.hash)
    if (joinInfo) {
      const tab = createJoinedTab(joinInfo.roomId, joinInfo.password)
      setActiveTabId(tab.id)
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    } else {
      const tab = ensureAtLeastOneTab()
      if (!getActiveTabId()) setActiveTabId(tab.id)
    }
  }, [])

  const activeTab = tabs.find((t) => t.id === activeId) ?? null

  return (
    <div className="app">
      <TabBar />
      <div className="action-bar">
        <Toolbar atCapacity={atCapacity} />
        <div className="action-bar-right">
          <SearchBox getController={() => controllerRef.current} />
          {activeTab && <ExportButton getController={() => controllerRef.current} tab={activeTab} />}
          {activeTab && <ShareDialog tab={activeTab} getController={() => controllerRef.current} />}
        </div>
      </div>
      <div className="canvas-area">
        {activeTab && (
          <CanvasView
            tab={activeTab}
            onController={(c) => (controllerRef.current = c)}
            onCapacityChange={setAtCapacity}
          />
        )}
      </div>
    </div>
  )
}
