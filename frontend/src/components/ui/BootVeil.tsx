import { useEffect, useState } from 'react'

import { markBootDone } from '@/lib/bootGate'

/**
 * The hand-off from the index.html splash to the running app.
 *
 * Without it, a refresh is abrupt: the static splash ring vanishes the
 * instant React mounts and the page pops in mid-thought. This veil renders
 * the identical white screen and ring, holds for at least one full
 * oscillation of the ring (900ms) and until the document has finished
 * loading, then fades out over 400ms — so every refresh reads as one calm
 * breath: ring... ring... page.
 *
 * It mounts once per full page load (SiteLayout never remounts on SPA
 * navigation) and removes itself from the DOM when done. The hero's intro
 * film awaits markBootDone, so the film starts on a visible screen.
 */
const MIN_VISIBLE_MS = 900
const FADE_MS = 400

export function BootVeil() {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('visible')

  useEffect(() => {
    let fadeTimer: number | undefined
    let goneTimer: number | undefined

    const whenLoaded =
      document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            window.addEventListener('load', () => resolve(), { once: true })
          })
    const minHold = new Promise<void>((resolve) => {
      fadeTimer = window.setTimeout(resolve, MIN_VISIBLE_MS)
    })

    void Promise.all([whenLoaded, minHold]).then(() => {
      setPhase('fading')
      markBootDone()
      goneTimer = window.setTimeout(() => setPhase('gone'), FADE_MS)
    })

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(goneTimer)
      // Never leave the app gated if the veil unmounts early.
      markBootDone()
    }
  }, [])

  if (phase === 'gone') return null

  return (
    <div
      aria-hidden="true"
      style={{ transition: `opacity ${FADE_MS}ms ease-out`, opacity: phase === 'fading' ? 0 : 1 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-paper"
    >
      {/* The exact ring from the index.html splash, so the hand-off from
          static HTML to React is invisible. */}
      <span className="size-11 animate-spin rounded-pill border-[3px] border-line border-t-gold motion-reduce:animate-none" />
    </div>
  )
}
