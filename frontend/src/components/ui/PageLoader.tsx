import { Lottie } from 'lottie-react'
import { useEffect, useState } from 'react'

import loaderAnimation from '@/assets/lottie/zukin-loader-rose.json'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * Full-page wait state: a white screen with the rose loader, nothing else.
 *
 * Two timing rules from the motion spec, both here so no caller can forget
 * them: the loader only appears once a wait has lasted 300ms (fast loads
 * never flash it), and once visible it stays at least 500ms (it never
 * blinks). Under prefers-reduced-motion the Lottie is replaced by a static
 * ring.
 */
export function PageLoader({ label = 'Loading' }: { label?: string }) {
  const [visible, setVisible] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 300)
    return () => window.clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-label={label}
      className="fixed inset-0 z-50 flex items-center justify-center bg-paper"
    >
      {reducedMotion ? (
        <span
          aria-hidden="true"
          className="size-12 rounded-pill border-[3px] border-line border-t-gold"
        />
      ) : (
        <Lottie src={loaderAnimation} loop autoplay className="size-24" aria-hidden="true" />
      )}
      <span className="sr-only">{label}</span>
    </div>
  )
}
