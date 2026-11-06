import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { CapacityRow } from '@/components/ui/CapacityRow'
import { PageHeading } from '@/components/ui/PageHeading'
import { Photo } from '@/components/ui/Photo'
import { SPACES } from '@/content/site'

/** /spaces — both rooms in full, after Figma 110:1627 / 110:1844. */
export function SpacesPage() {
  return (
    <>
      <PageHeading
        crumb="Spaces"
        title="Two rooms. Pick the one that fits your guest list."
        intro="Both rooms come with tables, chairs, sound and lighting. Decoration is chosen separately, so you pay for the room once and dress it your way."
      />

      {SPACES.map((space, index) => (
        <section
          key={space.slug}
          aria-labelledby={`${space.slug}-heading`}
          className={index % 2 ? 'texture-kanga bg-sand py-20' : 'bg-paper pb-20'}
        >
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <h2 id={`${space.slug}-heading`} className="text-3xl">
                  {space.name}
                </h2>
                <p className="mt-2 text-muted">{space.strap}</p>
              </div>
              <p className="text-sm text-muted">
                From <span className="font-semibold text-ink">{space.priceFrom}</span> · venue only
              </p>
            </div>

            {/* Weighted pair, not equal tiles: one wide, one tall. The
                layout lives on wrapper divs (min-w-0 included) because an
                img's intrinsic width sets min-width:auto on a flex item and
                blows the row out sideways. */}
            <div className="mt-9 flex flex-col gap-4 lg:h-[560px] lg:flex-row">
              <div className="min-w-0 overflow-hidden rounded-card lg:h-full lg:w-[69%]">
                <Photo
                  src={space.photos.main}
                  alt={`${space.name}, set for an event`}
                  width={1800}
                  height={1120}
                  className="lg:h-full"
                />
              </div>
              <div className="hidden min-w-0 overflow-hidden rounded-card lg:block lg:h-full lg:flex-1">
                <Photo
                  src={space.photos.side}
                  alt={`A closer look inside the ${space.name.toLowerCase()}`}
                  width={790}
                  height={1120}
                  className="h-full"
                />
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-10 lg:flex-row lg:gap-24">
              <div className="max-w-xl flex-1">
                <p className="text-[15px] leading-relaxed text-muted">{space.description}</p>
                <div className="mt-8">
                  <CapacityRow capacity={space.capacity} />
                </div>
                <Button as="link" to={`/spaces/${space.slug}`} variant="outline" className="mt-9">
                  Details and included items
                </Button>
              </div>
              <div className="flex-1">
                <h3 className="font-sans text-sm font-semibold tracking-wide text-ink">
                  Included with the room
                </h3>
                <ul className="mt-3">
                  {space.included.map((item) => (
                    <li key={item} className="hairline py-2.5 text-[15px] text-muted">
                      {item}
                    </li>
                  ))}
                  <li className="hairline" aria-hidden="true" />
                </ul>
              </div>
            </div>
          </Container>
        </section>
      ))}

      <section aria-label="Visit the hall" className="bg-paper py-16">
        <Container className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl">Not sure which one? Walk through both.</h2>
            <p className="mt-2 text-sm text-muted">
              Free site visits Monday to Saturday, about 30 minutes.
            </p>
          </div>
          <Button as="link" to="/site-visit">
            Book a site visit
          </Button>
        </Container>
      </section>
    </>
  )
}
