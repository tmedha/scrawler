import type { Tab } from '../types/tab'
import { setTabBackground } from '../storage/tabs'
import { LinesIcon } from './icons'

interface Props {
  tab: Tab
}

export function BackgroundToggle({ tab }: Props) {
  const lined = tab.background === 'lined'

  return (
    <button
      className={lined ? 'icon-btn active' : 'icon-btn'}
      title={lined ? 'Switch to plain background' : 'Switch to lined background'}
      onClick={() => setTabBackground(tab.id, lined ? 'plain' : 'lined')}
    >
      <LinesIcon />
    </button>
  )
}
