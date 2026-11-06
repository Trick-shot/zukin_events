import { Check } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router'

import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { CapacityRow } from '@/components/ui/CapacityRow'
import { PageHeading } from '@/components/ui/PageHeading'
import { Photo } from '@/components/ui/Photo'
import { SPACES } from '@/content/site'

/**
 * /spaces/:slug — one room in full, after Figma 92:425 / 92:669.
 * Mobile gets a sticky bottom booking bar so the CTA survives the long page.
 */
export function SpaceDetailPage() {
  const { slug } = useParams()
  const space = SPACES.find((candidate) => candidate.slug === slug)
  if (!space) return <Navigate to="/spaces" replace />

  const other = SPACES.find((candidate) => candidate.slug !== slug)

  return (
    <>
      <PageHeading crumb={space.name} title={space.strap} intro={space.description}>
        <div className="mt-8 flex flex-wrap items-end gap-x-14 gap-y-6">
          <CapacityRow capacity={space.capacity} />
          <p className="text-sm text-muted">
            From <span className="font-semibold text-ink">{space.priceFrom}</span> · venue only
          </p>
        </div>
      </PageHeading>

      <section aria-label={`Photographs of the ${space.name.toLowerCase()}`} className="bg-paper">
        {/* Layout on wrappers, not the imgs: an img's intrinsic width sets
            min-width:auto on a flex item and overflows the viewport. */}
        <div className="flex flex-col gap-3 px-3 lg:h-[560px] lg:flex-row">
          <div className="min-w-0 overflow-hidden lg:h-full lg:w-[69%]">
            <Photo
              src={space.photos.main}
              alt={`${space.name}, set for an event`}
              width={1800}
              height={1120}
              priority
              className="lg:h-full"
            />
          </div>
          <div className="hidden min-w-0 overflow-hidden lg:block lg:h-full lg:flex-1">
            <Photo
              src={space.photos.side}
              alt={`A closer look inside the ${space.name.toLowerCase()}`}
              width={790}
              height={1120}
              className="h-full"
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="included-heading" className="bg-paper py-20 pb-28">
        <Container className="flex flex-col gap-12 lg:flex-row lg:gap-24">
          <div className="flex-1">
            <h2 id="included-heading" className="text-2xl">
              Included with every booking
            </h2>
            <ul className="mt-6 max-w-lg">
              {space.included.map((item) => (
                <li key={item} className="hairline flex items-center gap-3 py-3 text-[15px] text-muted">
                  <Check size={16} aria-hidden="true" className="shrink-0 text-success" />
                  {item}
                </li>
              ))}
              <li className="hairline" aria-hidden="true" />
            </ul>
            <p className="mt-6 max-w-lg text-sm text-subtle">
              Decoration is chosen separately.{' '}
              <Link to="/decoration" className="font-medium text-ink underline-offset-4 hover:underline">
                See the three packages
              </Link>
              . A deposit holds your date for 7 days while you decide.
            </p>
          </div>

          <aside className="lg:w-[360px]">
            <div className="rounded-card border border-line bg-paper p-6 shadow-card">
              <h2 className="font-sans text-base font-semibold">Hold this room</h2>
              <p className="mt-2 text-sm text-muted">
                Check a date now. If it is free, your request goes straight to reception.
              </p>
              <Button as="link" to={`/book?space=${space.slug}`} className="mt-5 w-full">
                Check your date
              </Button>
              <Button as="link" to="/site-visit" variant="outline" className="mt-3 w-full">
                Book a site visit
              </Button>
            </div>
            {other ? (
              <p className="mt-5 text-sm text-muted">
                Different guest list?{' '}
                <Link
                  to={`/spaces/${other.slug}`}
                  className="font-medium text-ink underline-offset-4 hover:underline"
                >
                  See the {other.name.toLowerCase()}
                </Link>
                .
              </p>
            ) : null}
          </aside>
        </Container>
      </section>

      {/* Mobile sticky booking bar (Figma mobile frame). */}
      <div className="sticky bottom-0 z-40 border-t border-line bg-paper/95 p-3 backdrop-blur-sm lg:hidden">
        <Container className="flex items-center justify-between gap-4 px-0">
          <div className="pl-2">
            <p className="text-[13px] font-semibold">{space.name}</p>
            <p className="text-[12px] text-muted">From {space.priceFrom}</p>
          </div>
          <Button as="link" to={`/book?space=${space.slug}`}>
            Check your date
          </Button>
        </Container>
      </div>
    </>
  )
}
