import type { CanvasController } from '../canvas/CanvasController'
import type { Tab } from '../types/tab'
import { SearchBox } from './SearchBox'
import { ExportButton } from './ExportButton'
import { ShareDialog } from './ShareDialog'

interface Props {
  tab: Tab
  getController: () => CanvasController | null
}

export function TopRightControls({ tab, getController }: Props) {
  return (
    <div className="top-right-controls">
      <SearchBox getController={getController} />
      <ExportButton getController={getController} tab={tab} />
      <ShareDialog tab={tab} getController={getController} />
    </div>
  )
}
