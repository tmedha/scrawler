import type { CanvasController } from '../canvas/CanvasController'
import type { Tab } from '../types/tab'
import { SearchBox } from './SearchBox'
import { ExportMenu } from './ExportMenu'
import { ImportButton } from './ImportButton'
import { ShareDialog } from './ShareDialog'
import { BackgroundToggle } from './BackgroundToggle'

interface Props {
  tab: Tab
  getController: () => CanvasController | null
}

export function TopRightControls({ tab, getController }: Props) {
  return (
    <div className="top-right-controls">
      <BackgroundToggle tab={tab} />
      <SearchBox getController={getController} />
      <ImportButton getController={getController} />
      <ExportMenu getController={getController} tab={tab} />
      <ShareDialog tab={tab} getController={getController} />
    </div>
  )
}
