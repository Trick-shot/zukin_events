import { describe, expect, it } from 'vitest'

import type { HeroManifest } from '@/features/hero/manifest'
import { pickVariant, resolveVariant } from '@/features/hero/useSequenceVariant'

/**
 * Measured from the committed 104-frame sets: mobile 66KB/frame, desktop
 * 185KB, xl 239KB. Every case here is about whether the screen actually earns
 * the heavier set.
 */
describe('pickVariant', () => {
  it('uses the mobile set on a phone', () => {
    expect(pickVariant(390, 3)).toBe('mobile')
    expect(pickVariant(360, 2)).toBe('mobile')
  })

  it('uses the xl set on a retina laptop, where 1920 frames would stretch 2x', () => {
    expect(pickVariant(1440, 2)).toBe('xl')
    expect(pickVariant(1680, 2)).toBe('xl')
  })

  it('uses the desktop set on a 1x screen, however wide', () => {
    expect(pickVariant(1280, 1)).toBe('desktop')
    expect(pickVariant(2560, 1)).toBe('desktop')
  })

  it('needs both the density and the width before it spends xl bytes', () => {
    // Dense enough, but too narrow to be a desktop hero.
    expect(pickVariant(820, 2)).toBe('desktop')
    // Wide enough, but not dense enough to show the difference.
    expect(pickVariant(1920, 1.25)).toBe('desktop')
  })

  it('switches to xl exactly at the documented thresholds', () => {
    expect(pickVariant(1024, 1.5)).toBe('xl')
    expect(pickVariant(1023, 1.5)).toBe('desktop')
    expect(pickVariant(1024, 1.49)).toBe('desktop')
  })

  it('caps devicePixelRatio at 2 for the desktop/mobile split', () => {
    // 480 * 3 = 1440 would cross the desktop threshold, but the screen cannot
    // resolve the extra detail — and 480 is far below the xl width floor.
    expect(pickVariant(480, 3)).toBe('mobile')
  })

  it('respects Save-Data regardless of how big or dense the screen is', () => {
    expect(pickVariant(2560, 2, { saveData: true })).toBe('mobile')
  })

  it('drops to mobile on 2g', () => {
    expect(pickVariant(1920, 2, { effectiveType: '2g' })).toBe('mobile')
    expect(pickVariant(1920, 2, { effectiveType: 'slow-2g' })).toBe('mobile')
  })

  it('leaves faster connections alone', () => {
    expect(pickVariant(1920, 2, { effectiveType: '4g' })).toBe('xl')
    expect(pickVariant(1920, 1, { effectiveType: '3g' })).toBe('desktop')
  })

  it('treats a missing devicePixelRatio as 1 rather than collapsing to zero', () => {
    expect(pickVariant(1440, 0)).toBe('desktop')
  })
})

const manifest = (folders: HeroManifest['folders']): HeroManifest => ({
  frames: 104,
  scrub: { from: 1, to: 104 },
  pattern: 'f_%04d.webp',
  folders,
  beats: [],
})

describe('resolveVariant', () => {
  it('keeps xl when the manifest ships an xl folder', () => {
    expect(resolveVariant('xl', manifest({ desktop: 'd', mobile: 'm', xl: 'xl' }))).toBe('xl')
  })

  it('falls back to desktop when the manifest has no xl folder', () => {
    // A manifest predating the retina set must still render a hero rather
    // than request frames from an undefined folder.
    expect(resolveVariant('xl', manifest({ desktop: 'd', mobile: 'm' }))).toBe('desktop')
  })

  it('never downgrades a variant the manifest can serve', () => {
    const full = manifest({ desktop: 'd', mobile: 'm', xl: 'xl' })
    expect(resolveVariant('mobile', full)).toBe('mobile')
    expect(resolveVariant('desktop', full)).toBe('desktop')
  })

  it('leaves the preference alone until a manifest arrives', () => {
    expect(resolveVariant('xl', null)).toBe('xl')
  })
})
