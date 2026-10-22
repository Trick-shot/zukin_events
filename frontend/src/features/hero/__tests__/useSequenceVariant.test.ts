import { describe, expect, it } from 'vitest'

import { pickVariant } from '@/features/hero/useSequenceVariant'

/**
 * Measured from the committed frames: desktop 57.9KB/frame, mobile 25.7KB.
 * Choosing desktop costs roughly 2.3x the data, so these cases are about when
 * that is actually earned by the screen.
 */
describe('pickVariant', () => {
  it('uses the mobile set on a phone', () => {
    expect(pickVariant(390, 3)).toBe('mobile')
    expect(pickVariant(360, 2)).toBe('mobile')
  })

  it('uses the desktop set on a laptop', () => {
    expect(pickVariant(1440, 2)).toBe('desktop')
    expect(pickVariant(1280, 1)).toBe('desktop')
  })

  it('caps devicePixelRatio at 2, so a 3x phone does not pose as a desktop', () => {
    // 480 * 3 = 1440 would cross the threshold, but the screen cannot resolve
    // the extra detail — 480 * 2 = 960 keeps it on the mobile set.
    expect(pickVariant(480, 3)).toBe('mobile')
  })

  it('respects Save-Data regardless of how big the screen is', () => {
    expect(pickVariant(2560, 2, { saveData: true })).toBe('mobile')
  })

  it('drops to mobile on 2g', () => {
    expect(pickVariant(1920, 2, { effectiveType: '2g' })).toBe('mobile')
    expect(pickVariant(1920, 2, { effectiveType: 'slow-2g' })).toBe('mobile')
  })

  it('leaves faster connections alone', () => {
    expect(pickVariant(1920, 2, { effectiveType: '4g' })).toBe('desktop')
    expect(pickVariant(1920, 2, { effectiveType: '3g' })).toBe('desktop')
  })

  it('treats a missing devicePixelRatio as 1 rather than collapsing to zero', () => {
    expect(pickVariant(1440, 0)).toBe('desktop')
  })
})
