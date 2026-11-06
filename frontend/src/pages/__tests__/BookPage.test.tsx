import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

/**
 * lottie-web paints to a canvas at import time, and setup.ts stubs
 * getContext to null so HeroCanvas can exercise its bail-out path — so the
 * real player throws here before a single test runs. Stub the third-party
 * player only; SuccessMark itself stays real, so its reduced-motion and
 * play-once props are still covered by the component it renders.
 */
vi.mock('lottie-react', () => ({
  Lottie: () => <span data-testid="lottie" aria-hidden="true" />,
}))

import { toISODate } from '@/lib/mockAvailability'
import { BookPage } from '@/pages/BookPage'
import { renderWithProviders } from '@/test/renderWithProviders'

/**
 * End-to-end through the request flow against the mock modules.
 *
 * Dates are derived from the real clock rather than a mocked one: the flow
 * calls `new Date()` only through `startOfToday`, and faking timers here
 * fights `waitFor`. Next month's 9th is always free and its 8th is always
 * taken under the rule documented in mockAvailability.ts (main-hall: 8, 14,
 * 22), so both paths are reachable whenever this suite runs.
 */
function dayNextMonth(dayOfMonth: number): string {
  const now = new Date()
  return toISODate(new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth))
}

const FREE_DATE = dayNextMonth(9)
const TAKEN_DATE = dayNextMonth(8)
/** Last month's 9th — safely in the past, and free, so only the past check fires. */
const PAST_DATE = (() => {
  const now = new Date()
  return toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 9))
})()

const type = (element: HTMLElement, value: string) =>
  fireEvent.change(element, { target: { value } })

function fillStepOne(date: string, guests = '300') {
  type(screen.getByLabelText(/event date/i), date)
  type(screen.getByLabelText(/guests/i), guests)
  fireEvent.click(screen.getByRole('button', { name: /check this date/i }))
}

async function reachStepTwo(date = FREE_DATE, guests = '300') {
  fillStepOne(date, guests)
  return screen.findByLabelText(/your name/i, undefined, { timeout: 4000 })
}

describe('BookPage flow', () => {
  it('walks date -> details -> review -> sent and shows the reference', async () => {
    renderWithProviders(<BookPage />)

    const name = await reachStepTwo()
    type(name, 'Amina Juma')
    type(screen.getByLabelText(/phone number/i), '0712 345 678')
    fireEvent.click(screen.getByRole('button', { name: /review the request/i }))

    // Step 3 repeats what was entered.
    expect(await screen.findByText('Amina Juma')).toBeInTheDocument()
    expect(screen.getByText('Main hall')).toBeInTheDocument()
    expect(screen.getByText('300')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /send request/i }))

    expect(
      await screen.findByRole('heading', { name: /request sent/i }, { timeout: 4000 }),
    ).toBeInTheDocument()
    expect(screen.getByText(/^ZK-\d{4}-\d{4}$/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /track this booking/i })).toBeInTheDocument()
  })

  it('offers the closest free dates when the chosen date is taken', async () => {
    renderWithProviders(<BookPage />)

    fillStepOne(TAKEN_DATE)

    const notice = await screen.findByRole('status', undefined, { timeout: 4000 })
    expect(within(notice).getByText(/already booked/i)).toBeInTheDocument()

    // The chips are live, not decoration: choosing one continues the flow.
    const chips = within(notice)
      .getAllByRole('button')
      .filter((button) => /\d{4}$/.test(button.textContent ?? ''))
    expect(chips.length).toBe(3)

    fireEvent.click(chips[0])
    expect(await screen.findByLabelText(/your name/i)).toBeInTheDocument()
  })

  it('refuses a date in the past before calling availability', async () => {
    renderWithProviders(<BookPage />)

    fillStepOne(PAST_DATE)

    expect(await screen.findByText(/that date has passed/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/your name/i)).not.toBeInTheDocument()
  })

  it('asks for the guest count before checking the date', async () => {
    renderWithProviders(<BookPage />)

    type(screen.getByLabelText(/event date/i), FREE_DATE)
    fireEvent.click(screen.getByRole('button', { name: /check this date/i }))

    expect(await screen.findByText(/how many guests/i)).toBeInTheDocument()
  })

  it('keeps every answer when stepping back', async () => {
    renderWithProviders(<BookPage />)

    const name = await reachStepTwo()
    type(name, 'Neema Kato')
    type(screen.getByLabelText(/phone number/i), '0754 111 222')
    fireEvent.click(screen.getByRole('button', { name: /review the request/i }))

    await screen.findByText('Neema Kato')
    fireEvent.click(screen.getByRole('button', { name: /^back$/i }))

    expect(await screen.findByLabelText(/your name/i)).toHaveValue('Neema Kato')
    fireEvent.click(screen.getByRole('button', { name: /^back$/i }))

    expect(await screen.findByLabelText(/event date/i)).toHaveValue(FREE_DATE)
    expect(screen.getByLabelText(/guests/i)).toHaveValue(300)
  })

  it('keeps the visitor on review with their details when sending fails', async () => {
    renderWithProviders(<BookPage />)

    // 13 guests is the documented failure trigger.
    const name = await reachStepTwo(FREE_DATE, '13')
    type(name, 'Fatma Ally')
    type(screen.getByLabelText(/phone number/i), '0788 555 444')
    fireEvent.click(screen.getByRole('button', { name: /review the request/i }))
    fireEvent.click(await screen.findByRole('button', { name: /send request/i }))

    const alert = await screen.findByRole('alert', undefined, { timeout: 4000 })
    expect(alert).toHaveTextContent(/could not send/i)
    // Nothing lost — the summary is still there to retry from.
    expect(screen.getByText('Fatma Ally')).toBeInTheDocument()
  })

  it('prefills from the hero widget query string', async () => {
    renderWithProviders(<BookPage />, {
      initialEntries: [`/book?date=${FREE_DATE}&space=second-space&guests=120`],
    })

    expect(screen.getByLabelText(/event date/i)).toHaveValue(FREE_DATE)
    expect(screen.getByLabelText(/guests/i)).toHaveValue(120)
    expect(screen.getByRole('button', { name: /second space/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
