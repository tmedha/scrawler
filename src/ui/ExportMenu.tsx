import { useRef, useState } from 'react'
import type { CanvasController } from '../canvas/CanvasController'
import type { Tab } from '../types/tab'
import { exportShapesToPng } from '../export/exportPng'
import { exportCanvasToJson } from '../export/exportCanvasJson'
import { DownloadIcon } from './icons'
import { useClickOutside } from './useClickOutside'

interface Props {
  getController: () => CanvasController | null
  tab: Tab
}

export function ExportMenu({ getController, tab }: Props) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  useClickOutside(wrapperRef, () => setOpen(false))

  function exportPng() {
    const controller = getController()
    if (controller) exportShapesToPng(controller.getShapes(), tab.name)
    setOpen(false)
  }

  function exportJson() {
    const controller = getController()
    if (controller) exportCanvasToJson(tab.name, tab.background, controller.getShapes())
    setOpen(false)
  }

  return (
    <div className="share-dialog-wrapper" ref={wrapperRef}>
      <button className="icon-btn" title="Export" onClick={() => setOpen((o) => !o)}>
        <DownloadIcon />
      </button>
      {open && (
        <div className="popover popover-below export-popover">
          <button onClick={exportPng}>Image (PNG)</button>
          <button onClick={exportJson}>Canvas file (.json)</button>
        </div>
      )}
    </div>
  )
}
