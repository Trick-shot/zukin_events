import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  BookingSubmitError,
  FAILURE_GUEST_COUNT,
  submitRequest,
  submitSiteVisit,
  type BookingRequest,
} from '@/lib/mockBookings'

/**
 * The mocks sleep ~900ms to make loading states visible by hand. Driving the
 * fake clock instead keeps the suite fast: without this these ten tests alone
 * cost 13 seconds of real waiting.
 */
async function settle<T>(promise: Promise<T>): Promise<T> {
  // Observe the promise BEFORE advancing the clock. Advancing first lets a
  // rejection land with no handler attached, which Vitest reports as an
  // unhandled rejection even though the test goes on to assert it.
  const outcome = promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  )
  await vi.runAllTimersAsync()
  const settled = await outcome
  if (settled.ok) return settled.value
  throw settled.error
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

const REQUEST: BookingRequest = {
  eventDate: '2027-03-21',
  space: 'main-hall',
  eventType: 'wedding',
  guests: 300,
  clientName: 'Amina Juma',
  phone: '0712 345 678',
  decorPackage: 'Premium',
}

describe('submitRequest', () => {
  it('returns a reference in the same shape as the fixtures', async () => {
    const { reference } = await settle(submitRequest(REQUEST))
    expect(reference).toMatch(/^ZK-\d{4}-\d{4}$/)
  })

  it('dates the reference by the EVENT month, not today', async () => {
    // ZK-2603-… is a March 2027 event, matching the ZK-2603-0142 fixture.
    const { reference } = await settle(submitRequest(REQUEST))
    expect(reference.startsWith('ZK-2703-')).toBe(true)
  })

  it('is deterministic for the same payload', async () => {
    const first = await settle(submitRequest(REQUEST))
    const second = await settle(submitRequest(REQUEST))
    expect(first.reference).toBe(second.reference)
  })

  it('gives different bookings different references', async () => {
    const other = await settle(submitRequest({ ...REQUEST, phone: '0788 555 444' }))
    const first = await settle(submitRequest(REQUEST))
    expect(other.reference).not.toBe(first.reference)
  })

  it('fails deterministically on the documented trigger, so B3 errors are reachable', async () => {
    await expect(settle(submitRequest({ ...REQUEST, guests: FAILURE_GUEST_COUNT }))).rejects.toBeInstanceOf(
      BookingSubmitError,
    )
  })

  it('accepts a guest count either side of the trigger', async () => {
    await expect(settle(submitRequest({ ...REQUEST, guests: 12 }))).resolves.toHaveProperty('reference')
    await expect(settle(submitRequest({ ...REQUEST, guests: 14 }))).resolves.toHaveProperty('reference')
  })

  it('carries a null decoration package without complaint', async () => {
    await expect(settle(submitRequest({ ...REQUEST, decorPackage: null }))).resolves.toHaveProperty(
      'reference',
    )
  })
})

describe('submitSiteVisit', () => {
  it('uses its own ZV- prefix so reception can tell the types apart', async () => {
    const { reference } = await settle(
      submitSiteVisit({ day: '2026-11-20', slot: '10:00', phone: '0712 345 678' }),
    )
    expect(reference).toMatch(/^ZV-\d{4}-\d{4}$/)
  })

  it('is deterministic for the same request', async () => {
    const input = { day: '2026-11-20', slot: '12:00', phone: '0712 345 678' }
    const first = await settle(submitSiteVisit(input))
    const second = await settle(submitSiteVisit(input))
    expect(first.reference).toBe(second.reference)
  })

  it('fails on its documented trigger', async () => {
    await expect(
      settle(submitSiteVisit({ day: '2026-11-20', slot: '10:00', phone: '0712 345 613' })),
    ).rejects.toBeInstanceOf(BookingSubmitError)
  })
})
