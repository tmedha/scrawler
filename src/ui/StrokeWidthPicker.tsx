import { useSyncExternalStore } from 'react'
import { STROKE_WIDTHS, getToolState, setStrokeWidth, subscribeToolState } from '../tools/store'

export function StrokeWidthPicker() {
  const strokeWidth = useSyncExternalStore(subscribeToolState, () => getToolState().strokeWidth)

  return (
    <div className="tool-group" role="group" aria-label="Stroke width">
      {STROKE_WIDTHS.map((w) => (
        <button
          key={w}
          className={w === strokeWidth ? 'width-btn active' : 'width-btn'}
          onClick={() => setStrokeWidth(w)}
          title={`${w}px`}
        >
          <span className="width-dot" style={{ width: Math.min(w, 16), height: Math.min(w, 16) }} />
        </button>
      ))}
    </div>
  )
}
