import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { BookingBar } from '@/features/booking-bar/BookingBar'
import { HeroCanvas, type HeroIntroState } from '@/features/hero/HeroCanvas'
import {
  bookingBarReveal,
  captionOpacity,
  clamp01,
  frameFromProgress,
} from '@/features/hero/frameMath'
import { loadManifest, type HeroManifest } from '@/features/hero/manifest'
import { useFrameSequence } from '@/features/hero/useFrameSequence'
import { useHeroScroll } from '@/features/hero/useHeroScroll'
import { useSequenceVariant } from '@/features/hero/useSequenceVariant'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Container } from '@/components/layout/Container'

/**
 * How tall the pinned section is, as a multiple of the viewport. Sized for
 * the scrub range alone (the intro plays itself and consumes no scroll):
 * 79 scrubbed frames across 360vh is ~26px of scroll per frame at an 800px
 * viewport — smooth without feeling like the page has stopped responding.
 */
const PIN_VH = 360

/** Title-film playback rate. The source was sampled at 3fps; 10fps reads as
 * deliberate slow cinema rather than a stutter, and finishes in ~2.5s. */
const INTRO_FPS = 10

/**
 * Estimate the frame under the restored scroll position before any layout
 * has been measured. The hero is the first element on the page, so its top
 * is 0 and the geometry is fully known from the viewport alone. This seeds
 * the frame loader's priority so a mid-page reload downloads the frames the
 * visitor is actually standing on first.
 */
function estimateInitialFrame(manifest: HeroManifest | null): number {
  if (!manifest) return 1
  if (typeof window === 'undefined') return manifest.scrub.from
  const viewport = window.innerHeight
  const scrollable = (PIN_VH / 100) * viewport - viewport
  if (scrollable <= 0) return manifest.scrub.from
  const progress = clamp01(window.scrollY / scrollable)
  return frameFromProgress(progress, manifest.scrub)
}

export function HeroSection() {
  const { t } = useTranslation()
  const sectionRef = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()

  const [manifest, setManifest] = useState<HeroManifest | null>(null)
  const [manifestError, setManifestError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    loadManifest(controller.signal)
      .then(setManifest)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setManifestError(error instanceof Error ? error.message : 'Hero manifest failed to load')
      })
    return () => controller.abort()
  }, [])

  // Which frame the visitor is on, for the loader's download priority.
  // Updated by the intro clock and by every scroll; read by the loader's
  // workers on each pick.
  const priorityRef = useRef(1)

  const { folder, variant } = useSequenceVariant(manifest)
  const { sequence, status } = useFrameSequence(manifest, folder, variant, priorityRef)

  // Pinning is off under prefers-reduced-motion, and also if the sequence
  // cannot load at all — a 360vh section of nothing would be a scroll trap.
  const broken = manifestError !== null || status.error !== null
  const pinned = !reducedMotion && !broken
  const { progressRef, progress } = useHeroScroll(sectionRef, pinned)

  const scrub = manifest?.scrub ?? { from: 1, to: 1 }

  // ---- Intro title film ----------------------------------------------------
  // Frames intro.from..intro.to play themselves once, before scroll takes
  // over. The intro is skipped outright when the page was reloaded mid-scroll
  // (the visitor has already seen it and is standing elsewhere) and under
  // reduced motion; scrolling during playback ends it immediately — a scroll
  // is a statement of intent, not something to fight.
  const introRef = useRef<HeroIntroState>({ active: false, frame: 1 })
  const [introDone, setIntroDone] = useState(false)
  const [introFrame, setIntroFrame] = useState(1)

  useEffect(() => {
    if (!manifest) return
    priorityRef.current = estimateInitialFrame(manifest)

    const intro = manifest.intro
    if (!intro || !pinned || window.scrollY > window.innerHeight / 2) {
      // oxlint-disable-next-line react/set-state-in-effect
      setIntroDone(true)
      return
    }

    introRef.current = { active: true, frame: intro.from }
    priorityRef.current = intro.from
    // oxlint-disable-next-line react/set-state-in-effect
    setIntroFrame(intro.from)

    let raf = 0
    let last = performance.now()

    const finish = () => {
      introRef.current = { active: false, frame: intro.to }
      setIntroDone(true)
      cleanup()
    }

    const tick = (now: number) => {
      raf = window.requestAnimationFrame(tick)
      if (now - last < 1000 / INTRO_FPS) return
      const next = introRef.current.frame + 1
      // Hold on the current frame until the next one has decoded — the
      // priority loader is fetching exactly this neighbourhood, so a pause
      // here is a beat, not a stall.
      if (!sequence.loaded.has(next)) return
      last = now
      introRef.current = { active: true, frame: next }
      priorityRef.current = next
      setIntroFrame(next)
      if (next >= intro.to) finish()
    }

    const onScroll = () => {
      if (window.scrollY > 8) finish()
    }

    const cleanup = () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    raf = window.requestAnimationFrame(tick)
    return cleanup
  }, [manifest, pinned, sequence])

  const introActive = pinned && !introDone && manifest?.intro !== undefined

  // Scroll keeps the loader pointed at the visitor's frame once the intro is
  // over (and harmlessly during it; the intro writes afterwards each tick).
  useEffect(() => {
    if (!introActive) priorityRef.current = frameFromProgress(progress, scrub)
  }, [progress, scrub, introActive])

  const frame = !pinned
    ? scrub.from
    : introActive
      ? introFrame
      : frameFromProgress(progress, scrub)
  const reveal = pinned ? (introActive ? 0 : bookingBarReveal(progress)) : 1

  return (
    <section
      id="hero"
      ref={sectionRef}
      aria-labelledby="hero-heading"
      className="relative isolate on-dark bg-wine-900 text-white"
      style={pinned ? { height: `${PIN_VH}vh` } : undefined}
    >
      {/* The sticky stage. Under reduced motion it becomes a normal 100vh
          block: no pinning, no scrubbing, every caption visible at once. */}
      <div
        className={
          pinned
            ? 'sticky top-0 h-dvh w-full overflow-hidden'
            : 'relative min-h-dvh w-full overflow-hidden'
        }
      >
        {manifest && (
          <HeroCanvas
            sequence={sequence}
            scrub={scrub}
            progressRef={progressRef}
            introRef={introRef}
            still={!pinned}
            label={t('hero.canvasLabel')}
          />
        )}

        {/* Three scrims, because the frames are real photography and some of
            them are very bright (the lit hall is near-white pink). Contrast
            for the overlay text cannot rely on the frame being dark:
              - vignette, for the camera feel;
              - bottom, carrying the venue name and the booking bar;
              - left, carrying the captions. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(20,7,15,0.55)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(20,7,15,0.9),transparent)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(to_right,rgba(20,7,15,0.72),rgba(20,7,15,0.35)_38%,transparent_65%)]"
        />

        <div className="relative flex h-dvh flex-col justify-between py-28">
          {/* Captions. Real text, stacked and cross-faded, so a screen reader
              and a text search see the whole story, not a canvas. */}
          <Container className="flex flex-1 items-center">
            <h1 id="hero-heading" className="sr-only">
              {t('hero.heading')}
            </h1>

            {pinned ? (
              <div className="relative h-[8rem] w-full sm:h-[10rem]" aria-live="polite">
                {manifest?.beats.map((beat) => {
                  const opacity = captionOpacity(beat, frame)
                  if (opacity === 0) return null
                  return (
                    <p
                      key={`${beat.from}-${beat.caption}`}
                      style={{
                        opacity,
                        transform: `translateY(${(1 - opacity) * 18}px)`,
                      }}
                      className="absolute inset-x-0 top-0 font-display text-5xl leading-tight [text-shadow:0_2px_24px_rgba(20,7,15,0.55)] sm:text-6xl xl:text-7xl"
                    >
                      {beat.caption}
                    </p>
                  )
                })}
              </div>
            ) : (
              // Reduced motion: the same copy, all at once, as a plain list.
              <ol className="flex flex-col gap-2">
                {manifest?.beats.map((beat) => (
                  <li
                    key={`${beat.from}-${beat.caption}`}
                    className="font-display text-3xl leading-tight sm:text-4xl"
                  >
                    {beat.caption}
                  </li>
                ))}
              </ol>
            )}
          </Container>

          <Container>
            <div className="flex flex-col gap-8">
              {/* The venue name stays bottom-left for the whole sequence. */}
              <div>
                <p className="text-sm text-on-dark-muted">{t('hero.eyebrow')}</p>
                <p className="mt-1.5 font-display text-2xl">{t('brand.name')}</p>
              </div>

              <div
                style={
                  pinned
                    ? {
                        opacity: reveal,
                        transform: `translateY(${(1 - reveal) * 40}px)`,
                        pointerEvents: reveal < 0.5 ? 'none' : undefined,
                      }
                    : undefined
                }
                // aria-hidden while it is still rising, so a screen reader is
                // not offered a form the sighted visitor cannot see yet. The
                // "Skip to booking" link jumps here and scrolls it into view.
                aria-hidden={pinned && reveal < 0.5}
              >
                <BookingBar />
              </div>
            </div>
          </Container>
        </div>

        {/* Thin scroll progress cue. Hidden while the title film plays — the
            page is not asking to be scrolled yet. */}
        {pinned && !introActive && (
          <div
            aria-hidden="true"
            className="absolute top-1/2 right-6 hidden h-24 w-px -translate-y-1/2 bg-white/25 lg:block"
          >
            <div
              className="w-px bg-white origin-top"
              style={{ height: `${Math.round(progress * 100)}%` }}
            />
          </div>
        )}

        {/* Loading and failure states. Both are quiet: the poster is already
            painted underneath, so this is a hint, not a blocker. */}
        {!status.posterReady && !broken && (
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-on-dark-faint">
            {t('hero.loading')}
          </p>
        )}
        {broken && (
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-on-dark-faint">
            {t('hero.unavailable')}
          </p>
        )}
      </div>
    </section>
  )
}
