import { Check, Phone } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'

import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { CalendarMark } from '@/components/ui/CalendarMark'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Field } from '@/components/ui/Field'
import { PageHeading } from '@/components/ui/PageHeading'
import { StepIndicator } from '@/components/ui/StepIndicator'
import { SuccessMark } from '@/components/ui/SuccessMark'
import { CONTACT, DECOR_PACKAGES, SPACES, type SpaceSlug } from '@/content/site'
import { checkDate, fromISODate, isPast, startOfToday, toISODate } from '@/lib/mockAvailability'
import { submitRequest } from '@/lib/mockBookings'
import { cn } from '@/lib/cn'

/**
 * /book — the booking request flow (Figma B1, B5, B2, B3, B4).
 *
 * One route, four screens, all state in this component: going back has to be
 * lossless (a visitor who corrects the guest count must not retype their
 * name), and a four-route version would need either a store or a pile of
 * query params to promise that. The step the visitor is on is deliberately
 * NOT in the URL — a refresh mid-flow would otherwise restore a half-filled
 * form from an empty state, which reads as data loss.
 *
 * Availability and submission come from the mock modules until the Django
 * endpoints exist; see docs/API_CONTRACT.md. The screen states are final.
 */

const STEPS = ['Date', 'Details', 'Review'] as const

/** Matches the hero widget's `eventType` values, so its hand-off prefills. */
const EVENT_TYPE_OPTIONS = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'send-off', label: 'Send-off' },
  { value: 'kitchen-party', label: 'Kitchen party' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'corporate', label: 'Corporate' },
] as const

const DECIDE_LATER = '__later__'

function isSpaceSlug(value: string | null): value is SpaceSlug {
  return value === 'main-hall' || value === 'second-space'
}

function formatDate(iso: string): string {
  return fromISODate(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function spaceName(slug: SpaceSlug): string {
  return SPACES.find((space) => space.slug === slug)?.name ?? slug
}

function eventTypeLabel(value: string): string {
  return EVENT_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value
}

export function BookPage() {
  const [params] = useSearchParams()

  // Step 1 — prefilled from the hero widget's query string where present.
  const [date, setDate] = useState(() => params.get('date') ?? '')
  const [space, setSpace] = useState<SpaceSlug>(() => {
    const fromQuery = params.get('space')
    return isSpaceSlug(fromQuery) ? fromQuery : 'main-hall'
  })
  const [eventType, setEventType] = useState(() => params.get('eventType') ?? 'wedding')
  const [guests, setGuests] = useState(() => params.get('guests') ?? '')

  // Step 2
  const [clientName, setClientName] = useState('')
  const [phone, setPhone] = useState('')
  const [decorPackage, setDecorPackage] = useState<string>(DECIDE_LATER)

  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [checking, setChecking] = useState(false)
  /** Set only when the chosen date is taken — this is screen B5. */
  const [unavailable, setUnavailable] = useState<string[] | null>(null)
  /** True once a check has come back free, so CalendarMark can play and rest. */
  const [dateConfirmedFree, setDateConfirmedFree] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendFailed, setSendFailed] = useState(false)
  const [reference, setReference] = useState<string | null>(null)

  // Computed once: calling new Date() during render makes the `min` attribute
  // unstable across re-renders, and the flow can outlive midnight anyway —
  // the server re-validates the date on submit regardless.
  const todayISO = useMemo(() => toISODate(startOfToday()), [])

  /* ---- Step 1: date and space (B1), or the taken-date screen (B5) ---- */
  const submitStepOne = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!date) next.date = 'Pick the date of your event.'
    else if (isPast(date)) next.date = 'That date has passed. Pick a future date.'
    const guestCount = Number(guests)
    if (!guests || Number.isNaN(guestCount) || guestCount < 1) {
      next.guests = 'Roughly how many guests are you expecting?'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setChecking(true)
    setUnavailable(null)
    try {
      const result = await checkDate(date, space)
      if (result.available) {
        setDateConfirmedFree(true)
        setStep(1)
      } else {
        setUnavailable(result.closestFreeDates)
      }
    } finally {
      setChecking(false)
    }
  }

  /** Choosing one of the offered dates continues — they are known free. */
  const takeOfferedDate = (offered: string) => {
    setDate(offered)
    setUnavailable(null)
    setStep(1)
  }

  /* ---- Step 2: your details (B2) ---- */
  const submitStepTwo = (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (clientName.trim().length < 2) next.clientName = 'Tell us the name for the booking.'
    // Same rule as /track, so a number that books can always be tracked.
    if (phone.replace(/\D/g, '').length < 9) next.phone = 'Enter a phone number we can call.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setStep(2)
  }

  /* ---- Step 3: review and send (B3) -> sent (B4) ---- */
  const send = async () => {
    setSending(true)
    setSendFailed(false)
    try {
      const result = await submitRequest({
        eventDate: date,
        space,
        eventType,
        guests: Number(guests),
        clientName: clientName.trim(),
        phone: phone.trim(),
        decorPackage: decorPackage === DECIDE_LATER ? null : decorPackage,
      })
      setReference(result.reference)
      setStep(3)
    } catch {
      setSendFailed(true)
    } finally {
      setSending(false)
    }
  }

  /* ---- B4: sent ---------------------------------------------------- */
  if (step === 3 && reference) {
    return (
      <>
        <PageHeading crumb="Book venue" title="Request sent." />
        <section aria-label="Request sent" className="bg-paper pb-28">
          <Container>
            <div className="max-w-xl rounded-card border border-line p-8">
              <SuccessMark kind="success" className="size-16" />
              {/* Revealed just after the check finishes drawing, so the two
                  read as one moment rather than racing each other. */}
              <div
                style={{ animationDelay: '300ms' }}
                className="motion-safe:animate-[rise-in_.45s_ease-out_both]"
              >
                <p className="mt-5 text-sm text-muted">Your booking reference</p>
                <p className="mt-1 font-display text-4xl text-ink sm:text-5xl">{reference}</p>
              </div>
              <p className="mt-6 text-[15px] text-muted">
                Reception reviews every request and replies within{' '}
                <span className="font-semibold text-ink">[24 hours]</span>. Keep this reference:
                it is how you check on the booking.
              </p>
              <p className="mt-3 text-[15px] text-muted">
                We have sent it to <span className="font-semibold text-ink">{phone}</span> by SMS.
                [SMS wording to confirm.]
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button as="link" to={`/track?phone=${encodeURIComponent(phone)}&ref=${reference}`}>
                  Track this booking
                </Button>
                <Button as="link" to="/" variant="outline">
                  Back to the home page
                </Button>
              </div>
            </div>
          </Container>
        </section>
      </>
    )
  }

  return (
    <>
      <PageHeading
        crumb="Book venue"
        title="Request your date."
        intro="Three steps, no account and no payment now. Reception confirms on the phone."
      />

      <section aria-label="Booking request" className="bg-paper pb-28">
        <Container>
          <StepIndicator
            steps={STEPS}
            current={step}
            onStepClick={(index) => {
              setErrors({})
              setUnavailable(null)
              setStep(index)
            }}
            className="mb-10"
          />

          {/* Keyed by step so each screen rises in exactly once. Nothing
              else on the page auto-animates. */}
          <div
            key={step}
            className="max-w-xl motion-safe:animate-[rise-in_.3s_ease-out_both]"
          >
            {/* ---- B1 / B5 ------------------------------------------ */}
            {step === 0 ? (
              <form onSubmit={submitStepOne} noValidate className="flex flex-col gap-5">
                <div className="flex items-end gap-3">
                  <Field
                    label="Event date"
                    type="date"
                    value={date}
                    min={todayISO}
                    error={errors.date}
                    className="flex-1"
                    onChange={(event) => {
                      setDate(event.target.value)
                      setUnavailable(null)
                      setDateConfirmedFree(false)
                    }}
                  />
                  {/* Loops while the date is being checked, then plays once
                      and rests when it comes back free. */}
                  {checking || dateConfirmedFree ? (
                    <CalendarMark busy={checking} className="mb-1 size-11 shrink-0" />
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-ink">Space</span>
                  <div className="flex flex-wrap gap-3">
                    {SPACES.map((option) => (
                      <button
                        key={option.slug}
                        type="button"
                        aria-pressed={space === option.slug}
                        onClick={() => {
                          setSpace(option.slug)
                          setUnavailable(null)
                        }}
                        className={cn(
                          'rounded-sm border px-4 py-3 text-left text-[15px]',
                          'transition-[background-color,border-color] duration-150',
                          'motion-safe:active:scale-[0.98]',
                          space === option.slug
                            ? 'border-red font-semibold text-ink'
                            : 'border-line text-muted hover:border-ink/40',
                        )}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="event-type" className="text-sm font-medium text-ink">
                    Event type
                  </label>
                  <select
                    id="event-type"
                    value={eventType}
                    onChange={(event) => setEventType(event.target.value)}
                    className="h-12 rounded-sm border border-line bg-paper px-3.5 text-[15px] text-ink focus:border-ink/40 focus:outline-none"
                  >
                    {EVENT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Field
                  label="Guests"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder="Number of guests"
                  value={guests}
                  error={errors.guests}
                  helper="An estimate is fine. It can change later."
                  onChange={(event) => setGuests(event.target.value)}
                />

                {/* B5 - the date is taken. EmptyState brings its own fade-in. */}
                {unavailable ? (
                  <div role="status">
                    <EmptyState
                      title={`${formatDate(date)} is already booked in the ${spaceName(space).toLowerCase()}.`}
                    >
                      {unavailable.length > 0 ? 'The closest free dates. Tap one to carry on:' : ''}
                    </EmptyState>
                    {unavailable.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2.5">
                        {unavailable.map((offered) => (
                          <button
                            key={offered}
                            type="button"
                            aria-pressed={date === offered}
                            onClick={() => takeOfferedDate(offered)}
                            className={cn(
                              'rounded-sm border bg-paper px-3.5 py-2.5 text-[14px] font-medium',
                              'transition-[background-color,border-color] duration-150',
                              'motion-safe:active:scale-[0.98]',
                              date === offered
                                ? 'border-red text-ink'
                                : 'border-line text-ink hover:border-ink/50 hover:bg-ink/5',
                            )}
                          >
                            {formatDate(offered)}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <p className="mt-4 text-sm text-muted">
                      Or try the{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setSpace(space === 'main-hall' ? 'second-space' : 'main-hall')
                          setUnavailable(null)
                        }}
                        className="font-medium text-ink underline underline-offset-4"
                      >
                        {spaceName(space === 'main-hall' ? 'second-space' : 'main-hall').toLowerCase()}
                      </button>{' '}
                      on the same day.
                    </p>
                  </div>
                ) : null}

                <div className="mt-2">
                  <Button type="submit" loading={checking}>
                    {checking ? 'Checking the date…' : 'Check this date'}
                  </Button>
                </div>
              </form>
            ) : null}

            {/* ---- B2 ----------------------------------------------- */}
            {step === 1 ? (
              <form onSubmit={submitStepTwo} noValidate className="flex flex-col gap-5">
                <Field
                  label="Your name"
                  value={clientName}
                  error={errors.clientName}
                  autoComplete="name"
                  onChange={(event) => setClientName(event.target.value)}
                />
                <Field
                  label="Phone number"
                  type="tel"
                  inputMode="tel"
                  placeholder="0712 345 678"
                  value={phone}
                  error={errors.phone}
                  helper="Reception calls this number, and it is how you track the booking."
                  autoComplete="tel"
                  onChange={(event) => setPhone(event.target.value)}
                />

                <fieldset className="flex flex-col gap-1.5">
                  <legend className="text-sm font-medium text-ink">
                    Decoration <span className="font-normal text-subtle">(optional)</span>
                  </legend>
                  <div className="mt-1 flex flex-col">
                    {[...DECOR_PACKAGES.map((pkg) => ({ value: pkg.name, label: pkg.name, summary: pkg.summary })),
                      { value: DECIDE_LATER, label: 'Decide later', summary: 'Agree a package with your stylist after reception calls.' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="hairline flex cursor-pointer items-start gap-3 py-3.5"
                      >
                        <input
                          type="radio"
                          name="decor"
                          value={option.value}
                          checked={decorPackage === option.value}
                          onChange={() => setDecorPackage(option.value)}
                          className="mt-1 accent-red"
                        />
                        <span>
                          <span className="text-[15px] font-medium text-ink">{option.label}</span>
                          <span className="block text-[13px] text-muted">{option.summary}</span>
                        </span>
                      </label>
                    ))}
                    <span className="hairline" aria-hidden="true" />
                  </div>
                </fieldset>

                <div className="mt-2 flex flex-wrap gap-3">
                  <Button type="submit">Review the request</Button>
                  <Button type="button" variant="outline" onClick={() => setStep(0)}>
                    Back
                  </Button>
                </div>
              </form>
            ) : null}

            {/* ---- B3 ----------------------------------------------- */}
            {step === 2 ? (
              <div className="flex flex-col gap-6">
                {sendFailed ? (
                  <ErrorBanner>
                    We could not send the request. Nothing is lost. Everything you typed is still
                    here, so try again.
                  </ErrorBanner>
                ) : null}

                <dl className="rounded-card border border-line">
                  {(
                    [
                      ['Date', formatDate(date)],
                      ['Space', spaceName(space)],
                      ['Event', eventTypeLabel(eventType)],
                      ['Guests', guests],
                      ['Name', clientName],
                      ['Phone', phone],
                      ['Decoration', decorPackage === DECIDE_LATER ? 'Decide later' : decorPackage],
                    ] as const
                  ).map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between gap-6 border-b border-line px-5 py-3.5 text-[15px] last:border-b-0"
                    >
                      <dt className="text-muted">{label}</dt>
                      <dd className="text-right font-medium text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="rounded-sm bg-sand px-5 py-5">
                  <h2 className="font-sans text-base font-semibold text-ink">What happens next</h2>
                  <ol className="mt-3 flex flex-col gap-2.5">
                    {[
                      'Reception reviews your request and calls you back within [24 hours].',
                      'If the date is free, it is held for 7 days for your deposit.',
                      'A [00%] deposit confirms the booking. Nothing is due now.',
                    ].map((line) => (
                      <li key={line} className="flex items-start gap-2.5 text-sm text-muted">
                        <Check
                          size={15}
                          aria-hidden="true"
                          className="mt-0.5 shrink-0 text-gold-dark"
                        />
                        {line}
                      </li>
                    ))}
                  </ol>
                </div>

                <p className="text-[13px] text-subtle">
                  Sending this request shares your name and phone number with Zukin Hall reception
                  so they can call you back. It is not a payment and does not hold the date yet.
                  See the <Link to="/terms" className="text-ink underline underline-offset-4">booking terms</Link>.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={send} loading={sending}>
                    {sending ? 'Sending…' : 'Send request'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={sending}
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <p className="mt-10 flex items-center gap-2 text-sm text-muted">
            <Phone size={15} aria-hidden="true" className="text-gold-dark" />
            Rather talk to someone? Call reception on {CONTACT.phone}.
          </p>
        </Container>
      </section>
    </>
  )
}
