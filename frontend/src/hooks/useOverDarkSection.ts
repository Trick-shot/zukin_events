import { useEffect, useState } from 'react'

/**
 * True while the given element still covers the top of the viewport.
 *
 * The header needs this rather than a fixed scroll threshold: the hero is
 * pinned for 450vh, so "scrolled more than 120px" would turn the bar cream
 * while it is still sitting on a dark photograph, four thousand pixels before
 * the page actually turns cream.
 *
 * Returns false when the element is absent, which is what makes /book and the
 * 404 start solid without the header knowing anything about those routes.
 */
export function useOverDarkSection(selector: string, offset = 80): boolean {
  const [over, setOver] = useState(false)

  useEffect(() => {
    let frame = 0

    const read = () => {
      frame = 0
      const element = document.querySelector(selector)
      if (!element) {
        setOver(false)
        return
      }
      const { bottom } = element.getBoundingClientRect()
      setOver(bottom > offset)
    }

    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(read)
    }

    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame !== 0) window.cancelAnimationFrame(frame)
    }
  }, [selector, offset])

  return over
}
