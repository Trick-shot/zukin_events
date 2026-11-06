import { useEffect, useState } from 'react'

import type { HeroManifest } from '@/features/hero/manifest'

export type SequenceVariant = 'desktop' | 'mobile' | 'xl'

type NetworkInformation = { saveData?: boolean; effectiveType?: string }

/**
 * Chooses the xl (2560px), desktop (1920px) or mobile (960px) frame folder.
 *
 * Measured from the committed 104-frame sets: mobile 66KB/frame, desktop
 * 185KB, xl 239KB. Bigger frames have to be earned, not assumed — they are
 * used only when the stage is genuinely large in device pixels and the
 * connection has not asked us to economise.
 *
 * xl exists for the case the desktop set cannot serve: on a 2x display a
 * full-width hero rasterises to ~3840 device pixels, so the 1920 frames are
 * being stretched 2x and visibly soften. 1.5x DPR is the point where that
 * stretch starts to show, and 1024 CSS px keeps it off tablets in portrait,
 * where the extra bytes buy little.
 *
 * devicePixelRatio is capped at 2 for the desktop/mobile decision: a 3x phone
 * multiplies to a big number without the screen resolving the extra detail.
 */
export const XL_MIN_DPR = 1.5
export const XL_MIN_CSS_WIDTH = 1024

export function pickVariant(
  cssWidth: number,
  devicePixelRatio: number,
  connection?: NetworkInformation,
): SequenceVariant {
  if (connection?.saveData) return 'mobile'
  if (connection?.effectiveType && /^(slow-)?2g$/.test(connection.effectiveType)) return 'mobile'

  const dpr = devicePixelRatio || 1
  if (dpr >= XL_MIN_DPR && cssWidth >= XL_MIN_CSS_WIDTH) return 'xl'

  const effectiveWidth = cssWidth * Math.min(dpr, 2)
  return effectiveWidth >= 1280 ? 'desktop' : 'mobile'
}

/**
 * Drops a variant the manifest cannot serve back to one it can.
 *
 * The xl folder is optional, so a manifest without it must still render a
 * hero rather than request frames from `undefined`. Resolving here — rather
 * than where the folder is read — keeps `variant` and `folder` agreed, which
 * matters because the eager-frame budget is keyed off `variant`.
 */
export function resolveVariant(
  preferred: SequenceVariant,
  manifest: HeroManifest | null,
): SequenceVariant {
  if (!manifest) return preferred
  if (preferred === 'xl' && !manifest.folders.xl) return 'desktop'
  return preferred
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

  const resolved = resolveVariant(variant, manifest)

  return {
    variant: resolved,
    folder: manifest ? (manifest.folders[resolved] ?? manifest.folders.desktop) : null,
  }
}
