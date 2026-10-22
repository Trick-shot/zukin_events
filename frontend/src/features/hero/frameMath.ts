import { HERO_SEQUENCE_BASE, type FrameRange, type HeroBeat } from '@/features/hero/manifest'

/**
 * Pure maths for the pinned hero.
 *
 * Everything here is deliberately free of DOM, React and timing so the
 * scroll-to-frame mapping can be tested directly — it is the one piece of the
 * hero where an off-by-one is invisible on screen but wrong (a frame that
 * never renders, or a caption that leaks one frame past its beat).
 */

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

export type ScrollGeometry = {
  /** window.scrollY */
  scrollY: number
  /** Distance from the top of the document to the top of the pinned section. */
  sectionTop: number
  /** Full height of the tall section, e.g. 450vh in pixels. */
  sectionHeight: number
  /** Height of the sticky stage, i.e. the viewport. */
  viewportHeight: number
}

/**
 * Scroll position -> 0..1 across the pinned section.
 *
 * The usable scroll distance is the section height minus one viewport, because
 * the sticky stage stops moving once its bottom reaches the section's bottom.
 * Using the full section height instead would end the sequence a viewport
 * early and leave the last frames unreachable.
 */
export function progressFromScroll({
  scrollY,
  sectionTop,
  sectionHeight,
  viewportHeight,
}: ScrollGeometry): number {
  const scrollable = sectionHeight - viewportHeight
  if (scrollable <= 0) return 0
  return clamp01((scrollY - sectionTop) / scrollable)
}

/**
 * 0..1 -> a frame index inside the manifest's scrub range.
 *
 * Progress 0 lands on `range.from` and progress 1 on `range.to`, so the span
 * is `to - from`. Rounding (not flooring) keeps the midpoint of each frame's
 * scroll range aligned with the frame itself.
 *
 * Taking a range rather than a count is what lets a clip carry unusable
 * handles — a fade-out, a slate — without the hero playing them.
 */
export function frameFromProgress(progress: number, range: FrameRange): number {
  const span = range.to - range.from
  if (span <= 0) return range.from
  return range.from + Math.round(clamp01(progress) * span)
}

/** Inverse of frameFromProgress, used to place beat boundaries on the track. */
export function progressFromFrame(frame: number, range: FrameRange): number {
  const span = range.to - range.from
  if (span <= 0) return 0
  return clamp01((frame - range.from) / span)
}

/**
 * Expand a printf-style pattern such as "f_%04d.webp" for one frame.
 * Only the zero-padded integer form is supported, which is all the manifest
 * uses; anything else is left untouched so a bad pattern is visible as a 404
 * rather than a silently wrong path.
 */
export function expandPattern(pattern: string, index: number): string {
  return pattern.replace(/%0(\d+)d/g, (_match, width: string) =>
    String(index).padStart(Number(width), '0'),
  )
}

export function framePath(pattern: string, folder: string, index: number): string {
  return `${HERO_SEQUENCE_BASE}/${folder}/${expandPattern(pattern, index)}`
}

/** The beat covering this frame, or null in a gap between beats. */
export function beatAtFrame(beats: readonly HeroBeat[], frame: number): HeroBeat | null {
  for (const beat of beats) {
    if (frame >= beat.from && frame <= beat.to) return beat
  }
  return null
}

/**
 * How far through its own range a beat is, 0..1.
 * Drives the caption's fade-in at the start and fade-out at the end, so a
 * caption is never cut off mid-word by a hard frame boundary.
 */
export function beatProgress(beat: HeroBeat, frame: number): number {
  const span = beat.to - beat.from
  if (span <= 0) return 1
  return clamp01((frame - beat.from) / span)
}

/**
 * Caption opacity: ramp up over the first `edge` of the beat, hold, ramp down
 * over the last `edge`.
 */
export function captionOpacity(beat: HeroBeat, frame: number, edge = 0.18): number {
  if (frame < beat.from || frame > beat.to) return 0
  // A degenerate (single-frame) beat has nowhere to ramp, so it is simply
  // visible while it is on screen rather than stuck at the end of its fade-out.
  if (beat.to <= beat.from) return 1
  const progress = beatProgress(beat, frame)
  if (edge <= 0) return 1
  if (progress < edge) return clamp01(progress / edge)
  if (progress > 1 - edge) return clamp01((1 - progress) / edge)
  return 1
}

/** Slow push-in on top of the frames: 1.00 -> 1.06 across the whole sequence. */
export function cameraScale(progress: number, from = 1, to = 1.06): number {
  return from + (to - from) * clamp01(progress)
}

/**
 * The booking bar rises over the tail of the sequence. Returns 0..1, where 1
 * is fully risen, so the caller can drive both opacity and translateY from one
 * number.
 */
export function bookingBarReveal(progress: number, start = 0.82, end = 0.95): number {
  if (end <= start) return progress >= end ? 1 : 0
  return clamp01((progress - start) / (end - start))
}

/**
 * Cover-fit: the destination rect for drawImage so the frame fills the canvas
 * without distortion, centred, optionally over-scaled for the camera push.
 */
export function coverRect(
  canvasWidth: number,
  canvasHeight: number,
  imageWidth: number,
  imageHeight: number,
  scale = 1,
): { dx: number; dy: number; dw: number; dh: number } {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return { dx: 0, dy: 0, dw: canvasWidth, dh: canvasHeight }
  }

  const cover = Math.max(canvasWidth / imageWidth, canvasHeight / imageHeight) * scale
  const dw = imageWidth * cover
  const dh = imageHeight * cover

  return { dx: (canvasWidth - dw) / 2, dy: (canvasHeight - dh) / 2, dw, dh }
}

/**
 * The closest frame that has actually decoded, searching outward from the
 * target. While the tail of the sequence is still downloading this is what
 * keeps the canvas showing a real frame instead of flashing empty — it holds
 * the nearest neighbour until the right frame lands.
 */
export function nearestLoadedFrame(
  loaded: ReadonlySet<number>,
  target: number,
  frameCount: number,
): number | null {
  if (loaded.has(target)) return target

  for (let offset = 1; offset < frameCount; offset += 1) {
    const before = target - offset
    if (before >= 1 && loaded.has(before)) return before
    const after = target + offset
    if (after <= frameCount && loaded.has(after)) return after
  }

  return null
}

/**
 * One lerp step toward the target frame.
 *
 * Without this the canvas snaps between frames on a fast flick; with it the
 * drawn frame chases the scroll position and glides. Snaps to the target once
 * within half a frame so it never asymptotically hovers off-by-one.
 */
export function lerpFrame(current: number, target: number, factor = 0.18): number {
  const next = current + (target - current) * factor
  return Math.abs(target - next) < 0.5 ? target : next
}
