import { useSyncExternalStore } from 'react'
import type { ToolId } from '../tools/types'
import { getToolState, setActiveTool, subscribeToolState } from '../tools/store'
import { ColorPicker } from './ColorPicker'
import { StrokeWidthPicker } from './StrokeWidthPicker'

const TOOLS: { id: ToolId; label: string; icon: string }[] = [
  { id: 'select', label: 'Select', icon: '⬚' },
  { id: 'pen', label: 'Pen', icon: '✏' },
  { id: 'eraser', label: 'Eraser', icon: '⌫' },
  { id: 'line', label: 'Line', icon: '╱' },
  { id: 'arrow', label: 'Arrow', icon: '→' },
  { id: 'rectangle', label: 'Rectangle', icon: '▭' },
  { id: 'ellipse', label: 'Ellipse', icon: '◯' },
  { id: 'text', label: 'Text', icon: 'T' },
  { id: 'laser', label: 'Laser pointer', icon: '•' },
]

interface Props {
  atCapacity: boolean
}

export function Toolbar({ atCapacity }: Props) {
  const activeTool = useSyncExternalStore(subscribeToolState, () => getToolState().activeTool)
  const drawingTools = new Set<ToolId>(['pen', 'line', 'arrow', 'rectangle', 'ellipse', 'text'])

  return (
    <div className="toolbar">
      <div className="tool-group" role="group" aria-label="Tools">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            className={t.id === activeTool ? 'tool-btn active' : 'tool-btn'}
            title={t.label}
            disabled={atCapacity && drawingTools.has(t.id)}
            onClick={() => setActiveTool(t.id)}
          >
            {t.icon}
          </button>
        ))}
      </div>
      <ColorPicker />
      <StrokeWidthPicker />
      {atCapacity && (
        <div className="capacity-warning">5000 shape limit reached. Erase something to keep drawing.</div>
      )}
    </div>
  )
}
