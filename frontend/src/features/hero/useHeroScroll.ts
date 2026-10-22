import { useEffect, useRef, useState } from 'react'

import { progressFromScroll } from '@/features/hero/frameMath'

/**
 * Drives the pinned hero from scroll position.
 *
 * Progress is kept in a ref and read by the canvas's own rAF loop, because
 * repainting a canvas never needs a React render — turning every scroll tick
 * into state would re-render the whole hero subtree 60 times a second.
 *
 * A coarse `stage` IS state, because the DOM overlays (captions, booking bar)
 * do need re-rendering; it changes a handful of times across the whole
 * sequence instead of on every pixel.
 */
export type HeroScroll = {
  progressRef: React.RefObject<number>
  /** Rounded to 2dp, so overlays re-render ~100 times, not ~3000. */
  progress: number
}

export function useHeroScroll(
  sectionRef: React.RefObject<HTMLElement | null>,
  enabled: boolean,
): HeroScroll {
  const progressRef = useRef(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!enabled) {
      progressRef.current = 0
      return
    }

    let frame = 0

    const read = () => {
      frame = 0
      const section = sectionRef.current
      if (!section) return

      const rect = section.getBoundingClientRect()
      const value = progressFromScroll({
        scrollY: window.scrollY,
        // getBoundingClientRect is viewport-relative; add scrollY for the
        // document-relative top the maths expects.
        sectionTop: rect.top + window.scrollY,
        sectionHeight: rect.height,
        viewportHeight: window.innerHeight,
      })

      progressRef.current = value
      setProgress((previous) => {
        const rounded = Math.round(value * 100) / 100
        return rounded === previous ? previous : rounded
      })
    }

    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(read)
    }

    // Deferred, not called inline: on reload the browser restores scroll
    // position, so the first read must happen, but it belongs in a frame
    // rather than in the middle of this effect.
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame !== 0) window.cancelAnimationFrame(frame)
    }
  }, [sectionRef, enabled])

  // Derived rather than stored: with pinning off there is no scroll timeline
  // to track, and writing a zero into state from the effect would be a render
  // cascade for a value we already know.
  return { progressRef, progress: enabled ? progress : 0 }
}
