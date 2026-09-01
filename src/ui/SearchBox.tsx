import { useMemo, useState } from 'react'
import type { CanvasController } from '../canvas/CanvasController'
import { findMatches } from '../search/findOnCanvas'
import { rotatedBBox } from '../canvas/bbox'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, SearchIcon } from './icons'

interface Props {
  getController: () => CanvasController | null
}

export function SearchBox({ getController }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)

  const matches = useMemo(() => {
    const controller = getController()
    if (!controller) return []
    return findMatches(controller.getShapes(), query)
  }, [query, getController])

  function goTo(i: number) {
    if (matches.length === 0) return
    const wrapped = ((i % matches.length) + matches.length) % matches.length
    setIndex(wrapped)
    const controller = getController()
    controller?.fitToBBox(rotatedBBox(matches[wrapped]))
  }

  if (!open) {
    return (
      <button className="icon-btn" title="Find on canvas" onClick={() => setOpen(true)}>
        <SearchIcon />
      </button>
    )
  }

  return (
    <div className="search-box">
      <input
        autoFocus
        placeholder="Find text on canvas"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIndex(0)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') goTo(index)
          if (e.key === 'Escape') setOpen(false)
        }}
      />
      <span className="search-count">
        {matches.length > 0 ? `${index + 1}/${matches.length}` : '0/0'}
      </span>
      <button title="Previous match" onClick={() => goTo(index - 1)} disabled={matches.length === 0}>
        <ChevronLeftIcon size={15} />
      </button>
      <button title="Next match" onClick={() => goTo(index + 1)} disabled={matches.length === 0}>
        <ChevronRightIcon size={15} />
      </button>
      <button
        title="Close"
        onClick={() => {
          setOpen(false)
          setQuery('')
        }}
      >
        <CloseIcon size={15} />
      </button>
    </div>
  )
}
