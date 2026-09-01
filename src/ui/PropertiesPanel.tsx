import { useRef, useState, useSyncExternalStore } from 'react'
import {
  MAX_STROKE_WIDTH,
  MIN_STROKE_WIDTH,
  PALETTE,
  getToolState,
  setColor,
  setStrokeWidth,
  subscribeToolState,
} from '../tools/store'
import type { ToolId } from '../tools/types'
import { useClickOutside } from './useClickOutside'

const STYLED_TOOLS = new Set<ToolId>(['pen', 'line', 'arrow', 'rectangle', 'ellipse', 'text'])

function dotSize(width: number) {
  return Math.min(22, Math.max(4, width))
}

export function PropertiesPanel() {
  const activeTool = useSyncExternalStore(subscribeToolState, () => getToolState().activeTool)
  const color = useSyncExternalStore(subscribeToolState, () => getToolState().color)
  const strokeWidth = useSyncExternalStore(subscribeToolState, () => getToolState().strokeWidth)
  const [colorOpen, setColorOpen] = useState(false)
  const [widthOpen, setWidthOpen] = useState(false)
  const colorRef = useRef<HTMLDivElement>(null)
  const widthRef = useRef<HTMLDivElement>(null)

  useClickOutside(colorRef, () => setColorOpen(false))
  useClickOutside(widthRef, () => setWidthOpen(false))

  if (!STYLED_TOOLS.has(activeTool)) return null

  return (
    <div className="properties-panel">
      <div className="properties-item" ref={colorRef}>
        <button
          className="swatch-trigger"
          style={{ background: color }}
          onClick={() => {
            setColorOpen((o) => !o)
            setWidthOpen(false)
          }}
          title="Color"
        />
        {colorOpen && (
          <div className="popover popover-right">
            <div className="color-grid">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  className={c === color ? 'color-swatch active' : 'color-swatch'}
                  style={{ background: c }}
                  onClick={() => {
                    setColor(c)
                    setColorOpen(false)
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="properties-item" ref={widthRef}>
        <button
          className="width-trigger"
          onClick={() => {
            setWidthOpen((o) => !o)
            setColorOpen(false)
          }}
          title="Stroke width"
        >
          <span
            className="width-dot"
            style={{ width: dotSize(strokeWidth), height: dotSize(strokeWidth) }}
          />
        </button>
        {widthOpen && (
          <div className="popover popover-right width-popover">
            <input
              type="range"
              min={MIN_STROKE_WIDTH}
              max={MAX_STROKE_WIDTH}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
            />
            <span className="width-value">{strokeWidth}px</span>
          </div>
        )}
      </div>
    </div>
  )
}
