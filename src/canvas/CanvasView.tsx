import { useEffect, useRef, useState } from 'react'
import type { Tab } from '../types/tab'
import { CanvasController, type TextEditorRequest } from './CanvasController'
import type { Camera } from './viewport'
import { activateTab, getCurrentSession } from '../collab/YDocManager'
import { createShape, deleteShape, getShape, updateShape } from '../collab/shapes'
import { canCreateShape } from '../storage/capacity'
import { getToolState } from '../tools/store'

interface Props {
  tab: Tab
  onController: (controller: CanvasController) => void
  onCapacityChange: (atCapacity: boolean) => void
  onCameraChange: (camera: Camera) => void
  onUndoStateChange: (state: { canUndo: boolean; canRedo: boolean }) => void
  onImageFile: (file: File) => void
}

export function CanvasView({
  tab,
  onController,
  onCapacityChange,
  onCameraChange,
  onUndoStateChange,
  onImageFile,
}: Props) {
  const contentRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const controllerRef = useRef<CanvasController | null>(null)
  const prevTabId = useRef<string | null>(null)
  const [textEditor, setTextEditor] = useState<TextEditorRequest>(null)

  useEffect(() => {
    if (!contentRef.current || !overlayRef.current) return
    const controller = new CanvasController(contentRef.current, overlayRef.current)
    controller.onTextEditorRequest = setTextEditor
    controller.onCapacityChange = onCapacityChange
    controller.onCameraChange = onCameraChange
    controller.onUndoStateChange = onUndoStateChange
    controller.onImagePaste = onImageFile
    controllerRef.current = controller
    onController(controller)
    return () => {
      controller.destroy()
      controllerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const controller = controllerRef.current
    if (!controller) return
    if (prevTabId.current && prevTabId.current !== tab.id) controller.saveCamera(prevTabId.current)
    const session = activateTab(tab)
    controller.setSession(session, tab.id)
    prevTabId.current = tab.id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab.id, tab.shared, tab.roomId, tab.roomPassword])

  useEffect(() => {
    controllerRef.current?.setBackgroundStyle(tab.background)
  }, [tab.id, tab.background])

  return (
    <div className="canvas-view">
      <canvas ref={contentRef} className="canvas-layer" />
      <canvas ref={overlayRef} className="canvas-layer" />
      {textEditor && <TextEditorOverlay request={textEditor} onClose={() => setTextEditor(null)} />}
    </div>
  )
}

function TextEditorOverlay({
  request,
  onClose,
}: {
  request: NonNullable<TextEditorRequest>
  onClose: () => void
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState(() => {
    if (!request.shapeId) return ''
    const session = getCurrentSession()
    const shape = session ? getShape(session.shapesMap, request.shapeId) : null
    return shape?.text ?? ''
  })
  const committed = useRef(false)

  useEffect(() => {
    areaRef.current?.focus()
    areaRef.current?.select()
  }, [])

  function commit() {
    if (committed.current) return
    committed.current = true
    const session = getCurrentSession()
    if (!session) {
      onClose()
      return
    }
    session.undoManager.stopCapturing()
    const text = value.trim()
    if (request.shapeId) {
      if (text) updateShape(session.shapesMap, request.shapeId, { text })
      else deleteShape(session.shapesMap, request.shapeId)
    } else if (text && canCreateShape(session.shapesMap)) {
      const tool = getToolState()
      createShape(session.shapesMap, {
        type: 'text',
        points: [request.world],
        color: tool.color,
        strokeWidth: tool.strokeWidth,
        rotation: 0,
        text,
        fontSize: 20,
      })
    }
    onClose()
  }

  return (
    <textarea
      ref={areaRef}
      className="text-editor-overlay"
      style={{ left: request.screen[0], top: request.screen[1] }}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          committed.current = true
          onClose()
        }
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          commit()
        }
      }}
    />
  )
}
