import { useEffect, useRef } from 'react'

import {
  cameraScale,
  coverRect,
  frameFromProgress,
  lerpFrame,
  nearestLoadedFrame,
} from '@/features/hero/frameMath'
import type { FrameRange } from '@/features/hero/manifest'
import type { FrameSequence } from '@/features/hero/useFrameSequence'

const MAX_DPR = 2

export type HeroCanvasProps = {
  sequence: FrameSequence
  scrub: FrameRange
  progressRef: React.RefObject<number>
  /** Static mode for prefers-reduced-motion: draw frame 1 and stop. */
  still: boolean
  label: string
}

/**
 * The frame sequence, painted.
 *
 * One rAF loop owns all drawing. It reads scroll progress from a ref and the
 * decoded frames from a Map, so it never depends on a React render — which is
 * what lets the scrub hold 60fps while frames are still arriving.
 *
 * The loop idles: if the drawn frame already matches the target and nothing
 * has resized, it schedules the next tick without touching the canvas. A
 * motionless page therefore costs a comparison per frame, not a repaint.
 */
export function HeroCanvas({ sequence, scrub, progressRef, still, label }: HeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) return

    let raf = 0
    let currentFrame = scrub.from
    let lastDrawn = -1
    let lastWidth = 0
    let lastHeight = 0

    const resize = (): boolean => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const width = Math.round(canvas.clientWidth * dpr)
      const height = Math.round(canvas.clientHeight * dpr)
      if (width === lastWidth && height === lastHeight) return false
      if (width === 0 || height === 0) return false

      canvas.width = width
      canvas.height = height
      lastWidth = width
      lastHeight = height
      return true
    }

    const draw = (frame: number, progress: number) => {
      const index = nearestLoadedFrame(sequence.loaded, frame, scrub.to)
      if (index === null) return
      const image = sequence.images.get(index)
      if (!image) return

      const scale = still ? 1 : cameraScale(progress)
      const { dx, dy, dw, dh } = coverRect(
        canvas.width,
        canvas.height,
        image.naturalWidth,
        image.naturalHeight,
        scale,
      )

      context.drawImage(image, dx, dy, dw, dh)
      lastDrawn = index
    }

    const tick = () => {
      raf = window.requestAnimationFrame(tick)

      const resized = resize()
      const progress = still ? 0 : progressRef.current
      const target = still ? scrub.from : frameFromProgress(progress, scrub)

      // Lerp so a fast flick glides through frames instead of snapping.
      currentFrame = still ? scrub.from : lerpFrame(currentFrame, target)
      const rounded = Math.round(currentFrame)

      // Repaint only when something actually changed. `lastDrawn` tracks the
      // frame that reached the canvas, which may be a nearest-neighbour while
      // the real one is still downloading — so a late arrival still triggers
      // the redraw that replaces the stand-in.
      const settled = !resized && rounded === lastDrawn && sequence.loaded.has(rounded)
      if (settled && (still || Math.abs(target - currentFrame) < 0.01)) return

      draw(rounded, progress)
    }

    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [sequence, scrub, progressRef, still])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className="absolute inset-0 size-full bg-plum-deep"
    />
  )
}
