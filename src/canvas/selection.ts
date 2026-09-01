type Listener = () => void

let selected = new Set<string>()
const listeners = new Set<Listener>()

export function getSelection(): Set<string> {
  return selected
}

export function setSelection(ids: string[]) {
  selected = new Set(ids)
  listeners.forEach((l) => l())
}

export function toggleSelection(id: string) {
  const next = new Set(selected)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected = next
  listeners.forEach((l) => l())
}

export function clearSelection() {
  if (selected.size === 0) return
  selected = new Set()
  listeners.forEach((l) => l())
}

export function subscribeSelection(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
