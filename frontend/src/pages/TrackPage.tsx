import { Phone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router'

import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Field } from '@/components/ui/Field'
import { PageHeading } from '@/components/ui/PageHeading'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SuccessMark } from '@/components/ui/SuccessMark'
import { CONTACT } from '@/content/site'
import { trackBooking, type Booking, type BookingStatus } from '@/lib/mockBookings'

/**
 * /track — B6 lookup + B7 status (Figma 97:748 / 97:924), no account: the
 * phone number used to book plus the reference from the confirmation SMS
 * are the credentials. Data comes from the mock module until the Django
 * endpoint exists; the screen states (idle, loading, no match, each
 * lifecycle status) are final.
 */

/** The lifecycle as the client sees it; terminal failures render separately. */
const JOURNEY: Array<{ status: BookingStatus; label: string; detail: string }> = [
  { status: 'requested', label: 'Request received', detail: 'Your request reached reception.' },
  { status: 'under_review', label: 'Under review', detail: 'Reception checks the date and calls you back.' },
  { status: 'deposit_due', label: 'Deposit', detail: 'The date is held 7 days for your deposit.' },
  { status: 'confirmed', label: 'Confirmed', detail: 'The date is yours.' },
  { status: 'completed', label: 'Event day', detail: 'Karibu!' },
]

const JOURNEY_INDEX: Partial<Record<BookingStatus, number>> = {
  requested: 0,
  under_review: 1,
  deposit_due: 2,
  confirmed: 3,
  completed: 4,
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function TrackPage() {
  // Arriving from the hero widget carries ?phone=&ref= — prefill and look up
  // immediately, so the widget's "Find my booking" does what it says.
  const [searchParams] = useSearchParams()
  const [phone, setPhone] = useState(() => searchParams.get('phone') ?? '')
  const [reference, setReference] = useState(() => searchParams.get('ref') ?? '')
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; reference?: string }>({})
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [result, setResult] = useState<Booking | null | 'none'>(null)

  const autoRan = useRef(false)
  useEffect(() => {
    if (autoRan.current) return
    autoRan.current = true
    const qPhone = searchParams.get('phone')
    const qRef = searchParams.get('ref')
    if (!qPhone || !qRef) return
    setLoading(true)
    trackBooking(qPhone, qRef)
      .then((booking) => setResult(booking ?? 'none'))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false))
  }, [searchParams])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const errors: typeof fieldErrors = {}
    if (phone.replace(/\D/g, '').length < 9) {
      errors.phone = 'Enter the phone number you booked with.'
    }
    if (!/^[A-Za-z]{2}-\d{4}-\d{3,4}$/.test(reference.trim())) {
      errors.reference = 'The reference looks like ZK-2603-0142 — it is in your SMS.'
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoading(true)
    setFailed(false)
    try {
      const booking = await trackBooking(phone, reference)
      setResult(booking ?? 'none')
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  const booking = result && result !== 'none' ? result : null

  return (
    <>
      <PageHeading
        crumb="Track my booking"
        title="Where is my booking?"
        intro="Enter the phone number you booked with and the reference from your SMS. No account needed."
      />

      <section aria-label="Booking lookup" className="bg-paper pb-28">
        <Container className="flex flex-col gap-12 lg:flex-row lg:gap-24">
          {/* ---- Lookup form ---- */}
          <form onSubmit={onSubmit} noValidate className="w-full max-w-md shrink-0">
            {failed ? (
              <ErrorBanner className="mb-5">
                We could not check right now. Your details are still here — try again.
              </ErrorBanner>
            ) : null}
            <div className="flex flex-col gap-5">
              <Field
                label="Phone number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0712 345 678"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                onBlur={() => {
                  if (fieldErrors.phone && phone.replace(/\D/g, '').length >= 9) {
                    setFieldErrors((previous) => ({ ...previous, phone: undefined }))
                  }
                }}
                error={fieldErrors.phone}
              />
              <Field
                label="Booking reference"
                placeholder="ZK-2603-0142"
                autoComplete="off"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                onBlur={() => {
                  if (
                    fieldErrors.reference &&
                    /^[A-Za-z]{2}-\d{4}-\d{3,4}$/.test(reference.trim())
                  ) {
                    setFieldErrors((previous) => ({ ...previous, reference: undefined }))
                  }
                }}
                error={fieldErrors.reference}
                helper="From the SMS we sent when you made the request."
              />
              <Button type="submit" loading={loading} className="self-start">
                {loading ? 'Checking…' : 'Find my booking'}
              </Button>
            </div>
            <p className="mt-8 flex items-center gap-2 text-sm text-muted">
              <Phone size={15} aria-hidden="true" className="text-gold-dark" />
              Lost the SMS? Call reception on {CONTACT.phone}.
            </p>
          </form>

          {/* ---- Result ---- */}
          <div className="min-w-0 flex-1" aria-live="polite">
            {result === 'none' ? (
              <EmptyState
                title="No booking found"
                action={
                  <p className="text-sm text-muted">
                    Still stuck? Call reception on{' '}
                    <span className="font-medium text-ink">{CONTACT.phone}</span>.
                  </p>
                }
              >
                Check the reference in your SMS and the phone number you booked with, then try
                again.
              </EmptyState>
            ) : booking ? (
              <BookingResult booking={booking} />
            ) : null}
          </div>
        </Container>
      </section>
    </>
  )
}

function BookingResult({ booking }: { booking: Booking }) {
  const stepIndex = JOURNEY_INDEX[booking.status]

  return (
    <article className="rounded-card border border-line bg-paper shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
        <div>
          <p className="text-[13px] text-subtle">Booking {booking.reference}</p>
          <h2 className="mt-0.5 font-sans text-lg font-semibold">
            {booking.eventType} · {formatDate(booking.eventDate)}
          </h2>
        </div>
        <StatusBadge status={booking.status} />
      </header>

      <div className="flex flex-col gap-8 px-6 py-6">
        {/* Status-specific panel first: the thing to do or know right now. */}
        {booking.status === 'deposit_due' && booking.holdEndsOn ? (
          <div className="rounded-sm bg-warning-bg px-4 py-3.5 text-sm text-warning">
            <p className="font-semibold">
              Your date is held until {formatDate(booking.holdEndsOn)}.
            </p>
            <p className="mt-1">
              Pay the deposit of {booking.depositAmount} by then and the date is yours. Payment
              details are in your SMS — or call reception and pay by mobile money or at the
              office.
            </p>
          </div>
        ) : null}

        {booking.status === 'confirmed' ? (
          <div className="flex items-center gap-4 rounded-sm bg-success-bg/60 px-4 py-3.5">
            <SuccessMark kind="rings" className="size-14 shrink-0" />
            <p className="text-sm text-success">
              <span className="font-semibold">Your date is confirmed.</span> Your stylist will
              call about four weeks before the day to agree colours and flowers.
            </p>
          </div>
        ) : null}

        {booking.status === 'under_review' ? (
          <p className="rounded-sm bg-info-bg px-4 py-3.5 text-sm text-info">
            Reception is reviewing your request and will call you back — normally within
            [24 hours] of the request.
          </p>
        ) : null}

        {booking.status === 'completed' ? (
          <p className="rounded-sm bg-neutral-bg px-4 py-3.5 text-sm text-muted">
            This event has taken place. Asante sana — it was a joy hosting you.
          </p>
        ) : null}

        {/* Journey timeline — only for bookings still on the happy path. */}
        {stepIndex !== undefined ? (
          <ol className="flex flex-col gap-0">
            {JOURNEY.map((step, index) => {
              const state =
                index < stepIndex ? 'done' : index === stepIndex ? 'current' : 'ahead'
              return (
                <li key={step.status} className="relative flex gap-4 pb-5 last:pb-0">
                  {index < JOURNEY.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className={
                        'absolute top-5 left-[7px] h-full w-px ' +
                        (state === 'done' ? 'bg-success' : 'bg-line')
                      }
                    />
                  ) : null}
                  <span
                    aria-hidden="true"
                    className={
                      'relative mt-1 size-[15px] shrink-0 rounded-pill border-2 ' +
                      (state === 'done'
                        ? 'border-success bg-success'
                        : state === 'current'
                          ? 'border-red bg-paper'
                          : 'border-line bg-paper')
                    }
                  />
                  <div>
                    <p
                      className={
                        'text-sm font-semibold ' +
                        (state === 'ahead' ? 'text-subtle' : 'text-ink')
                      }
                    >
                      {step.label}
                      {state === 'current' ? (
                        <span className="ml-2 font-normal text-red">— you are here</span>
                      ) : null}
                    </p>
                    {state === 'current' ? (
                      <p className="mt-0.5 text-sm text-muted">{step.detail}</p>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ol>
        ) : null}

        {/* The booking itself. */}
        <dl>
          {(
            [
              ['Name', booking.clientName],
              ['Space', booking.space],
              ['Guests', String(booking.guests)],
              ['Decoration', booking.decorPackage ?? 'None — venue only'],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="hairline flex justify-between gap-6 py-2.5 text-sm">
              <dt className="text-muted">{label}</dt>
              <dd className="text-right font-medium text-ink">{value}</dd>
            </div>
          ))}
          <div className="hairline" aria-hidden="true" />
        </dl>

        <p className="text-[13px] text-subtle">
          Something changed? Call reception on {CONTACT.phone} with your reference — changes are
          agreed on the phone, not online, so nothing happens to your booking without you.
        </p>
      </div>
    </article>
  )
}
