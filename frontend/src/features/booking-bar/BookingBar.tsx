import { ArrowRight, CalendarDays, Heart, MapPin, Users } from 'lucide-react'
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
 * The hero booking bar: three tabs over a white card of four fields and a red
 * CTA (Figma node 21:27).
 *
 * Stage 1 collects a selection and hands it to /book as query params; the real
 * flow is Stage 2. The fields are therefore plain native inputs rather than
 * custom comboboxes — a native date picker and a native select are already
 * keyboard- and screen-reader-correct, and inventing replacements now would be
 * work thrown away when the real form arrives.
 *
 * Space and event type are hardcoded here only until milestone (b)'s
 * /api/spaces/ exists; the values are the two spaces the design names.
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

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    void navigate(bookingHref({ mode, date, space, eventType, guests }))
  }

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
                'rounded-t-[14px] px-5 py-3.5 text-[13px] font-semibold transition-colors sm:px-[26px] sm:text-sm',
                selected ? 'bg-white text-ink' : 'bg-white/22 text-white hover:bg-white/30',
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
        className="flex flex-col gap-3 rounded-b-[20px] rounded-tr-[20px] bg-white p-5 lg:flex-row lg:items-center"
      >
        <Field
          icon={<CalendarDays size={22} aria-hidden="true" className="text-magenta" />}
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
          icon={<MapPin size={22} aria-hidden="true" className="text-magenta" />}
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
          icon={<Heart size={22} aria-hidden="true" className="text-magenta" />}
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
          icon={<Users size={22} aria-hidden="true" className="text-magenta" />}
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
            className="w-full bg-transparent text-[15px] font-medium text-ink outline-none placeholder:font-medium placeholder:text-ink/90"
          />
        </Field>

        <button
          type="submit"
          className="inline-flex shrink-0 items-center justify-center gap-2.5 rounded-pill bg-red px-7 py-4 text-[15px] font-semibold whitespace-nowrap text-white transition-colors hover:bg-red/90"
        >
          {t(TABS.find((tab) => tab.mode === mode)!.labelKey)}
          <ArrowRight size={18} aria-hidden="true" />
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
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[14px] bg-cream px-[18px] py-3.5 lg:h-[66px]">
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
