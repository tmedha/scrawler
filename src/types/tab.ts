export type TabBackground = 'plain' | 'lined'

export interface Tab {
  id: string
  name: string
  order: number
  shared: boolean
  roomId?: string
  roomPassword?: string
  background: TabBackground
}
