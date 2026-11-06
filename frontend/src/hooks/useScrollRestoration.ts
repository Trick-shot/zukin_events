import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router'

const KEY_PREFIX = 'zukin-scroll:'

/**
 * Manual scroll restoration, replacing the browser's.
 *
 * The browser restores scroll before React has rendered the page, so on tall
 * scripted pages (the 360vh pinned hero above all) the restore hits a short
 * document, clamps to 0, and the visitor loses their place — and the hero,
 * seeing scrollY 0, replays its intro film. Owning restoration fixes the
 * order: this hook saves the position as the visitor scrolls, and puts it
 * back in a layout effect — synchronously before first paint and, crucially,
 * before the hero's manifest fetch can resolve, so the intro's "has the
 * visitor already scrolled?" check reads the restored truth.
 *
 * Navigation types split the behaviour: POP (reload, back/forward) restores
 * the saved position for the path; PUSH/REPLACE (a link click) starts at the
 * top, as a navigation should.
 */
export function useScrollRestoration(): void {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useLayoutEffect(() => {
    const key = KEY_PREFIX + pathname

    if (navigationType === 'POP') {
      let saved = 0
      try {
        saved = Number(window.sessionStorage.getItem(key)) || 0
      } catch {
        // Storage can be blocked; starting at the top is the safe default.
      }
      if (saved > 0) {
        // Immediate, inside the layout effect: the page (hero included) has
        // rendered at full height, and nothing async has run yet.
        window.scrollTo(0, saved)
        // Belt and braces: if late content (fonts, images with no reserved
        // space) grows the page after paint, re-assert once a frame until
        // the target fits or a short budget runs out.
        let tries = 0
        const assert = () => {
          const max = document.documentElement.scrollHeight - window.innerHeight
          if (Math.abs(window.scrollY - Math.min(saved, max)) > 4 && tries < 20) {
            tries += 1
            window.scrollTo(0, saved)
            window.requestAnimationFrame(assert)
          }
        }
        window.requestAnimationFrame(assert)
      }
    } else {
      window.scrollTo(0, 0)
    }

    let frame = 0
    const onScroll = () => {
      if (frame !== 0) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        try {
          window.sessionStorage.setItem(key, String(Math.round(window.scrollY)))
        } catch {
          // Best effort only.
        }
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame !== 0) window.cancelAnimationFrame(frame)
    }
  }, [pathname, navigationType])
}
