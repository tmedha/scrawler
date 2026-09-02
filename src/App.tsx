import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { TabBar } from './ui/TabBar'
import { ToolPill } from './ui/ToolPill'
import { PropertiesPanel } from './ui/PropertiesPanel'
import { BottomLeftControls } from './ui/BottomLeftControls'
import { TopRightControls } from './ui/TopRightControls'
import { CanvasView } from './canvas/CanvasView'
import type { CanvasController } from './canvas/CanvasController'
import type { Camera } from './canvas/viewport'
import {
  createJoinedTab,
  ensureAtLeastOneTab,
  getActiveTabId,
  getTabs,
  setActiveTabId,
  subscribeTabs,
} from './storage/tabs'
import { parseJoinHash } from './collab/share'
import { insertFile } from './ui/insertImage'

export default function App() {
  const tabs = useSyncExternalStore(subscribeTabs, getTabs)
  const activeId = useSyncExternalStore(subscribeTabs, getActiveTabId)
  const [atCapacity, setAtCapacity] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [undoState, setUndoState] = useState({ canUndo: false, canRedo: false })
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

  function handleImageFile(file: File) {
    insertFile(file, controllerRef.current)
  }

  return (
    <div className="app">
      <TabBar />
      <div className="canvas-area">
        {activeTab && (
          <CanvasView
            tab={activeTab}
            onController={(c) => (controllerRef.current = c)}
            onCapacityChange={setAtCapacity}
            onCameraChange={(camera: Camera) => setZoom(camera.zoom)}
            onUndoStateChange={setUndoState}
            onImageFile={handleImageFile}
          />
        )}

        <ToolPill atCapacity={atCapacity} onImageFile={handleImageFile} />
        <PropertiesPanel />

        {atCapacity && (
          <div className="capacity-toast">
            5000 shape limit reached. Erase something to keep drawing.
          </div>
        )}

        <BottomLeftControls
          getController={() => controllerRef.current}
          zoom={zoom}
          canUndo={undoState.canUndo}
          canRedo={undoState.canRedo}
        />

        {activeTab && (
          <TopRightControls tab={activeTab} getController={() => controllerRef.current} />
        )}
      </div>
    </div>
  )
}
