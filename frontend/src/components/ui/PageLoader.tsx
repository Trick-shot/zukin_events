import { Suspense, lazy, useEffect, useState } from 'react'

import { useReducedMotion } from '@/hooks/useReducedMotion'

const PageLoaderAnimation = lazy(() => import('@/components/ui/PageLoaderAnimation'))

/**
 * Full-page wait state: a white screen with the rose loader, nothing else.
 *
 * Timing rules from the motion spec live here so no caller can forget them:
 * the loader only appears once a wait has lasted 300ms (fast loads never
 * flash it).
 *
 * The flower is the only mark; there is no ring behind or beside it. Under
 * prefers-reduced-motion it is held still rather than swapped for something
 * else, and while the lazy player chunk is still arriving the screen is
 * simply the white it was always going to be, which is quieter than showing
 * one mark and replacing it with another a moment later.
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
      <Suspense fallback={null}>
        <PageLoaderAnimation still={reducedMotion} />
      </Suspense>
      <span className="sr-only">{label}</span>
    </div>
  )
}
