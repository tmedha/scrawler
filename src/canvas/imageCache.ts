type CacheEntry = HTMLImageElement | 'loading' | 'error'

const cache = new Map<string, CacheEntry>()
const listeners = new Set<() => void>()

export function subscribeImageLoads(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getImage(src: string): HTMLImageElement | null {
  const entry = cache.get(src)
  if (entry instanceof HTMLImageElement) return entry
  if (entry === 'loading' || entry === 'error') return null

  cache.set(src, 'loading')
  const img = new Image()
  img.onload = () => {
    cache.set(src, img)
    listeners.forEach((l) => l())
  }
  img.onerror = () => {
    cache.set(src, 'error')
  }
  img.src = src
  return null
}
