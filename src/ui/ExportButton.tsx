import type { CanvasController } from '../canvas/CanvasController'
import type { Tab } from '../types/tab'
import { exportShapesToPng } from '../export/exportPng'
import { DownloadIcon } from './icons'

interface Props {
  getController: () => CanvasController | null
  tab: Tab
}

export function ExportButton({ getController, tab }: Props) {
  function handleExport() {
    const controller = getController()
    if (!controller) return
    exportShapesToPng(controller.getShapes(), tab.name)
  }

  return (
    <button className="icon-btn" title="Download canvas as PNG" onClick={handleExport}>
      <DownloadIcon />
    </button>
  )
}
