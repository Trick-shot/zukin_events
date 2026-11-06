import { CalendarDays, Hash, Heart, MapPin, Phone, Users } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { cn } from '@/lib/cn'
import { bookingHref, type BookingMode } from '@/lib/booking'

const TABS: { mode: BookingMode; labelKey: string }[] = [
  { mode: 'availability', labelKey: 'actions.checkAvailability' },
  { mode: 'visit', labelKey: 'actions.bookSiteVisit' },
  { mode: 'track', labelKey: 'actions.trackBooking' },
]

/**
 * The hero booking bar: three tabs over a white card (Figma 21:27, restyled
 * to v3 — small radii, bronze field icons, the square red CTA).
 *
 * Each tab asks ONLY for what its task needs:
 *   - Check availability: date, space, event type, guests -> /book
 *   - Book a site visit: preferred day, phone -> /site-visit
 *   - Track my booking: phone, reference -> /track (which auto-looks-up)
 * One form showing the same four fields under three different names was the
 * old behaviour, and it read as three names for one action.
 *
 * Native date/select inputs on purpose: keyboard- and screen-reader-correct
 * without custom widget work that the real Stage-2 form will replace.
 */
export function BookingBar({ className }: { className?: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const ids = useId()

  const [mode, setMode] = useState<BookingMode>('availability')
  const [date, setDate] = useState('')
  const [space, setSpace] = useState('')
  const [eventType, setEventType] = useState('')
  const [guests, setGuests] = useState('')
  const [phone, setPhone] = useState('')
  const [reference, setReference] = useState('')

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (mode === 'track') {
      const params = new URLSearchParams()
      if (phone) params.set('phone', phone)
      if (reference) params.set('ref', reference)
      void navigate(`/track?${params.toString()}`)
      return
    }
    if (mode === 'visit') {
      const params = new URLSearchParams()
      if (date) params.set('date', date)
      if (phone) params.set('phone', phone)
      void navigate(`/site-visit?${params.toString()}`)
      return
    }
    void navigate(bookingHref({ mode, date, space, eventType, guests }))
  }

  const cta =
    mode === 'track'
      ? t('actions.findBooking')
      : mode === 'visit'
        ? t('actions.bookVisit')
        : t('actions.checkAvailability')

  const iconClass = 'text-gold-dark'

  return (
    <div id="booking-bar" className={cn('w-full', className)}>
      {/* Tabs sit on the card's top edge, so they are a tablist, not links. */}
      <div role="tablist" aria-label={t('bookingBar.tabsLabel')} className="flex">
        {TABS.map((tab) => {
          const selected = tab.mode === mode
          return (
            <button
              key={tab.mode}
              type="button"
              role="tab"
              id={`${ids}-tab-${tab.mode}`}
              aria-selected={selected}
              aria-controls={`${ids}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setMode(tab.mode)}
              onKeyDown={(event) => {
                const index = TABS.findIndex((candidate) => candidate.mode === mode)
                if (event.key === 'ArrowRight') {
                  setMode(TABS[(index + 1) % TABS.length].mode)
                } else if (event.key === 'ArrowLeft') {
                  setMode(TABS[(index - 1 + TABS.length) % TABS.length].mode)
                }
              }}
              className={cn(
                'rounded-t-sm px-5 py-3 text-[13px] font-semibold transition-colors sm:px-6 sm:text-sm',
                selected ? 'bg-white text-ink' : 'bg-white/20 text-white hover:bg-white/30',
              )}
            >
              {t(tab.labelKey)}
            </button>
          )
        })}
      </div>

      <form
        id={`${ids}-panel`}
        role="tabpanel"
        aria-labelledby={`${ids}-tab-${mode}`}
        onSubmit={submit}
        className="flex flex-col gap-3 rounded-b-sm rounded-tr-sm bg-white p-4 lg:flex-row lg:items-stretch"
      >
        {mode === 'availability' ? (
          <>
            <Field
              icon={<CalendarDays size={20} aria-hidden="true" className={iconClass} />}
              label={t('bookingBar.eventDate')}
              htmlFor={`${ids}-date`}
            >
              <input
                id={`${ids}-date`}
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full bg-transparent text-[15px] font-medium text-ink outline-none"
              />
            </Field>
            <Field
              icon={<MapPin size={20} aria-hidden="true" className={iconClass} />}
              label={t('bookingBar.space')}
              htmlFor={`${ids}-space`}
            >
              <select
                id={`${ids}-space`}
                value={space}
                onChange={(event) => setSpace(event.target.value)}
                className="w-full bg-transparent text-[15px] font-medium text-ink outline-none"
              >
                <option value="">{t('bookingBar.selectSpace')}</option>
                <option value="main-hall">{t('spaces.mainHall')}</option>
                <option value="second-space">{t('spaces.secondSpace')}</option>
              </select>
            </Field>
            <Field
              icon={<Heart size={20} aria-hidden="true" className={iconClass} />}
              label={t('bookingBar.eventType')}
              htmlFor={`${ids}-event-type`}
            >
              <select
                id={`${ids}-event-type`}
                value={eventType}
                onChange={(event) => setEventType(event.target.value)}
                className="w-full bg-transparent text-[15px] font-medium text-ink outline-none"
              >
                <option value="">{t('bookingBar.selectEventType')}</option>
                <option value="wedding">{t('eventTypes.weddings')}</option>
                <option value="send-off">{t('eventTypes.sendOffs')}</option>
                <option value="kitchen-party">{t('eventTypes.kitchenParties')}</option>
                <option value="birthday">{t('eventTypes.birthdays')}</option>
                <option value="corporate">{t('eventTypes.corporate')}</option>
              </select>
            </Field>
            <Field
              icon={<Users size={20} aria-hidden="true" className={iconClass} />}
              label={t('bookingBar.guests')}
              htmlFor={`${ids}-guests`}
            >
              <input
                id={`${ids}-guests`}
                type="number"
                min={1}
                inputMode="numeric"
                placeholder={t('bookingBar.numberOfGuests')}
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                className="w-full bg-transparent text-[15px] font-medium text-ink outline-none placeholder:text-muted"
              />
            </Field>
          </>
        ) : mode === 'visit' ? (
          <>
            <Field
              icon={<CalendarDays size={20} aria-hidden="true" className={iconClass} />}
              label={t('bookingBar.preferredDate')}
              htmlFor={`${ids}-visit-date`}
            >
              <input
                id={`${ids}-visit-date`}
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full bg-transparent text-[15px] font-medium text-ink outline-none"
              />
            </Field>
            <Field
              icon={<Phone size={20} aria-hidden="true" className={iconClass} />}
              label={t('bookingBar.phone')}
              htmlFor={`${ids}-visit-phone`}
            >
              <input
                id={`${ids}-visit-phone`}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t('bookingBar.phonePlaceholder')}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full bg-transparent text-[15px] font-medium text-ink outline-none placeholder:text-muted"
              />
            </Field>
          </>
        ) : (
          <>
            <Field
              icon={<Phone size={20} aria-hidden="true" className={iconClass} />}
              label={t('bookingBar.phone')}
              htmlFor={`${ids}-track-phone`}
            >
              <input
                id={`${ids}-track-phone`}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t('bookingBar.phonePlaceholder')}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full bg-transparent text-[15px] font-medium text-ink outline-none placeholder:text-muted"
              />
            </Field>
            <Field
              icon={<Hash size={20} aria-hidden="true" className={iconClass} />}
              label={t('bookingBar.reference')}
              htmlFor={`${ids}-track-ref`}
            >
              <input
                id={`${ids}-track-ref`}
                placeholder={t('bookingBar.refPlaceholder')}
                autoComplete="off"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                className="w-full bg-transparent text-[15px] font-medium text-ink outline-none placeholder:text-muted"
              />
            </Field>
          </>
        )}

        <button
          type="submit"
          className="inline-flex shrink-0 items-center justify-center rounded-xs bg-red px-7 py-4 text-[15px] font-semibold tracking-[0.02em] whitespace-nowrap text-white transition-colors hover:bg-red-dark motion-safe:active:scale-[0.98]"
        >
          {cta}
        </button>
      </form>
    </div>
  )
}

function Field({
  icon,
  label,
  htmlFor,
  children,
}: {
  icon: React.ReactNode
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-sm bg-sand px-4 py-3 lg:h-16">
      <span className="shrink-0">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <label htmlFor={htmlFor} className="text-xs font-medium text-muted">
          {label}
        </label>
        {children}
      </span>
    </div>
  )
}
