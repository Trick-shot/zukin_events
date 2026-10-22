import { describe, expect, it } from 'vitest'

import {
  beatAtFrame,
  bookingBarReveal,
  cameraScale,
  captionOpacity,
  clamp01,
  coverRect,
  expandPattern,
  frameFromProgress,
  framePath,
  lerpFrame,
  nearestLoadedFrame,
  progressFromFrame,
  progressFromScroll,
} from '@/features/hero/frameMath'
import type { HeroBeat } from '@/features/hero/manifest'

/** The real manifest's shape: 165 frames, seven beats, no gaps. */
const BEATS: HeroBeat[] = [
  { from: 1, to: 26, caption: 'Arrive' },
  { from: 27, to: 53, caption: 'The venue' },
  { from: 54, to: 62, caption: 'Zukin Hall' },
  { from: 63, to: 80, caption: 'Step inside' },
  { from: 81, to: 107, caption: 'The hall' },
  { from: 108, to: 135, caption: 'Made for the day' },
  { from: 136, to: 165, caption: 'Book your date' },
]

const FRAMES = 165
const FULL = { from: 1, to: FRAMES }

describe('progressFromScroll', () => {
  // A 450vh section on an 800px viewport scrolls 3600 - 800 = 2800px.
  const geometry = { sectionTop: 0, sectionHeight: 3600, viewportHeight: 800 }

  it('is 0 before and at the top of the section', () => {
    expect(progressFromScroll({ ...geometry, scrollY: -500 })).toBe(0)
    expect(progressFromScroll({ ...geometry, scrollY: 0 })).toBe(0)
  })

  it('reaches 1 exactly when the sticky stage hits the section bottom', () => {
    expect(progressFromScroll({ ...geometry, scrollY: 2800 })).toBe(1)
  })

  it('does not exceed 1 once the section is behind us', () => {
    expect(progressFromScroll({ ...geometry, scrollY: 99999 })).toBe(1)
  })

  it('measures the usable distance, not the full section height', () => {
    // Half of 2800, not half of 3600 — the bug this guards against ends the
    // sequence a viewport early and strands the last frames.
    expect(progressFromScroll({ ...geometry, scrollY: 1400 })).toBeCloseTo(0.5, 10)
  })

  it('accounts for the section not starting at the document top', () => {
    expect(
      progressFromScroll({ ...geometry, sectionTop: 1000, scrollY: 1000 }),
    ).toBe(0)
    expect(
      progressFromScroll({ ...geometry, sectionTop: 1000, scrollY: 2400 }),
    ).toBeCloseTo(0.5, 10)
  })

  it('returns 0 rather than dividing by zero when the stage is taller than the section', () => {
    expect(
      progressFromScroll({ scrollY: 500, sectionTop: 0, sectionHeight: 800, viewportHeight: 800 }),
    ).toBe(0)
  })
})

describe('frameFromProgress', () => {
  it('maps the ends onto the first and last frame', () => {
    expect(frameFromProgress(0, FULL)).toBe(1)
    expect(frameFromProgress(1, FULL)).toBe(FRAMES)
  })

  it('never leaves the 1..frames range', () => {
    expect(frameFromProgress(-1, FULL)).toBe(1)
    expect(frameFromProgress(2, FULL)).toBe(FRAMES)
  })

  it('puts the midpoint on the middle frame', () => {
    expect(frameFromProgress(0.5, FULL)).toBe(83)
  })

  it('reaches every frame across the scroll range', () => {
    const seen = new Set<number>()
    for (let step = 0; step <= 2000; step += 1) {
      seen.add(frameFromProgress(step / 2000, FULL))
    }
    expect(seen.size).toBe(FRAMES)
  })

  it('survives a single-frame sequence', () => {
    expect(frameFromProgress(0, { from: 1, to: 1 })).toBe(1)
    expect(frameFromProgress(1, { from: 1, to: 1 })).toBe(1)
  })

  it('honours a scrub range that stops short of the last frame', () => {
    // The placeholder clip fades to black over 163-165, so the manifest caps
    // the scrub at 162. The faded frames must be unreachable.
    const scrub = { from: 1, to: 162 }
    expect(frameFromProgress(0, scrub)).toBe(1)
    expect(frameFromProgress(1, scrub)).toBe(162)
    for (let step = 0; step <= 500; step += 1) {
      expect(frameFromProgress(step / 500, scrub)).toBeLessThanOrEqual(162)
    }
  })

  it('honours a scrub range that starts past the first frame', () => {
    const scrub = { from: 20, to: 60 }
    expect(frameFromProgress(0, scrub)).toBe(20)
    expect(frameFromProgress(1, scrub)).toBe(60)
    expect(frameFromProgress(0.5, scrub)).toBe(40)
  })

  it('round-trips through progressFromFrame', () => {
    for (const frame of [1, 2, 83, 164, 165]) {
      expect(frameFromProgress(progressFromFrame(frame, FULL), FULL)).toBe(frame)
    }
  })
})

describe('expandPattern / framePath', () => {
  it('zero-pads to the width in the pattern', () => {
    expect(expandPattern('f_%04d.webp', 1)).toBe('f_0001.webp')
    expect(expandPattern('f_%04d.webp', 165)).toBe('f_0165.webp')
  })

  it('does not truncate an index wider than the padding', () => {
    expect(expandPattern('f_%04d.webp', 12345)).toBe('f_12345.webp')
  })

  it('builds a path under the public sequence folder', () => {
    expect(framePath('f_%04d.webp', 'd', 7)).toBe('/hero-sequence/d/f_0007.webp')
    expect(framePath('f_%04d.webp', 'm', 7)).toBe('/hero-sequence/m/f_0007.webp')
  })
})

describe('beatAtFrame', () => {
  it('finds the beat covering a frame, inclusive at both edges', () => {
    expect(beatAtFrame(BEATS, 1)?.caption).toBe('Arrive')
    expect(beatAtFrame(BEATS, 26)?.caption).toBe('Arrive')
    expect(beatAtFrame(BEATS, 27)?.caption).toBe('The venue')
    expect(beatAtFrame(BEATS, 165)?.caption).toBe('Book your date')
  })

  it('returns null outside every beat', () => {
    expect(beatAtFrame(BEATS, 0)).toBeNull()
    expect(beatAtFrame(BEATS, 999)).toBeNull()
    expect(beatAtFrame([{ from: 10, to: 20, caption: 'x' }], 5)).toBeNull()
  })

  it('covers every frame of the real manifest with no gaps', () => {
    for (let frame = 1; frame <= FRAMES; frame += 1) {
      expect(beatAtFrame(BEATS, frame), `frame ${frame}`).not.toBeNull()
    }
  })
})

describe('captionOpacity', () => {
  const beat: HeroBeat = { from: 100, to: 200, caption: 'test' }

  it('is 0 outside the beat', () => {
    expect(captionOpacity(beat, 99)).toBe(0)
    expect(captionOpacity(beat, 201)).toBe(0)
  })

  it('fades in from the first frame and out to the last', () => {
    expect(captionOpacity(beat, 100)).toBe(0)
    expect(captionOpacity(beat, 200)).toBe(0)
  })

  it('is fully opaque through the middle', () => {
    expect(captionOpacity(beat, 150)).toBe(1)
  })

  it('rises monotonically through the fade-in', () => {
    let previous = -1
    for (let frame = 100; frame <= 118; frame += 1) {
      const value = captionOpacity(beat, frame)
      expect(value).toBeGreaterThanOrEqual(previous)
      previous = value
    }
  })

  it('handles a one-frame beat without dividing by zero', () => {
    expect(captionOpacity({ from: 5, to: 5, caption: 'x' }, 5)).toBe(1)
  })
})

describe('cameraScale', () => {
  it('runs 1.00 to 1.06 across the sequence', () => {
    expect(cameraScale(0)).toBe(1)
    expect(cameraScale(1)).toBeCloseTo(1.06, 10)
    expect(cameraScale(0.5)).toBeCloseTo(1.03, 10)
  })

  it('clamps rather than over-zooming past the ends', () => {
    expect(cameraScale(-1)).toBe(1)
    expect(cameraScale(5)).toBeCloseTo(1.06, 10)
  })
})

describe('bookingBarReveal', () => {
  it('stays hidden through the body of the sequence', () => {
    expect(bookingBarReveal(0)).toBe(0)
    expect(bookingBarReveal(0.5)).toBe(0)
    expect(bookingBarReveal(0.82)).toBe(0)
  })

  it('is fully risen by the end', () => {
    expect(bookingBarReveal(0.95)).toBe(1)
    expect(bookingBarReveal(1)).toBe(1)
  })

  it('interpolates across the reveal window', () => {
    expect(bookingBarReveal(0.885)).toBeCloseTo(0.5, 6)
  })
})

describe('coverRect', () => {
  it('fills a wider canvas by cropping the image top and bottom', () => {
    const rect = coverRect(1000, 1000, 1280, 720)
    expect(rect.dw).toBeCloseTo(1777.78, 1)
    expect(rect.dh).toBe(1000)
    expect(rect.dx).toBeCloseTo(-388.89, 1)
    expect(rect.dy).toBe(0)
  })

  it('centres the overflow so the crop is symmetric', () => {
    const rect = coverRect(800, 600, 1280, 720)
    expect(rect.dx + rect.dw / 2).toBeCloseTo(400, 6)
    expect(rect.dy + rect.dh / 2).toBeCloseTo(300, 6)
  })

  it('never leaves a gap at any aspect ratio', () => {
    for (const [cw, ch] of [[360, 780], [1440, 900], [2560, 1080], [800, 800]]) {
      const rect = coverRect(cw, ch, 1280, 720)
      expect(rect.dw).toBeGreaterThanOrEqual(cw - 0.001)
      expect(rect.dh).toBeGreaterThanOrEqual(ch - 0.001)
    }
  })

  it('applies the camera scale on top of the cover fit', () => {
    const plain = coverRect(1000, 1000, 1280, 720)
    const zoomed = coverRect(1000, 1000, 1280, 720, 1.06)
    expect(zoomed.dw).toBeCloseTo(plain.dw * 1.06, 6)
    expect(zoomed.dx + zoomed.dw / 2).toBeCloseTo(500, 6)
  })

  it('falls back to the canvas rect for a zero-sized image', () => {
    expect(coverRect(100, 50, 0, 0)).toEqual({ dx: 0, dy: 0, dw: 100, dh: 50 })
  })
})

describe('nearestLoadedFrame', () => {
  it('returns the target when it is decoded', () => {
    expect(nearestLoadedFrame(new Set([5]), 5, FRAMES)).toBe(5)
  })

  it('falls back to the closest decoded neighbour', () => {
    // The real case: the first 15 frames are in, the visitor flicks to 40.
    const loaded = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
    expect(nearestLoadedFrame(loaded, 40, FRAMES)).toBe(15)
  })

  it('prefers the earlier frame on a tie, so the camera never jumps ahead', () => {
    expect(nearestLoadedFrame(new Set([8, 12]), 10, FRAMES)).toBe(8)
  })

  it('returns null when nothing has decoded yet', () => {
    expect(nearestLoadedFrame(new Set(), 10, FRAMES)).toBeNull()
  })
})

describe('lerpFrame', () => {
  it('moves toward the target without overshooting', () => {
    const next = lerpFrame(10, 20, 0.2)
    expect(next).toBeGreaterThan(10)
    expect(next).toBeLessThan(20)
  })

  it('snaps once within half a frame so it cannot hover off-by-one', () => {
    expect(lerpFrame(19.9, 20, 0.2)).toBe(20)
    expect(lerpFrame(20, 20, 0.2)).toBe(20)
  })

  it('converges on a fast flick instead of trailing forever', () => {
    let current = 1
    for (let step = 0; step < 120; step += 1) current = lerpFrame(current, 165)
    expect(current).toBe(165)
  })
})

describe('clamp01', () => {
  it('clamps both ends and neutralises NaN', () => {
    expect(clamp01(-1)).toBe(0)
    expect(clamp01(2)).toBe(1)
    expect(clamp01(0.4)).toBe(0.4)
    expect(clamp01(Number.NaN)).toBe(0)
  })
})
