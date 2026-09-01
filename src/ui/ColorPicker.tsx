import { PALETTE, getToolState, setColor, subscribeToolState } from '../tools/store'
import { useSyncExternalStore } from 'react'

export function ColorPicker() {
  const color = useSyncExternalStore(subscribeToolState, () => getToolState().color)

  return (
    <div className="tool-group" role="group" aria-label="Color">
      {PALETTE.map((c) => (
        <button
          key={c}
          className={c === color ? 'color-swatch active' : 'color-swatch'}
          style={{ background: c }}
          onClick={() => setColor(c)}
          title={c}
        />
      ))}
    </div>
  )
}
