import { Phone } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router'

import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Field } from '@/components/ui/Field'
import { PageHeading } from '@/components/ui/PageHeading'
import { SuccessMark } from '@/components/ui/SuccessMark'
import { CONTACT } from '@/content/site'
import { fromISODate, startOfToday, toISODate } from '@/lib/mockAvailability'
import { submitSiteVisit } from '@/lib/mockBookings'
import { cn } from '@/lib/cn'

/**
 * /site-visit — B8 (Figma 97:1272 / 97:1404): pick a day, pick a slot, leave
 * a phone number. No account and no confirmation on the spot: reception
 * confirms by SMS, which the success screen says plainly rather than
 * implying the slot is already held.
 */

/** Slot times are a placeholder until the owner confirms the real ones. */
const SLOTS = ['10:00', '12:00', '15:00'] as const

const DAYS_OFFERED = 14

type OfferedDay = { iso: string; weekday: string; dayOfMonth: string; closed: boolean }

export function SiteVisitPage() {
  const [params] = useSearchParams()

  const days = useMemo<OfferedDay[]>(() => {
    const today = startOfToday()
    return Array.from({ length: DAYS_OFFERED }, (_, offset) => {
      const date = new Date(today)
      date.setDate(date.getDate() + offset + 1)
      return {
        iso: toISODate(date),
        weekday: date.toLocaleDateString('en-GB', { weekday: 'short' }),
        dayOfMonth: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        // Sundays are marked closed — unconfirmed, see the note on screen.
        closed: date.getDay() === 0,
      }
    })
  }, [])

  const [day, setDay] = useState(() => {
    const fromQuery = params.get('date')
    return fromQuery && days.some((d) => d.iso === fromQuery && !d.closed) ? fromQuery : ''
  })
  const [slot, setSlot] = useState<string>('')
  const [phone, setPhone] = useState(() => params.get('phone') ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)
  const [reference, setReference] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!day) next.day = 'Pick a day that suits you.'
    if (!slot) next.slot = 'Pick a time.'
    if (phone.replace(/\D/g, '').length < 9) next.phone = 'Enter a phone number we can confirm on.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSending(true)
    setFailed(false)
    try {
      const result = await submitSiteVisit({ day, slot, phone: phone.trim() })
      setReference(result.reference)
    } catch {
      setFailed(true)
    } finally {
      setSending(false)
    }
  }

  if (reference) {
    const chosen = days.find((d) => d.iso === day)
    return (
      <>
        <PageHeading crumb="Book a site visit" title="Visit requested." />
        <section aria-label="Site visit requested" className="bg-paper pb-28">
          <Container>
            <div className="max-w-xl rounded-card border border-line p-8">
              <SuccessMark kind="success" className="size-16" />
              {/* Revealed just after the check draws, so the two read as one
                  moment rather than racing each other. */}
              <div
                style={{ animationDelay: '300ms' }}
                className="motion-safe:animate-[rise-in_.45s_ease-out_both]"
              >
              <p className="mt-5 text-[15px] text-muted">
                We have your request for{' '}
                <span className="font-semibold text-ink">
                  {chosen ? fromISODate(chosen.iso).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  }) : day}{' '}
                  at {slot}
                </span>
                .
              </p>
              <p className="mt-3 text-[15px] text-muted">
                We will confirm by SMS to{' '}
                <span className="font-semibold text-ink">{phone}</span>. The slot is not held
                until reception confirms it. [SMS wording to confirm.]
              </p>
              <p className="mt-5 text-sm text-muted">
                Your reference is <span className="font-semibold text-ink">{reference}</span>.
              </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button as="link" to="/spaces" variant="outline">
                  See the spaces
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
        crumb="Book a site visit"
        title="Come and see the hall."
        intro="Free, about 30 minutes, and someone walks you through both rooms. Pick a day and we confirm by SMS."
      />

      <section aria-label="Site visit request" className="bg-paper pb-28">
        <Container>
          <form onSubmit={submit} noValidate className="flex max-w-xl flex-col gap-7">
            {failed ? (
              <ErrorBanner>
                We could not send that request. Your choices are still here, so try again.
              </ErrorBanner>
            ) : null}

            {/* ---- Day ------------------------------------------------ */}
            <fieldset>
              <legend className="text-sm font-medium text-ink">Preferred day</legend>
              <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {days.map((option) => (
                  <button
                    key={option.iso}
                    type="button"
                    disabled={option.closed}
                    aria-pressed={day === option.iso}
                    onClick={() => setDay(option.iso)}
                    className={cn(
                      'rounded-sm border px-2 py-2.5 text-center',
                      'transition-[background-color,border-color] duration-150',
                      !option.closed && 'motion-safe:active:scale-[0.98]',
                      option.closed && 'cursor-not-allowed border-line-soft text-subtle/60',
                      !option.closed &&
                        day === option.iso &&
                        'border-red font-semibold text-ink',
                      !option.closed &&
                        day !== option.iso &&
                        'border-line text-muted hover:border-ink/40',
                    )}
                  >
                    <span className="block text-[12px] uppercase tracking-wide">
                      {option.weekday}
                    </span>
                    <span className="block text-[15px]">{option.dayOfMonth}</span>
                  </button>
                ))}
              </div>
              {errors.day ? <p className="mt-2 text-[13px] text-red-dark">{errors.day}</p> : null}
              <p className="mt-2.5 text-[13px] text-subtle">
                Sundays are shown closed [confirm with owner].
              </p>
            </fieldset>

            {/* ---- Slot ----------------------------------------------- */}
            <fieldset>
              <legend className="text-sm font-medium text-ink">Time</legend>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {SLOTS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={slot === option}
                    onClick={() => setSlot(option)}
                    className={cn(
                      'rounded-sm border px-4 py-2.5 text-[15px]',
                      'transition-[background-color,border-color] duration-150',
                      'motion-safe:active:scale-[0.98]',
                      slot === option
                        ? 'border-red font-semibold text-ink'
                        : 'border-line text-muted hover:border-ink/40',
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {errors.slot ? <p className="mt-2 text-[13px] text-red-dark">{errors.slot}</p> : null}
              <p className="mt-2.5 text-[13px] text-subtle">Slot times are [placeholder].</p>
            </fieldset>

            <Field
              label="Phone number"
              type="tel"
              inputMode="tel"
              placeholder="0712 345 678"
              value={phone}
              error={errors.phone}
              helper="We confirm the visit by SMS to this number."
              autoComplete="tel"
              onChange={(event) => setPhone(event.target.value)}
            />

            <div>
              <Button type="submit" loading={sending}>
                {sending ? 'Sending…' : 'Request this visit'}
              </Button>
            </div>
          </form>

          <p className="mt-10 flex items-center gap-2 text-sm text-muted">
            <Phone size={15} aria-hidden="true" className="text-gold-dark" />
            Rather talk to someone? Call reception on {CONTACT.phone}.
          </p>
        </Container>
      </section>
    </>
  )
}
