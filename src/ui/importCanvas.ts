import type { CanvasController } from '../canvas/CanvasController'
import { createTab, getActiveTabId, setActiveTabId, setTabBackground } from '../storage/tabs'
import { activateTab } from '../collab/YDocManager'
import { importShapes } from '../collab/shapes'
import type { CanvasFile } from '../export/exportCanvasJson'

export async function importCanvasFile(file: File, controller: CanvasController | null): Promise<void> {
  const text = await file.text()
  let data: CanvasFile
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('That file is not a valid canvas export.')
  }
  if (!data || !Array.isArray(data.shapes)) {
    throw new Error('That file is not a valid canvas export.')
  }

  const name = typeof data.name === 'string' && data.name.trim() ? data.name.trim() : 'Imported canvas'
  const tab = createTab(name)
  if (data.background === 'lined') setTabBackground(tab.id, 'lined')

  const prevTabId = getActiveTabId()
  const session = activateTab(tab)
  if (controller) {
    if (prevTabId) controller.saveCamera(prevTabId)
    controller.setSession(session, tab.id)
  }
  importShapes(session.shapesMap, data.shapes)
  setActiveTabId(tab.id)
}
