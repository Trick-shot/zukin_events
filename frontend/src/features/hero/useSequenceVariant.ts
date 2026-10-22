import { useEffect, useState } from 'react'

import type { HeroManifest } from '@/features/hero/manifest'

export type SequenceVariant = 'desktop' | 'mobile'

type NetworkInformation = { saveData?: boolean; effectiveType?: string }

/**
 * Chooses the desktop (1280px) or mobile (720px) frame folder.
 *
 * Measured from the committed frames: desktop averages 57.9KB/frame and mobile
 * 25.7KB. The first 15 desktop frames are ~600KB, which is exactly the brief's
 * whole initial-payload budget — so desktop frames have to be earned, not
 * assumed. They are used only when the stage is genuinely large in device
 * pixels and the connection has not asked us to economise.
 *
 * devicePixelRatio is capped at 2 for this decision: a 3x phone multiplies to
 * a big number without the screen being able to resolve the extra detail.
 */
export function pickVariant(
  cssWidth: number,
  devicePixelRatio: number,
  connection?: NetworkInformation,
): SequenceVariant {
  if (connection?.saveData) return 'mobile'
  if (connection?.effectiveType && /^(slow-)?2g$/.test(connection.effectiveType)) return 'mobile'

  const effectiveWidth = cssWidth * Math.min(devicePixelRatio || 1, 2)
  return effectiveWidth >= 1280 ? 'desktop' : 'mobile'
}

export function useSequenceVariant(manifest: HeroManifest | null): {
  variant: SequenceVariant
  folder: string | null
} {
  const [variant, setVariant] = useState<SequenceVariant>(() => {
    if (typeof window === 'undefined') return 'mobile'
    return pickVariant(
      window.innerWidth,
      window.devicePixelRatio,
      (navigator as Navigator & { connection?: NetworkInformation }).connection,
    )
  })

  useEffect(() => {
    const read = () =>
      setVariant(
        pickVariant(
          window.innerWidth,
          window.devicePixelRatio,
          (navigator as Navigator & { connection?: NetworkInformation }).connection,
        ),
      )

    read()
    window.addEventListener('resize', read, { passive: true })
    return () => window.removeEventListener('resize', read)
  }, [])

  return {
    variant,
    folder: manifest ? manifest.folders[variant] : null,
  }
}
