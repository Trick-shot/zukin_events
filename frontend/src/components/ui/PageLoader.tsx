import { Suspense, lazy, useEffect, useState } from 'react'

import { useReducedMotion } from '@/hooks/useReducedMotion'

const PageLoaderAnimation = lazy(() => import('@/components/ui/PageLoaderAnimation'))

/**
 * Full-page wait state: a white screen with the rose loader, nothing else.
 *
 * Timing rules from the motion spec live here so no caller can forget them:
 * the loader only appears once a wait has lasted 300ms (fast loads never
 * flash it). The Lottie player itself is a lazy chunk; until it arrives —
 * and always under prefers-reduced-motion — a static bronze ring matching
 * the index.html splash shows instead, so the hand-off is seamless.
 */
export function PageLoader({ label = 'Loading' }: { label?: string }) {
  const [visible, setVisible] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 300)
    return () => window.clearTimeout(timer)
  }, [])

  if (!visible) return null

  const ring = (
    <span
      aria-hidden="true"
      className="size-11 animate-spin rounded-pill border-[3px] border-line border-t-gold motion-reduce:animate-none"
    />
  )

  return (
    <div
      role="status"
      aria-label={label}
      className="fixed inset-0 z-50 flex items-center justify-center bg-paper"
    >
      {reducedMotion ? ring : (
        <Suspense fallback={ring}>
          <PageLoaderAnimation />
        </Suspense>
      )}
      <span className="sr-only">{label}</span>
    </div>
  )
}
