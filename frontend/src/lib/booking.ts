/**
 * The hand-off contract between the landing page and /book.
 *
 * The hero's three tabs, the booking bar and "Request this date" all funnel
 * into one route, distinguished by `mode`. Keeping the union and its guard
 * here (rather than inside the page) means milestone (c)'s booking bar and
 * milestone (e)'s calendar can build the same URLs without importing a page.
 */
export const BOOKING_MODES = ['availability', 'visit', 'track'] as const
export type BookingMode = (typeof BOOKING_MODES)[number]

export function isBookingMode(value: string | null): value is BookingMode {
  return value !== null && (BOOKING_MODES as readonly string[]).includes(value)
}

export type BookingSelection = {
  mode: BookingMode
  date?: string
  space?: string
  eventType?: string
  guests?: string | number
}

/** Build a /book URL, omitting anything the visitor has not chosen yet. */
export function bookingHref({ mode, ...rest }: BookingSelection): string {
  const params = new URLSearchParams({ mode })
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  return `/book?${params.toString()}`
}
