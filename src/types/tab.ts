export interface Tab {
  id: string
  name: string
  order: number
  shared: boolean
  roomId?: string
  roomPassword?: string
}
