import { describe, expect, it } from 'vitest'

import { bookingHref, isBookingMode } from '@/lib/booking'

describe('isBookingMode', () => {
  it('accepts the three modes the hero tabs and the calendar use', () => {
    expect(isBookingMode('availability')).toBe(true)
    expect(isBookingMode('visit')).toBe(true)
    expect(isBookingMode('track')).toBe(true)
  })

  it('rejects anything else, including a missing param', () => {
    expect(isBookingMode(null)).toBe(false)
    expect(isBookingMode('')).toBe(false)
    expect(isBookingMode('booking')).toBe(false)
  })
})

describe('bookingHref', () => {
  it('omits fields the visitor has not chosen', () => {
    expect(bookingHref({ mode: 'visit' })).toBe('/book?mode=visit')
  })

  it('carries the full booking-bar selection', () => {
    expect(
      bookingHref({
        mode: 'availability',
        date: '2026-11-27',
        space: 'main-hall',
        eventType: 'wedding',
        guests: 200,
      }),
    ).toBe('/book?mode=availability&date=2026-11-27&space=main-hall&eventType=wedding&guests=200')
  })

  it('encodes values rather than breaking the query string', () => {
    expect(bookingHref({ mode: 'track', space: 'Main hall' })).toBe(
      '/book?mode=track&space=Main+hall',
    )
  })
})
