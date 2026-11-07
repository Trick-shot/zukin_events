import { useEffect, useRef, useState } from 'react'

import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * Reveals an element the first time it scrolls into view, once.
 *
 * Three rules, all of them about never hiding content by accident:
 *
 * - Under prefers-reduced-motion it reveals on mount and observes nothing, so
 *   the reduced-motion path never depends on scrolling at all.
 * - Without IntersectionObserver it reveals on mount rather than waiting for
 *   an event that will never arrive.
 * - It never un-reveals. Scrolling back up past a section must not blank it.
 *
 * The `-12%` bottom margin holds the reveal until the element is a little way
 * inside the viewport. Without it, everything already on screen at load fires
 * at once and the page arrives in one lump, which is the opposite of the
 * point.
 */
export function useReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null)
  const reducedMotion = useReducedMotion()
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (revealed) return

    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      // Observing is exactly the external system this effect exists for, and
      // these are its two "never observe at all" exits. Revealing here is the
      // fallback that guarantees content is visible without a scroll event.
      // oxlint-disable-next-line react/set-state-in-effect
      setRevealed(true)
      return
    }

    const node = ref.current
    if (!node) {
      // Nothing to observe; showing the content is the only safe outcome.
      // oxlint-disable-next-line react/set-state-in-effect
      setRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.01, rootMargin: '0px 0px -12% 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [reducedMotion, revealed])

  return { ref, revealed }
}
