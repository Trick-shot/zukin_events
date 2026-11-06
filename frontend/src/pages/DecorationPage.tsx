import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { PageHeading } from '@/components/ui/PageHeading'
import { Photo } from '@/components/ui/Photo'
import { DECOR_PACKAGES } from '@/content/site'

/** /decoration — the three packages and how styling works (110:2049 / 110:2331). */
export function DecorationPage() {
  return (
    <>
      <PageHeading
        crumb="Decoration"
        title="Decoration by our own stylists."
        intro="No outside contractor to chase: the people who dress the hall work here. Pick a package when you book, then agree colours and flowers with your stylist."
      />

      <section aria-label="Decoration at Zukin Hall" className="bg-paper">
        <div className="grid grid-cols-2 gap-3 px-3 lg:grid-cols-3">
          <Photo
            src="venue/hall_ceiling.jpg"
            alt="Hanging flowers and chandeliers over the hall"
            width={1200}
            height={900}
            priority
            className="aspect-[4/3]"
          />
          <Photo
            src="venue/centrepiece.jpg"
            alt="A fresh flower centrepiece"
            width={1200}
            height={900}
            className="aspect-[4/3]"
          />
          <Photo
            src="venue/arch.jpg"
            alt="The white flower arch"
            width={1200}
            height={900}
            className="hidden aspect-[4/3] lg:block"
          />
        </div>
      </section>

      <section aria-labelledby="packages-heading" className="bg-paper py-20">
        <Container>
          <h2 id="packages-heading" className="text-3xl">
            Three packages. One team.
          </h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-3">
            {DECOR_PACKAGES.map((pkg, index) => (
              <article key={pkg.name} className="flex flex-col bg-paper p-7">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-2xl">{pkg.name}</h3>
                  {index === 2 ? (
                    <span className="rounded-xs bg-sand px-2 py-1 text-[11px] font-semibold text-gold-dark">
                      Most booked
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted">
                  From <span className="font-semibold text-ink">{pkg.priceFrom}</span>
                </p>
                <p className="mt-4 text-[15px] text-muted">{pkg.summary}</p>
                <ul className="mt-5 flex-1">
                  {pkg.includes.map((item) => (
                    <li key={item} className="hairline py-2.5 text-sm text-muted">
                      {item}
                    </li>
                  ))}
                  <li className="hairline" aria-hidden="true" />
                </ul>
              </article>
            ))}
          </div>
          <p className="mt-6 text-sm text-subtle">
            Package contents and prices are being finalised with the stylists — ask reception for
            this season's sheet.
          </p>
        </Container>
      </section>

      {/* How styling works: a true sequence. */}
      <section aria-labelledby="styling-heading" className="texture-kanga bg-sand py-20">
        <Container>
          <h2 id="styling-heading" className="max-w-xl text-3xl">
            From booking to the big day.
          </h2>
          <ol className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ['When you book', 'Pick Classic, Premium or Signature with your date.'],
                ['4 weeks before', 'Sit with your stylist: colours, flowers, layout.'],
                ['The day before', 'The team dresses the hall and walks you through it.'],
                ['After the event', 'We clear everything. You take the memories and the photos.'],
              ] as const
            ).map(([title, detail], index) => (
              <li key={title} className="border-t border-line pt-4">
                <span className="font-display text-lg text-gold-dark">{index + 1}</span>
                <h3 className="mt-2 font-sans text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted">{detail}</p>
              </li>
            ))}
          </ol>
          <Button as="link" to="/book" className="mt-12">
            Check your date
          </Button>
        </Container>
      </section>
    </>
  )
}
