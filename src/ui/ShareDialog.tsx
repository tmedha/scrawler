import { useEffect, useRef, useState } from 'react'
import type { CanvasController } from '../canvas/CanvasController'
import type { Tab } from '../types/tab'
import { buildShareUrl, shareTab, unshareTab } from '../collab/share'
import { getCurrentSession } from '../collab/YDocManager'
import { ShareIcon } from './icons'
import { useClickOutside } from './useClickOutside'
import { copyToClipboard } from './clipboard'

interface Props {
  tab: Tab
  getController: () => CanvasController | null
}

export function ShareDialog({ tab, getController }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [peerCount, setPeerCount] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)

  useClickOutside(wrapperRef, () => setOpen(false))

  const url = tab.shared && tab.roomId && tab.roomPassword ? buildShareUrl(tab.roomId, tab.roomPassword) : null

  useEffect(() => {
    if (!tab.shared) {
      setPeerCount(0)
      return
    }
    const interval = window.setInterval(() => {
      const session = getCurrentSession()
      if (session?.webrtc) {
        setPeerCount(Math.max(0, session.webrtc.awareness.getStates().size - 1))
      }
    }, 1000)
    return () => window.clearInterval(interval)
  }, [tab.shared, tab.id])

  function handleShare() {
    shareTab(tab)
    getController()?.rebindAwareness()
    setOpen(true)
  }

  function handleUnshare() {
    unshareTab(tab)
    getController()?.rebindAwareness()
    setOpen(false)
  }

  async function copy() {
    if (!url) return
    const success = await copyToClipboard(url)
    if (success) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } else {
      linkInputRef.current?.focus()
      linkInputRef.current?.select()
    }
  }

  return (
    <div className="share-dialog-wrapper" ref={wrapperRef}>
      <button
        className={tab.shared ? 'share-btn shared' : 'share-btn'}
        onClick={() => (tab.shared ? setOpen((o) => !o) : handleShare())}
      >
        <ShareIcon size={15} />
        {tab.shared ? `Shared${peerCount > 0 ? ` · ${peerCount}` : ''}` : 'Share'}
      </button>
      {open && url && (
        <div className="popover popover-below share-popover">
          <input ref={linkInputRef} readOnly value={url} onFocus={(e) => e.target.select()} />
          <div className="share-popover-actions">
            <button onClick={copy}>{copied ? 'Copied' : 'Copy link'}</button>
            <button onClick={handleUnshare}>Stop sharing</button>
          </div>
          <p className="share-note">
            Anyone with this link can view and draw. Stop sharing and share again to revoke it.
          </p>
        </div>
      )}
    </div>
  )
}
