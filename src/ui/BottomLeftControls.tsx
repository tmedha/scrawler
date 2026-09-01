import type { CanvasController } from '../canvas/CanvasController'
import { FitContentIcon, MinusIcon, PlusIcon, RedoIcon, UndoIcon } from './icons'

interface Props {
  getController: () => CanvasController | null
  zoom: number
  canUndo: boolean
  canRedo: boolean
}

const ZOOM_STEP = 1.2

export function BottomLeftControls({ getController, zoom, canUndo, canRedo }: Props) {
  return (
    <div className="bottom-left-controls">
      <div className="control-cluster">
        <button title="Undo" disabled={!canUndo} onClick={() => getController()?.undo()}>
          <UndoIcon />
        </button>
        <button title="Redo" disabled={!canRedo} onClick={() => getController()?.redo()}>
          <RedoIcon />
        </button>
      </div>
      <button className="control-cluster" title="Fit content" onClick={() => getController()?.fitToContent()}>
        <FitContentIcon />
      </button>
      <div className="control-cluster zoom-cluster">
        <button title="Zoom out" onClick={() => getController()?.zoomBy(1 / ZOOM_STEP)}>
          <MinusIcon size={14} />
        </button>
        <button className="zoom-value" title="Reset zoom" onClick={() => getController()?.resetZoom()}>
          {Math.round(zoom * 100)}%
        </button>
        <button title="Zoom in" onClick={() => getController()?.zoomBy(ZOOM_STEP)}>
          <PlusIcon size={14} />
        </button>
      </div>
    </div>
  )
}
