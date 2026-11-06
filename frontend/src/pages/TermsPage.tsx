import { Container } from '@/components/layout/Container'
import { PageHeading } from '@/components/ui/PageHeading'

/**
 * /terms — booking terms, after Figma 94:1363 / 94:1481.
 *
 * DRAFT wording. The page says so out loud: these terms summarise how
 * booking works today and must be reviewed by the owner (and ideally a
 * lawyer) before launch. The numbered sections are a true sequence, so the
 * numbers are earned.
 */
const SECTIONS = [
  {
    title: 'Requesting a date',
    body: 'A booking request holds nothing by itself. Reception reviews every request and confirms by phone or SMS, normally within [24 hours]. A date is only held once reception marks it under review.',
  },
  {
    title: 'Deposit and the 7-day hold',
    body: 'When a request is approved, the date is held for 7 days. Paying the deposit of [00%] within those days confirms the booking. If the deposit does not arrive, the hold ends and the date becomes available again.',
  },
  {
    title: 'Paying the balance',
    body: 'The remaining balance is due [before the event; exact timing to be confirmed]. Payment details (bank and mobile money) are shared by reception with your booking reference.',
  },
  {
    title: 'Cancelling or moving a date',
    body: '[Cancellation and refund rules to be confirmed by the owner, including how much of the deposit is returned and how late a date can be moved.]',
  },
  {
    title: 'Decoration',
    body: 'Decoration packages are provided by the in-house styling team and agreed separately from the venue booking. Outside decorators are [allowed / not allowed, to be confirmed].',
  },
  {
    title: 'During the event',
    body: 'The hall is handed over dressed and tested. [House rules: sound limits, end times, catering arrangements. To be confirmed by the owner.]',
  },
  {
    title: 'Contact',
    body: 'Questions about these terms go to reception: [phone] or [email].',
  },
] as const

export function TermsPage() {
  return (
    <>
      <PageHeading
        crumb="Terms"
        title="Booking terms."
        intro="How booking, deposits and cancellations work at Zukin Hall."
      />

      <section aria-label="Draft notice" className="bg-paper">
        <Container>
          <p className="max-w-2xl rounded-sm bg-warning-bg px-4 py-3 text-sm text-warning">
            Draft: this wording summarises the current process and is awaiting the owner's (and a
            lawyer's) review. Bracketed items are unconfirmed.
          </p>
        </Container>
      </section>

      <section aria-label="Booking terms" className="bg-paper py-14 pb-28">
        <Container className="flex flex-col gap-12 lg:flex-row lg:gap-24">
          {/* On this page — a functional table of contents. */}
          <nav aria-label="On this page" className="top-28 self-start lg:sticky lg:w-60">
            <h2 className="eyebrow">On this page</h2>
            <ol className="mt-3 flex flex-col gap-2">
              {SECTIONS.map((section, index) => (
                <li key={section.title}>
                  <a
                    href={`#terms-${index + 1}`}
                    className="text-sm text-muted transition-colors hover:text-ink"
                  >
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <ol className="max-w-2xl flex-1">
            {SECTIONS.map((section, index) => (
              <li key={section.title} id={`terms-${index + 1}`} className="hairline py-7 first:pt-0">
                <h2 className="font-sans text-base font-semibold">
                  <span className="mr-3 font-display text-lg font-normal text-gold-dark">
                    {index + 1}
                  </span>
                  {section.title}
                </h2>
                <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{section.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    </>
  )
}
