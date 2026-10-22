import { useEffect, useState } from 'react'

/**
 * True once the window has scrolled more than `threshold` pixels.
 *
 * Reads scroll position inside a rAF so a fast flick does not queue a layout
 * read per scroll event, and listens passively so the handler can never block
 * scrolling itself.
 */
export function useScrolledPast(threshold = 24): boolean {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let frame = 0

    const read = () => {
      frame = 0
      setScrolled(window.scrollY > threshold)
    }

    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(read)
    }

    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame !== 0) window.cancelAnimationFrame(frame)
    }
  }, [threshold])

  return scrolled
}
