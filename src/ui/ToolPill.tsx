import { useRef, useSyncExternalStore } from 'react'
import type { ToolId } from '../tools/types'
import { getToolState, setActiveTool, subscribeToolState } from '../tools/store'
import {
  ArrowIcon,
  EllipseIcon,
  EraserIcon,
  ImageIcon,
  LaserIcon,
  LineIcon,
  PenIcon,
  RectangleIcon,
  SelectIcon,
  TextIcon,
} from './icons'

const TOOLS: { id: ToolId; label: string; icon: (size?: number) => JSX.Element }[] = [
  { id: 'select', label: 'Select', icon: (s) => <SelectIcon size={s} /> },
  { id: 'pen', label: 'Pen', icon: (s) => <PenIcon size={s} /> },
  { id: 'eraser', label: 'Eraser', icon: (s) => <EraserIcon size={s} /> },
  { id: 'line', label: 'Line', icon: (s) => <LineIcon size={s} /> },
  { id: 'arrow', label: 'Arrow', icon: (s) => <ArrowIcon size={s} /> },
  { id: 'rectangle', label: 'Rectangle', icon: (s) => <RectangleIcon size={s} /> },
  { id: 'ellipse', label: 'Ellipse', icon: (s) => <EllipseIcon size={s} /> },
  { id: 'text', label: 'Text', icon: (s) => <TextIcon size={s} /> },
]

const DRAWING_TOOLS = new Set<ToolId>(['pen', 'line', 'arrow', 'rectangle', 'ellipse', 'text'])

interface Props {
  atCapacity: boolean
  onImageFile: (file: File) => void
}

export function ToolPill({ atCapacity, onImageFile }: Props) {
  const activeTool = useSyncExternalStore(subscribeToolState, () => getToolState().activeTool)
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="tool-pill" role="group" aria-label="Tools">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          className={t.id === activeTool ? 'pill-btn active' : 'pill-btn'}
          title={t.label}
          disabled={atCapacity && DRAWING_TOOLS.has(t.id)}
          onClick={() => setActiveTool(t.id)}
        >
          {t.icon()}
        </button>
      ))}
      <button
        className="pill-btn"
        title="Insert image or PDF"
        disabled={atCapacity}
        onClick={() => fileInputRef.current?.click()}
      >
        <ImageIcon />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onImageFile(file)
          e.target.value = ''
        }}
      />
      <button
        className={activeTool === 'laser' ? 'pill-btn active' : 'pill-btn'}
        title="Laser pointer"
        onClick={() => setActiveTool('laser')}
      >
        <LaserIcon />
      </button>
    </div>
  )
}
