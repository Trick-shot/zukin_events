import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { BookingBar } from '@/features/booking-bar/BookingBar'
import { HeroCanvas } from '@/features/hero/HeroCanvas'
import {
  bookingBarReveal,
  captionOpacity,
  frameFromProgress,
} from '@/features/hero/frameMath'
import { loadManifest, type HeroManifest } from '@/features/hero/manifest'
import { useFrameSequence } from '@/features/hero/useFrameSequence'
import { useHeroScroll } from '@/features/hero/useHeroScroll'
import { useSequenceVariant } from '@/features/hero/useSequenceVariant'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Container } from '@/components/layout/Container'

/**
 * How tall the pinned section is, as a multiple of the viewport. The brief
 * asks for 400-500vh; 450 sits in the middle and gives 165 frames roughly
 * 21px of scroll each at an 800px viewport, which scrubs smoothly without
 * feeling like the page has stopped responding.
 */
const PIN_VH = 450

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

  const { folder, variant } = useSequenceVariant(manifest)
  const { sequence, status } = useFrameSequence(manifest, folder, variant)

  // Pinning is off under prefers-reduced-motion, and also if the sequence
  // cannot load at all — a 450vh section of nothing would be a scroll trap.
  const broken = manifestError !== null || status.error !== null
  const pinned = !reducedMotion && !broken
  const { progressRef, progress } = useHeroScroll(sectionRef, pinned)

  const scrub = manifest?.scrub ?? { from: 1, to: 1 }
  const frame = pinned ? frameFromProgress(progress, scrub) : scrub.from
  const reveal = pinned ? bookingBarReveal(progress) : 1

  return (
    <section
      id="hero"
      ref={sectionRef}
      aria-labelledby="hero-heading"
      className="relative isolate on-dark bg-plum-deep text-white"
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
            still={!pinned}
            label={t('hero.canvasLabel')}
          />
        )}

        {/* Three scrims, because the frames are real photography and some of
            them are very bright (the lit hall is near-white pink). Contrast
            for the overlay text cannot rely on the frame being dark:
              - vignette, for the camera feel;
              - bottom, carrying the venue name and the booking bar;
              - left, carrying the captions.
            Without the left one, "The hall" is unreadable over frame 95. */}
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
                <p className="eyebrow">{t('hero.eyebrow')}</p>
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

        {/* Thin scroll progress cue, replacing the design's static SCROLL
            mark now that the hero is a timeline. */}
        {pinned && (
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
