import { useEffect, useState } from 'react'

import { framePath } from '@/features/hero/frameMath'
import type { SequenceVariant } from '@/features/hero/useSequenceVariant'
import type { HeroManifest } from '@/features/hero/manifest'

/**
 * How many frames load before scrubbing is declared usable.
 *
 * The brief budgets ~600KB for the initial hero payload. The counts are
 * per-variant because desktop frames are roughly twice the bytes of mobile
 * ones; with the 1920px set, 12 desktop frames is ~2MB — the budget is
 * documented as outgrown in docs/UI_HANDOFF.md, traded for image quality.
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
  /** The eager neighbourhood has decoded; scrubbing can start. */
  ready: boolean
  /** The first (priority) frame has decoded; a poster can be drawn. */
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
 * Priority-driven rather than front-to-back: `priorityRef` holds the frame
 * the visitor is currently standing on (the hero updates it on every scroll
 * and during the intro), and every stage of the loader works outward from
 * it —
 *   1. the priority frame itself, so the right poster paints immediately —
 *      on a mid-page reload that is the frame under the restored scroll
 *      position, not frame 1;
 *   2. its nearest EAGER_FRAME_COUNT neighbours, after which scrubbing is
 *      declared usable;
 *   3. everything else, a few at a time, always picking the unloaded frame
 *      closest to wherever the visitor is NOW.
 *
 * This is what stops a reload at the end of the sequence from looking like a
 * fast-forward: the tail frames arrive first because the visitor is standing
 * on them.
 *
 * The whole range from the intro's first frame to the scrub's last is
 * downloaded; anything outside (trimmed handles) is never fetched.
 */
export function useFrameSequence(
  manifest: HeroManifest | null,
  folder: string | null,
  variant: SequenceVariant,
  priorityRef?: React.RefObject<number>,
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
    // Loading ~100 images over the network is exactly the external system an
    // effect is for, so resetting here is the intended shape, not a cascade.
    const sequence: FrameSequence = { images: new Map(), loaded: new Set() }
    // oxlint-disable-next-line react/set-state-in-effect
    setSequence(sequence)
    // oxlint-disable-next-line react/set-state-in-effect
    setStatus({ ready: false, posterReady: false, loadedFraction: 0, error: null })

    const controller = new AbortController()
    const { signal } = controller
    const from = manifest.intro
      ? Math.min(manifest.intro.from, manifest.scrub.from)
      : manifest.scrub.from
    const to = manifest.scrub.to
    const total = to - from + 1

    const clampIndex = (value: number) =>
      Math.max(from, Math.min(to, Math.round(Number.isFinite(value) ? value : from)))
    const priority = () => clampIndex(priorityRef?.current ?? from)

    const pending = new Set<number>(
      Array.from({ length: total }, (_, offset) => from + offset),
    )

    /** The unloaded frame closest to where the visitor is right now. */
    const takeNearest = (): number | null => {
      const target = priority()
      let best: number | null = null
      let bestDistance = Infinity
      for (const index of pending) {
        const distance = Math.abs(index - target)
        if (distance < bestDistance) {
          best = index
          bestDistance = distance
          if (distance === 0) break
        }
      }
      if (best !== null) pending.delete(best)
      return best
    }

    const record = (index: number, image: HTMLImageElement) => {
      sequence.images.set(index, image)
      sequence.loaded.add(index)
    }

    const fetchFrame = async (index: number) => {
      const image = await loadImage(framePath(manifest.pattern, folder, index), signal)
      if (!signal.aborted) record(index, image)
    }

    const run = async () => {
      try {
        const posterIndex = takeNearest()
        if (posterIndex === null) return
        await fetchFrame(posterIndex)
        if (signal.aborted) return
        setStatus((previous) => ({
          ...previous,
          posterReady: true,
          loadedFraction: sequence.loaded.size / total,
        }))

        const eager: number[] = []
        for (let i = 1; i < Math.min(EAGER_FRAME_COUNT[variant], total); i += 1) {
          const index = takeNearest()
          if (index !== null) eager.push(index)
        }
        await Promise.all(eager.map(fetchFrame))
        if (signal.aborted) return
        setStatus((previous) => ({
          ...previous,
          ready: true,
          loadedFraction: sequence.loaded.size / total,
        }))

        // Background fill. A few workers keep the network busy without
        // opening 100 parallel requests; each one re-reads the priority on
        // every pick, so a visitor who jumps to the end pulls the tail
        // frames forward immediately.
        const worker = async () => {
          while (!signal.aborted) {
            const index = takeNearest()
            if (index === null) return
            try {
              await fetchFrame(index)
              if (signal.aborted) return
              if (sequence.loaded.size % 10 === 0 || pending.size === 0) {
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
  }, [manifest, folder, variant, priorityRef])

  return { sequence, status }
}
