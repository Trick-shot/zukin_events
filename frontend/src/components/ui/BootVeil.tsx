import { Suspense, lazy, useEffect, useState } from 'react'

import { useReducedMotion } from '@/hooks/useReducedMotion'
import { markBootDone } from '@/lib/bootGate'

/** Same lazy chunk PageLoader uses, so the rose is fetched once for both. */
const PageLoaderAnimation = lazy(() => import('@/components/ui/PageLoaderAnimation'))

/**
 * The hand-off from the index.html splash to the running app.
 *
 * Without it, a refresh is abrupt: the static splash vanishes the instant
 * React mounts and the page pops in mid-thought. This veil holds the same
 * white screen for at least 900ms and until the document has finished
 * loading, then fades out over 400ms, so every refresh reads as one calm
 * breath rather than a flash.
 *
 * It shows the rose, the brand's own loader animation, which is also what
 * PageLoader uses between routes. The bronze ring remains the fallback for
 * two cases it cannot cover: the lottie player is a lazy chunk and may not
 * have arrived yet, and under prefers-reduced-motion a looping flower is
 * exactly the kind of thing the setting asks us not to play. index.html's
 * first-paint splash is still a ring by necessity, since it renders before
 * any JavaScript exists to play an animation.
 *
 * It mounts once per full page load (SiteLayout never remounts on SPA
 * navigation) and removes itself from the DOM when done. The hero's intro
 * film awaits markBootDone, so the film starts on a visible screen.
 */
const MIN_VISIBLE_MS = 900
const FADE_MS = 400

export function BootVeil() {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('visible')
  const reducedMotion = useReducedMotion()

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

  /* The index.html splash ring, reused so the hand-off from static HTML to
     React is invisible while the rose chunk is still on its way. */
  const ring = (
    <span
      aria-hidden="true"
      className="size-11 animate-spin rounded-pill border-[3px] border-line border-t-gold motion-reduce:animate-none"
    />
  )

  return (
    <div
      aria-hidden="true"
      style={{ transition: `opacity ${FADE_MS}ms ease-out`, opacity: phase === 'fading' ? 0 : 1 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-paper"
    >
      {reducedMotion ? (
        ring
      ) : (
        <Suspense fallback={ring}>
          <PageLoaderAnimation />
        </Suspense>
      )}
    </div>
  )
}
