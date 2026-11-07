import { useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'
import { Link } from 'react-router'

import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { CapacityRow } from '@/components/ui/CapacityRow'
import { KangaBand } from '@/components/ui/KangaBand'
import { Photo } from '@/components/ui/Photo'
import { Reveal } from '@/components/ui/Reveal'
import { RingsMotif } from '@/components/ui/RingsMotif'
import { BOOKING_STEPS, CONTACT, EVENT_TYPES, GALLERY_PREVIEW, SOCIAL, SPACES } from '@/content/site'
import { HeroSection } from '@/features/hero/HeroSection'

/**
 * A post tile that plays like a Reel: real event footage from the hall,
 * muted, looping, square. Plays only while on screen (IntersectionObserver)
 * and never under prefers-reduced-motion, where the poster frame stands in.
 * Each loop is ~200-330KB, together lighter than a single Instagram embed
 * iframe, and nothing here depends on Instagram staying reachable.
 */
function ReelTile({ src, poster, label }: { src: string; poster: string; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.35 },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <a
      href={SOCIAL.instagramUrl}
      target="_blank"
      rel="noreferrer"
      className="relative block overflow-hidden rounded-sm"
      aria-label={`${label}. Opens Instagram.`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        className="aspect-square size-full object-cover"
      />
      <span
        aria-hidden="true"
        className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-pill bg-white/90"
      >
        <svg viewBox="0 0 10 12" className="ml-0.5 size-2.5 fill-ink">
          <path d="M0 0l10 6-10 6Z" />
        </svg>
      </span>
    </a>
  )
}

/** Instagram glyph in the site's own stroke language, inheriting currentColor. */
function IgGlyph({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className={className}
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.4" />
      <circle cx="17.6" cy="6.4" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

/**
 * Line illustrations for the four booking steps, in the icon set's own
 * language (1.5px bronze strokes). Each encodes its step — calendar, sent
 * envelope, ringing phone, the rings — so they inform as much as decorate.
 */
const STEP_ICONS = [
  // Calendar with a check
  <svg key="s1" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-11">
    <rect x="6" y="9" width="32" height="29" rx="2.5" />
    <path d="M6 17h32M14 5v7M30 5v7" />
    <path d="M16 27l5 5 8-9" />
  </svg>,
  // Envelope, just sent
  <svg key="s2" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-11">
    <rect x="8" y="12" width="30" height="21" rx="2.5" />
    <path d="M8 14l15 11 15-11" />
    <path d="M2 20h4M1 26h5" />
  </svg>,
  // Phone, ringing
  <svg key="s3" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-11">
    <path d="M14 7c2 0 4 3 4 6 0 2-2 3-2 4 0 3 6 10 9 10 1.5 0 2-2 4-2 3 0 6 2 6 4s-3 6-6 6C19 35 8 23 8 13c0-3 4-6 6-6Z" />
    <path d="M27 9c4 1 7 4 8 8M29 3c6 2 10 6 12 12" />
  </svg>,
  // The rings
  <svg key="s4" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-11">
    <circle cx="17" cy="24" r="11" />
    <circle cx="27" cy="24" r="11" />
    <path d="M22 9l-3 4h6l-3-4Z" strokeLinejoin="round" />
  </svg>,
]

/**
 * The landing page, after Figma v3 (node 114:1540 desktop / 116:1282 mobile).
 *
 * Section rhythm is deliberately uneven — white, full-bleed photography,
 * sand, white, wine — so the page never settles into the
 * heading-paragraph-grid metre. The scroll-video hero from the hero-v2
 * pipeline stays as the opening; everything after it is the white v3 design.
 *
 * Copy in [brackets] is unconfirmed client data — see docs/UI_HANDOFF.md.
 */
export function LandingPage() {
  return (
    <>
      <HeroSection />

      {/* ---- Statement + facts. The caps labels are data labels. ---- */}
      <section aria-labelledby="statement-heading" className="bg-paper pt-24 pb-20 xl:pt-28">
        <Reveal>
          <Container>
          <h2 id="statement-heading" className="max-w-4xl text-3xl leading-snug sm:text-4xl">
            Guests arrive under a floral arch, walk a white aisle to the stage, and celebrate
            beneath chandeliers and hanging flowers.
          </h2>
          <dl className="mt-12 flex flex-wrap gap-x-14 gap-y-6">
            {(
              [
                ['Capacity', 'Up to [000] seated'],
                ['Spaces', 'Main hall · Second space'],
                ['Decoration', 'In-house stylists'],
                ['Parking', 'On site'],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="eyebrow">{label}</dt>
                <dd className="mt-1 text-[15px] font-medium text-ink">{value}</dd>
              </div>
            ))}
            </dl>
          </Container>
        </Reveal>
      </section>

      {/* ---- Gallery band: full bleed, photography carries the colour. ---- */}
      <section id="gallery" aria-label="Photographs of the hall" className="bg-paper pb-24">
        <Reveal className="grid grid-cols-2 gap-2 px-2 sm:gap-3 sm:px-3 lg:grid-cols-3">
          {GALLERY_PREVIEW.map((photo, i) => (
            <Photo
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              width={800}
              height={photo.tall ? 976 : 564}
              className={
                (photo.tall ? 'aspect-[4/5]' : 'aspect-[4/3] self-end') +
                (i > 3 ? ' hidden lg:block' : '')
              }
            />
          ))}
        </Reveal>
        <Reveal>
          <Container className="mt-5 flex items-baseline justify-between gap-6">
          <p className="text-sm text-muted">Every photo on this site was taken at Zukin Hall.</p>
          <Link to="/gallery" className="text-sm font-semibold text-ink underline-offset-4 hover:underline">
              View the full gallery
            </Link>
          </Container>
        </Reveal>
      </section>

      {/* ---- The spaces, on sand. ---- */}
      <section id="spaces" aria-labelledby="spaces-heading" className="texture-kanga bg-sand py-24">
        <Container>
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <h2 id="spaces-heading" className="text-3xl sm:text-4xl">
              Two rooms. Pick the one that fits your guest list.
            </h2>
            <Link to="/spaces" className="text-sm font-semibold text-ink underline-offset-4 hover:underline">
              Compare the spaces
            </Link>
          </Reveal>

          <div className="mt-12 flex flex-col gap-16">
            {SPACES.map((space, index) => (
              <Reveal
                as="article"
                delay={index}
                key={space.slug}
                className={
                  'flex flex-col gap-8 lg:items-end ' +
                  (index % 2 ? 'lg:flex-row-reverse' : 'lg:flex-row')
                }
              >
                <Link
                  to={`/spaces/${space.slug}`}
                  className="block flex-[3] overflow-hidden rounded-card"
                  aria-label={`${space.name}: see details`}
                >
                  <Photo
                    src={space.photos.main}
                    alt={`${space.name}: ${space.strap}`}
                    width={1200}
                    height={750}
                    className="aspect-[8/5] transition-transform duration-300 hover:scale-[1.02]"
                  />
                </Link>
                <div className="flex-[2] pb-2">
                  <h3 className="text-2xl">{space.name}</h3>
                  <p className="mt-2 max-w-md text-[15px] text-muted">{space.bestFor}</p>
                  <div className="mt-6">
                    <CapacityRow capacity={space.capacity} />
                  </div>
                  <p className="mt-6 text-sm text-muted">
                    From <span className="font-semibold text-ink">{space.priceFrom}</span> · venue only
                  </p>
                  <Button as="link" to={`/spaces/${space.slug}`} variant="outline" className="mt-6">
                    See the {space.name.toLowerCase()}
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <KangaBand />

      {/* ---- What we host: list, not tiles. ---- */}
      <section id="events" aria-labelledby="events-heading" className="bg-paper py-24">
        <Container className="flex flex-col gap-14 lg:flex-row lg:gap-24">
          <Reveal className="flex-1">
            <h2 id="events-heading" className="max-w-xl text-3xl sm:text-4xl">
              From the first dance to the company dinner.
            </h2>
            <ul className="mt-10">
              {EVENT_TYPES.map((event) => (
                <li
                  key={event.name}
                  className="hairline flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:gap-6"
                >
                  <h3 className="w-44 shrink-0 font-display text-xl">{event.name}</h3>
                  <p className="flex-1 text-[15px] text-muted">{event.detail}</p>
                  <span className="text-[13px] font-medium text-subtle">{event.format}</span>
                </li>
              ))}
              <li className="hairline" aria-hidden="true" />
            </ul>
          </Reveal>
          <Reveal delay={1} className="lg:w-[420px]">
            <Photo
              src="venue/aisle.jpg"
              alt="The white aisle, lit and lined with flowers"
              width={840}
              height={1040}
              className="aspect-[4/5] rounded-card"
            />
          </Reveal>
        </Container>
      </section>

      {/* ---- Decoration: the first of two wine bands. ---- */}
      <section
        id="decoration"
        aria-labelledby="decoration-heading"
        className="on-dark relative overflow-hidden bg-wine-900 py-24 text-on-dark"
      >
        <RingsMotif className="top-[-60px] right-[-120px] w-[560px]" />
        <Container className="relative flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-20">
          <Reveal className="lg:w-[520px]">
            <Photo
              src="venue/hall_ceiling.jpg"
              alt="Hanging flowers and chandeliers, dressed by the Zukin stylists"
              width={1040}
              height={970}
              className="aspect-[15/14] rounded-card"
            />
          </Reveal>
          <Reveal delay={1} className="flex-1">
            <h2 id="decoration-heading" className="text-3xl text-white sm:text-4xl">
              Decoration by our own stylists.
            </h2>
            <p className="mt-4 max-w-xl text-on-dark-muted">
              Choose Classic, Premium or Signature when you book. Your stylist agrees colours and
              flowers with you, then the team dresses the hall before guests arrive and clears it
              after.
            </p>
            <ul className="mt-8 max-w-xl">
              {(
                [
                  ['Classic', 'The hall dressed and ready'],
                  ['Premium', 'Fresh flowers and the lit aisle'],
                  ['Signature', 'The full look, styled around your colours'],
                ] as const
              ).map(([name, line]) => (
                <li
                  key={name}
                  className="flex items-baseline justify-between gap-6 border-t border-white/15 py-3.5"
                >
                  <span className="font-display text-lg text-white">{name}</span>
                  <span className="text-sm text-on-dark-muted">{line}</span>
                </li>
              ))}
            </ul>
            <Button as="link" to="/decoration" variant="outline-light" className="mt-9">
              See the packages
            </Button>
          </Reveal>
        </Container>
      </section>

      {/* ---- One quote. Real one pending — visibly a placeholder. ---- */}
      <section aria-label="What a past client said" className="relative overflow-hidden bg-paper py-28">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 left-2 font-display text-[22rem] leading-none text-sand select-none sm:left-8"
        >
          “
        </span>
        <Container className="relative">
          <Reveal as="blockquote" className="max-w-3xl">
            <p className="font-display text-2xl leading-relaxed text-ink sm:text-3xl">
              “[A short quote from a real past client, used with their permission. It names the
              event and one thing they loved.]”
            </p>
            <footer className="mt-5 text-sm text-subtle">
              [Client name], [event], [month year]
            </footer>
          </Reveal>
        </Container>
      </section>

      {/* ---- Zukin on Instagram: earned proof, straight from the live
             profile. Counts in content/site.ts; refresh before launch. ---- */}
      <section aria-labelledby="social-heading" className="bg-paper pb-28">
        <Container>
          <Reveal className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h2 id="social-heading" className="text-3xl sm:text-4xl">
                Their events, as they happen.
              </h2>
              <p className="mt-3 text-muted">
                Every event the Zukin team dresses ends up on Instagram before the weekend is
                over. These are their posts, playing as posted.
              </p>
              <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-4">
                {(
                  [
                    ['Followers', SOCIAL.followers],
                    ['Posts', SOCIAL.posts],
                    ['Instagram', SOCIAL.instagramHandle],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className="eyebrow">{label}</dt>
                    <dd className="mt-1 text-[15px] font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <Button
              as="a"
              href={SOCIAL.instagramUrl}
              target="_blank"
              rel="noreferrer"
              variant="outline"
              className="shrink-0"
            >
              <IgGlyph className="size-[18px]" />
              Follow on Instagram
            </Button>
          </Reveal>

          <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {(
              [
                ['sofa', 'The gold sofa staged in a sea of baby’s breath'],
                ['team', 'The Zukin crew presenting a finished hall'],
                ['ballroom', 'Wine drapery over a patterned dance floor'],
              ] as const
            ).map(([name, label], index) => (
              <Reveal key={name} delay={index}>
                <ReelTile
                  src={`/videos/social/${name}.mp4`}
                  poster={`/videos/social/${name}.jpg`}
                  label={label}
                />
              </Reveal>
            ))}
            <Reveal delay={3}>
              <a
                href={SOCIAL.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="on-dark flex aspect-square flex-col items-center justify-center gap-2.5 rounded-sm bg-wine-900 text-center transition-colors hover:bg-wine-800"
              >
                <IgGlyph className="size-7 text-white" />
                <span className="text-[15px] font-semibold text-white">More on Instagram</span>
                <span className="text-[13px] text-on-dark-muted">
                  {SOCIAL.followers} followers
                </span>
              </a>
            </Reveal>
          </div>

          <Reveal as="p" className="mt-5 text-sm text-muted">
            Real posts from real events. Tag {SOCIAL.instagramHandle} and the team reshares your
            photos.
          </Reveal>
        </Container>
      </section>

      {/* ---- How booking works: a true sequence, so numbers are earned. ---- */}
      <section id="availability" aria-labelledby="booking-heading" className="texture-kanga bg-sand py-22">
        <Container>
          <Reveal as="h2" id="booking-heading" className="max-w-xl text-3xl sm:text-4xl">
            Booking is four steps. No account needed.
          </Reveal>
          <ol className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {BOOKING_STEPS.map((step, index) => (
              <Reveal as="li" delay={index} key={step.title} className="border-t border-line pt-5">
                <div className="flex items-start justify-between gap-4 text-gold-dark">
                  {STEP_ICONS[index]}
                  <span className="font-display text-lg">{index + 1}</span>
                </div>
                <h3 className="mt-4 font-sans text-base font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{step.detail}</p>
              </Reveal>
            ))}
          </ol>
          <Reveal className="mt-12 flex flex-wrap gap-4">
            <Button as="link" to="/book">
              Check your date
            </Button>
            <Button as="link" to="/track" variant="outline">
              Track my booking
            </Button>
          </Reveal>
        </Container>
      </section>

      {/* ---- Find us. ---- */}
      <section id="location" aria-labelledby="location-heading" className="bg-paper py-24">
        <Container className="flex flex-col gap-12 lg:flex-row lg:gap-20">
          <Reveal className="flex-[3]">
            <div className="min-h-72 overflow-hidden rounded-card bg-sand">
              {/* Keyless Google embed; swap the query for the exact plot once
                  the owner confirms the pin. */}
              <iframe
                title="Zukin Hall on Google Maps"
                src="https://www.google.com/maps?q=Zukin+Hall,+Dodoma,+Tanzania&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-96 w-full border-0"
              />
            </div>
            <a
              href={CONTACT.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              <MapPin size={15} aria-hidden="true" className="text-gold-dark" />
              Open in Google Maps
            </a>
          </Reveal>
          <Reveal delay={1} className="flex-[2]">
            <h2 id="location-heading" className="text-3xl sm:text-4xl">
              Find us in Dodoma.
            </h2>
            <dl className="mt-8 max-w-md">
              {(
                [
                  ['Address', CONTACT.address],
                  ['Phone', CONTACT.phone],
                  ['WhatsApp', CONTACT.whatsapp],
                  ['Open', CONTACT.hours],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="hairline flex justify-between gap-6 py-3.5 text-[15px]">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right font-medium text-ink">{value}</dd>
                </div>
              ))}
              <div className="hairline" aria-hidden="true" />
            </dl>
            <Button as="link" to="/contact" variant="outline" className="mt-8">
              Contact and directions
            </Button>
          </Reveal>
        </Container>
      </section>

      {/* ---- Closing CTA: the second wine band. ---- */}
      <section
        aria-labelledby="cta-heading"
        className="on-dark relative overflow-hidden bg-wine-900 py-24 text-on-dark"
      >
        <RingsMotif className="bottom-[-120px] right-[-80px] w-[480px]" />
        <Reveal>
          <Container className="relative flex flex-col items-start gap-8">
          <h2 id="cta-heading" className="max-w-2xl text-3xl text-white sm:text-4xl">
            Come and see the hall.
          </h2>
          <p className="max-w-xl text-on-dark-muted">
            Free site visits Monday to Saturday. Or check a date now, it takes a minute.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button as="link" to="/site-visit">
              Book a site visit
            </Button>
            <Button as="link" to="/book" variant="outline-light">
              Check your date
            </Button>
            </div>
          </Container>
        </Reveal>
      </section>
    </>
  )
}
