import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

import { Container } from '@/components/layout/Container'
import { Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/Button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Glow } from '@/components/ui/Glow'
import { isBookingMode, type BookingMode } from '@/lib/booking'

/**
 * Stage 2 will turn this into the real booking flow. For now it is a real
 * route (not a modal) that echoes back whatever the booking bar, the three
 * hero tabs and "Request this date" put in the query string — so those
 * hand-offs can be verified end to end before any form exists.
 */
export function BookPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()

  const modeParam = params.get('mode')
  const mode: BookingMode = isBookingMode(modeParam) ? modeParam : 'availability'

  const selection = [
    { key: 'date', value: params.get('date') },
    { key: 'space', value: params.get('space') },
    { key: 'eventType', value: params.get('eventType') },
    { key: 'guests', value: params.get('guests') },
  ].filter((entry) => entry.value)

  return (
    <Section tone="cream" className="pt-40 pb-28" labelledBy="book-heading">
      <Glow tone="pink" size={700} className="-top-40 -right-40" />
      <Container>
        <Eyebrow>{t('book.eyebrow')}</Eyebrow>
        <h1 id="book-heading" className="mt-4 max-w-[18ch] text-4xl xl:text-6xl">
          {t('book.title')}
        </h1>
        <p className="mt-5 max-w-[52ch] text-lg text-muted">{t('book.body')}</p>

        <dl className="mt-10 flex flex-col gap-3 rounded-card border border-line bg-white p-6 sm:max-w-md">
          <div className="flex justify-between gap-6 text-[15px]">
            <dt className="text-muted">{t('book.fields.mode')}</dt>
            <dd className="font-medium">{t(`book.modes.${mode}`)}</dd>
          </div>
          {selection.map((entry) => (
            <div key={entry.key} className="flex justify-between gap-6 text-[15px]">
              <dt className="text-muted">{t(`book.fields.${entry.key}`)}</dt>
              <dd className="font-medium">{entry.value}</dd>
            </div>
          ))}
        </dl>

        <Button as="link" to="/" variant="outline" className="mt-10">
          {t('book.backHome')}
        </Button>
      </Container>
    </Section>
  )
}
