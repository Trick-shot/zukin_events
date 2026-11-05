import { MapPin } from 'lucide-react'
import { Link } from 'react-router'

import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { CapacityRow } from '@/components/ui/CapacityRow'
import { KangaBand } from '@/components/ui/KangaBand'
import { Photo } from '@/components/ui/Photo'
import { BOOKING_STEPS, CONTACT, EVENT_TYPES, GALLERY_PREVIEW, SPACES } from '@/content/site'
import { HeroSection } from '@/features/hero/HeroSection'

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
      </section>

      {/* ---- Gallery band: full bleed, photography carries the colour. ---- */}
      <section id="gallery" aria-label="Photographs of the hall" className="bg-paper pb-24">
        <div className="grid grid-cols-2 gap-2 px-2 sm:gap-3 sm:px-3 lg:grid-cols-3">
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
        </div>
        <Container className="mt-5 flex items-baseline justify-between gap-6">
          <p className="text-sm text-muted">Every photo on this site was taken at Zukin Hall.</p>
          <Link to="/gallery" className="text-sm font-semibold text-ink underline-offset-4 hover:underline">
            View the full gallery
          </Link>
        </Container>
      </section>

      {/* ---- The spaces, on sand. ---- */}
      <section id="spaces" aria-labelledby="spaces-heading" className="bg-sand py-24">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 id="spaces-heading" className="text-3xl sm:text-4xl">
              Two rooms. Pick the one that fits your guest list.
            </h2>
            <Link to="/spaces" className="text-sm font-semibold text-ink underline-offset-4 hover:underline">
              Compare the spaces
            </Link>
          </div>

          <div className="mt-12 flex flex-col gap-16">
            {SPACES.map((space, index) => (
              <article
                key={space.slug}
                className={
                  'flex flex-col gap-8 lg:items-end ' +
                  (index % 2 ? 'lg:flex-row-reverse' : 'lg:flex-row')
                }
              >
                <Link
                  to={`/spaces/${space.slug}`}
                  className="block flex-[3] overflow-hidden rounded-card"
                  aria-label={`${space.name} — see details`}
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
              </article>
            ))}
          </div>
        </Container>
      </section>

      <KangaBand />

      {/* ---- What we host: list, not tiles. ---- */}
      <section id="events" aria-labelledby="events-heading" className="bg-paper py-24">
        <Container className="flex flex-col gap-14 lg:flex-row lg:gap-24">
          <div className="flex-1">
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
          </div>
          <div className="lg:w-[420px]">
            <Photo
              src="venue/aisle.jpg"
              alt="The white aisle, lit and lined with flowers"
              width={840}
              height={1040}
              className="aspect-[4/5] rounded-card"
            />
          </div>
        </Container>
      </section>

      {/* ---- Decoration: the first of two wine bands. ---- */}
      <section
        id="decoration"
        aria-labelledby="decoration-heading"
        className="on-dark bg-wine-900 py-24 text-on-dark"
      >
        <Container className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-20">
          <div className="lg:w-[520px]">
            <Photo
              src="venue/hall_ceiling.jpg"
              alt="Hanging flowers and chandeliers, dressed by the Zukin stylists"
              width={1040}
              height={970}
              className="aspect-[15/14] rounded-card"
            />
          </div>
          <div className="flex-1">
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
          </div>
        </Container>
      </section>

      {/* ---- One quote. Real one pending — visibly a placeholder. ---- */}
      <section aria-label="What a past client said" className="bg-paper py-28">
        <Container>
          <blockquote className="max-w-3xl">
            <p className="font-display text-2xl leading-relaxed text-ink sm:text-3xl">
              “[A short quote from a real past client, used with their permission. It names the
              event and one thing they loved.]”
            </p>
            <footer className="mt-5 text-sm text-subtle">
              [Client name], [event], [month year]
            </footer>
          </blockquote>
        </Container>
      </section>

      {/* ---- How booking works: a true sequence, so numbers are earned. ---- */}
      <section id="availability" aria-labelledby="booking-heading" className="bg-sand py-22">
        <Container>
          <h2 id="booking-heading" className="max-w-xl text-3xl sm:text-4xl">
            Booking is four steps. No account needed.
          </h2>
          <ol className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {BOOKING_STEPS.map((step, index) => (
              <li key={step.title} className="border-t border-line pt-4">
                <span className="font-display text-lg text-gold-dark">{index + 1}</span>
                <h3 className="mt-2 font-sans text-base font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{step.detail}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12 flex flex-wrap gap-4">
            <Button as="link" to="/book">
              Check your date
            </Button>
            <Button as="link" to="/track" variant="outline">
              Track my booking
            </Button>
          </div>
        </Container>
      </section>

      {/* ---- Find us. ---- */}
      <section id="location" aria-labelledby="location-heading" className="bg-paper py-24">
        <Container className="flex flex-col gap-12 lg:flex-row lg:gap-20">
          <div className="min-h-72 flex-[3] overflow-hidden rounded-card">
            {/* Swap for the Google Maps embed once the exact pin is confirmed. */}
            <a
              href={CONTACT.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex size-full min-h-72 flex-col items-center justify-center gap-3 bg-sand text-muted transition-colors hover:text-ink"
            >
              <MapPin size={28} aria-hidden="true" className="text-gold-dark" />
              <span className="text-sm font-medium">Open in Google Maps</span>
            </a>
          </div>
          <div className="flex-[2]">
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
          </div>
        </Container>
      </section>

      {/* ---- Closing CTA: the second wine band. ---- */}
      <section aria-labelledby="cta-heading" className="on-dark bg-wine-900 py-24 text-on-dark">
        <Container className="flex flex-col items-start gap-8">
          <h2 id="cta-heading" className="max-w-2xl text-3xl text-white sm:text-4xl">
            Come and see the hall.
          </h2>
          <p className="max-w-xl text-on-dark-muted">
            Free site visits Monday to Saturday — or check a date now, it takes a minute.
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
      </section>
    </>
  )
}
