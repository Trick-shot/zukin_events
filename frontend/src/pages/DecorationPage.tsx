import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { KangaBorder } from '@/components/ui/KangaBorder'
import { PageHeading } from '@/components/ui/PageHeading'
import { Photo } from '@/components/ui/Photo'
import { DECOR_PACKAGES, SOCIAL } from '@/content/site'
import { pageTitle, usePageMeta } from '@/hooks/usePageMeta'

/**
 * Real sets the team posted on @zukinevents.dar_dodoma, pulled 7 Nov 2026.
 * Each entry links to the actual post, so the photos stay verifiable proof
 * rather than stock-looking decoration. Files live in /images/instagram/.
 */
const INSTAGRAM_SETS = [
  { src: 'instagram/burgundy-ceiling.jpg', post: 'p/De9j73KC6BQ', alt: 'Burgundy ceiling drapery and twin chandeliers over a white aisle' },
  { src: 'instagram/gold-canopy.jpg', post: 'p/DepfEGvC32K', alt: 'A gold beaded canopy gathered over the chandelier' },
  { src: 'instagram/green-stage.jpg', post: 'p/De48Q_eCOdX', alt: 'A green and white set with garlands hanging over the stage' },
  { src: 'instagram/arch-lavender.jpg', post: 'p/DepE73IC0Cl', alt: 'White arches, greenery and lavender around the sofa stage' },
  { src: 'instagram/green-canopy.jpg', post: 'p/DemSFJWi3al', alt: 'A green ceiling canopy with purple drops and a chandelier' },
  { src: 'instagram/wine-drapery.jpg', post: 'p/DelJkMzC_uk', alt: 'Wine and white drapery with a drop of white flowers' },
  { src: 'instagram/chandelier-hearts.jpg', post: 'p/DeuahJIClVF', alt: 'A chandelier under greenery with lit hearts behind the stage' },
  { src: 'instagram/magenta-ballroom.jpg', post: 'reel/DfUo7-7NnP8', alt: 'Magenta drapery over a patterned dance floor' },
] as const

/**
 * One line illustration per package, each drawing what the package adds:
 * Classic = the drapery swag; Premium = a flower centrepiece; Signature =
 * the chandelier with hanging flowers. Same 1.5 stroke language as the
 * step icons.
 */
const PACKAGE_ICONS = [
  <svg key="classic" viewBox="0 0 56 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-12">
    <path d="M4 8h48" />
    <path d="M6 8c2 14 9 20 22 20S48 22 50 8" />
    <path d="M14 8c1 8 5 12 14 12s13-4 14-12" />
    <path d="M28 28v10M22 42h12" />
  </svg>,
  <svg key="premium" viewBox="0 0 56 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-12">
    <path d="M18 42c0-8 4-12 10-12s10 4 10 12" />
    <circle cx="28" cy="16" r="5" />
    <circle cx="18" cy="20" r="4.5" />
    <circle cx="38" cy="20" r="4.5" />
    <circle cx="23" cy="10" r="4" />
    <circle cx="33" cy="10" r="4" />
  </svg>,
  <svg key="signature" viewBox="0 0 56 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-12">
    <path d="M28 2v6" />
    <path d="M14 14a14 7 0 0 0 28 0" />
    <path d="M14 14h28" />
    <path d="M18 18v8M28 20v12M38 18v8" />
    <circle cx="18" cy="29" r="2.5" /><circle cx="28" cy="35" r="2.5" /><circle cx="38" cy="29" r="2.5" />
  </svg>,
]

/** /decoration — the three packages and how styling works (110:2049 / 110:2331). */
export function DecorationPage() {
  usePageMeta(pageTitle('Decoration'), 'Three decoration packages dressed by Zukin Hall stylists, with colours and flowers agreed with you before the day.')
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
          {/* Three cards, deliberately not identical: Signature (the most
              booked) is inverted in wine so the hierarchy is visible from
              across the room. Each card's illustration draws what the
              package adds. */}
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {DECOR_PACKAGES.map((pkg, index) => {
              const signature = index === 2
              return (
                <article
                  key={pkg.name}
                  className={
                    signature
                      ? 'on-dark relative flex flex-col overflow-hidden rounded-card bg-wine-900 p-7 text-on-dark'
                      : 'flex flex-col rounded-card border border-line bg-paper p-7 shadow-card'
                  }
                >
                  {signature ? (
                    <span className="absolute top-5 right-5 rounded-xs bg-gold/20 px-2 py-1 text-[11px] font-semibold tracking-wide text-gold">
                      Most booked
                    </span>
                  ) : null}
                  <div className={signature ? 'text-gold' : 'text-gold-dark'}>
                    {PACKAGE_ICONS[index]}
                  </div>
                  <h3 className={'mt-4 font-display text-2xl ' + (signature ? 'text-white' : '')}>
                    {pkg.name}
                  </h3>
                  <p className={'mt-1 text-sm ' + (signature ? 'text-on-dark-muted' : 'text-muted')}>
                    From{' '}
                    <span className={'font-semibold ' + (signature ? 'text-white' : 'text-ink')}>
                      {pkg.priceFrom}
                    </span>
                  </p>
                  <p className={'mt-4 text-[15px] ' + (signature ? 'text-on-dark-muted' : 'text-muted')}>
                    {pkg.summary}
                  </p>
                  <ul className="mt-5 flex-1">
                    {pkg.includes.map((item) => (
                      <li
                        key={item}
                        className={
                          'border-t py-2.5 text-sm ' +
                          (signature
                            ? 'border-white/15 text-on-dark-muted'
                            : 'border-line text-muted')
                        }
                      >
                        {item}
                      </li>
                    ))}
                    <li
                      className={'border-t ' + (signature ? 'border-white/15' : 'border-line')}
                      aria-hidden="true"
                    />
                  </ul>
                  <Button
                    as="link"
                    to="/book"
                    variant={signature ? 'outline-light' : 'outline'}
                    className="mt-6 self-start"
                  >
                    Book with {pkg.name}
                  </Button>
                </article>
              )
            })}
          </div>
          <p className="mt-6 text-sm text-subtle">
            Package contents and prices are being finalised with the stylists. Ask reception for
            this season's sheet.
          </p>
        </Container>
      </section>

      {/* Recent sets from the team's Instagram, each linked to its post. */}
      <section aria-labelledby="ig-sets-heading" className="bg-paper pb-20">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="ig-sets-heading" className="max-w-xl text-3xl">
                Straight from their feed.
              </h2>
              <p className="mt-3 max-w-lg text-[15px] text-muted">
                Every look here is a real set the team built and posted. Tap a photo to open
                the post on Instagram.
              </p>
            </div>
            <Button
              as="a"
              href={SOCIAL.instagramUrl}
              target="_blank"
              rel="noreferrer"
              variant="outline"
              className="shrink-0"
            >
              See all {SOCIAL.posts} posts
            </Button>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {INSTAGRAM_SETS.map((item) => (
              <a
                key={item.src}
                href={`https://www.instagram.com/${item.post}/`}
                target="_blank"
                rel="noreferrer"
                className="group block overflow-hidden rounded-sm"
              >
                <Photo
                  src={item.src}
                  alt={item.alt}
                  width={900}
                  height={1200}
                  className="aspect-[3/4] transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </a>
            ))}
          </div>
        </Container>
      </section>

      {/* How styling works: a true sequence, under the kanga border. */}
      <section aria-labelledby="styling-heading" className="texture-kanga bg-sand pb-20">
        <KangaBorder className="mb-16" />
        <Container>
          <h2 id="styling-heading" className="max-w-xl text-3xl">
            From booking to the big day.
          </h2>
          <ol className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ['When you book', 'Pick Classic, Premium or Signature with your date.',
                  <svg key="i1" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-10">
                    <path d="M8 16l14-9 14 9v20H8Z" /><path d="M8 16l14 9 14-9M22 25v11" />
                  </svg>],
                ['4 weeks before', 'Sit with your stylist: colours, flowers, layout.',
                  <svg key="i2" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-10">
                    <path d="M6 8h22v14H14l-8 7Z" /><path d="M20 26v4h12l6 6V18h-8" />
                  </svg>],
                ['The day before', 'The team dresses the hall and walks you through it.',
                  <svg key="i3" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-10">
                    <path d="M4 10h36" /><path d="M6 10c2 10 7 15 16 15s14-5 16-15" /><path d="M12 10c1 6 4 9 10 9s9-3 10-9" /><path d="M22 25v9M17 38h10" />
                  </svg>],
                ['After the event', 'We clear everything. You take the memories and the photos.',
                  <svg key="i4" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-10">
                    <rect x="7" y="13" width="30" height="22" rx="2.5" /><circle cx="22" cy="24" r="6" /><path d="M16 13l3-5h10l3 5" />
                  </svg>],
              ] as const
            ).map(([title, detail, icon], index) => (
              <li key={title} className="border-t border-line pt-5">
                <div className="flex items-start justify-between gap-4 text-gold-dark">
                  {icon}
                  <span className="font-display text-lg">{index + 1}</span>
                </div>
                <h3 className="mt-3 font-sans text-base font-semibold">{title}</h3>
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
