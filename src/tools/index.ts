import type { Tool, ToolId } from './types'
import { selectTool } from './select'
import { penTool } from './pen'
import { eraserTool } from './eraser'
import { lineTool, arrowTool, rectangleTool, ellipseTool } from './shapeTools'
import { textTool } from './text'
import { laserTool } from './laser'

export const tools: Record<ToolId, Tool> = {
  select: selectTool,
  pen: penTool,
  eraser: eraserTool,
  line: lineTool,
  arrow: arrowTool,
  rectangle: rectangleTool,
  ellipse: ellipseTool,
  text: textTool,
  laser: laserTool,
}

export function getTool(id: ToolId): Tool {
  return tools[id]
}
