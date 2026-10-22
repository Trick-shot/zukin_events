import { useEffect, useState } from 'react'

import { framePath } from '@/features/hero/frameMath'
import type { SequenceVariant } from '@/features/hero/useSequenceVariant'
import type { HeroManifest } from '@/features/hero/manifest'

/**
 * How many frames load before scrubbing is declared usable.
 *
 * The brief budgets ~600KB for the initial hero payload. Measured against the
 * committed frames, 15 desktop frames is 652KB — over it — while 15 mobile
 * frames is 286KB. So the count is per-variant rather than a single number:
 * 12 desktop frames measure ~520KB, and 12 frames still covers the first ~7%
 * of a 450vh scroll, which is far more runway than the background loader
 * needs to stay ahead of a reader.
 */
export const EAGER_FRAME_COUNT: Record<SequenceVariant, number> = {
  desktop: 12,
  mobile: 15,
}

const BACKGROUND_CONCURRENCY = 6

export type FrameSequence = {
  /** Decoded frames, indexed 1..frames. Mutated in place; not React state. */
  images: Map<number, HTMLImageElement>
  /** Frame indices that have finished decoding. */
  loaded: Set<number>
}

export type SequenceStatus = {
  /** The first EAGER_FRAME_COUNT frames have decoded; scrubbing can start. */
  ready: boolean
  /** Frame 1 has decoded; the poster can be drawn. */
  posterReady: boolean
  /** 0..1 across the whole sequence, for diagnostics. */
  loadedFraction: number
  error: string | null
}

function loadImage(src: string, signal: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.src = src

    const onAbort = () => {
      image.src = ''
      reject(new DOMException('aborted', 'AbortError'))
    }
    if (signal.aborted) return onAbort()
    signal.addEventListener('abort', onAbort, { once: true })

    const settle = (fn: () => void) => {
      signal.removeEventListener('abort', onAbort)
      fn()
    }

    // decode() resolves once the bitmap is ready to paint, so the first
    // drawImage cannot block the main thread mid-scroll. Browsers that reject
    // it (or lack it) still get a usable image from the load event.
    const finish = () => settle(() => resolve(image))
    if (typeof image.decode === 'function') {
      image.decode().then(finish, () => (image.complete ? finish() : undefined))
    }
    image.addEventListener('load', finish, { once: true })
    image.addEventListener(
      'error',
      () => settle(() => reject(new Error(`Failed to load ${src}`))),
      { once: true },
    )
  })
}

/**
 * Progressive loader for the frame sequence.
 *
 * Three stages, in priority order:
 *   1. frame 1, so a poster paints immediately and the stage is never blank;
 *   2. the first ~15 frames, after which scrubbing is usable;
 *   3. everything else, a few at a time in the background.
 *
 * Frames live in a ref-held Map rather than React state on purpose: 165
 * decoded images arriving one at a time would be 165 renders, and the canvas
 * reads them from inside a rAF loop that never needs a re-render to repaint.
 * Only the coarse status flags are state.
 */
export function useFrameSequence(
  manifest: HeroManifest | null,
  folder: string | null,
  variant: SequenceVariant,
): { sequence: FrameSequence; status: SequenceStatus } {
  // The sequence container is state, not a ref, even though the Map and Set
  // inside it are mutated without re-rendering. Its identity has to change
  // when the variant switches, so HeroCanvas's effect tears down its rAF loop
  // and restarts against the new frames — with a ref it would keep drawing
  // from a Map that nothing refills.
  const [sequence, setSequence] = useState<FrameSequence>(() => ({
    images: new Map(),
    loaded: new Set(),
  }))
  const [status, setStatus] = useState<SequenceStatus>({
    ready: false,
    posterReady: false,
    loadedFraction: 0,
    error: null,
  })

  useEffect(() => {
    if (!manifest || !folder) return

    // Switching variant (desktop <-> mobile) invalidates every decoded frame.
    // Loading 165 images over the network is exactly the external system an
    // effect is for, so resetting here is the intended shape, not a cascade.
    const sequence: FrameSequence = { images: new Map(), loaded: new Set() }
    // Starting a 165-image network load is the external system this effect
    // exists to synchronise with, so the reset belongs here.
    // oxlint-disable-next-line react/set-state-in-effect
    setSequence(sequence)
    // oxlint-disable-next-line react/set-state-in-effect
    setStatus({ ready: false, posterReady: false, loadedFraction: 0, error: null })

    const controller = new AbortController()
    const { signal } = controller
    // Only the scrub range is downloaded. Fetching frames the hero will never
    // draw would spend a visitor's data on a fade-out they cannot reach.
    const { from, to } = manifest.scrub
    const total = to - from + 1

    const record = (index: number, image: HTMLImageElement) => {
      sequence.images.set(index, image)
      sequence.loaded.add(index)
    }

    const run = async () => {
      try {
        const poster = await loadImage(framePath(manifest.pattern, folder, from), signal)
        if (signal.aborted) return
        record(from, poster)
        setStatus((previous) => ({
          ...previous,
          posterReady: true,
          loadedFraction: sequence.loaded.size / total,
        }))

        const eagerEnd = from + Math.min(EAGER_FRAME_COUNT[variant], total) - 1
        await Promise.all(
          Array.from({ length: eagerEnd - from }, (_, offset) => from + offset + 1).map(async (index) => {
            const image = await loadImage(framePath(manifest.pattern, folder, index), signal)
            if (!signal.aborted) record(index, image)
          }),
        )
        if (signal.aborted) return
        setStatus((previous) => ({
          ...previous,
          ready: true,
          loadedFraction: sequence.loaded.size / total,
        }))

        // Background fill. A shared cursor with a few workers keeps the
        // network busy without opening 150 parallel requests, which on a
        // phone would starve the frames the visitor is actually looking at.
        let cursor = eagerEnd + 1
        const worker = async () => {
          while (!signal.aborted) {
            const index = cursor
            cursor += 1
            if (index > to) return
            try {
              const image = await loadImage(framePath(manifest.pattern, folder, index), signal)
              if (signal.aborted) return
              record(index, image)
              if (index % 10 === 0 || index === to) {
                setStatus((previous) => ({
                  ...previous,
                  loadedFraction: sequence.loaded.size / total,
                }))
              }
            } catch {
              // One missing frame must not stall the rest; nearestLoadedFrame
              // covers the gap on screen.
            }
          }
        }

        await Promise.all(
          Array.from({ length: Math.min(BACKGROUND_CONCURRENCY, total) }, worker),
        )
        if (!signal.aborted) {
          setStatus((previous) => ({
            ...previous,
            loadedFraction: sequence.loaded.size / total,
          }))
        }
      } catch (error) {
        if (signal.aborted) return
        setStatus((previous) => ({
          ...previous,
          error: error instanceof Error ? error.message : 'Failed to load the hero sequence',
        }))
      }
    }

    void run()
    return () => controller.abort()
  }, [manifest, folder, variant])

  return { sequence, status }
}
