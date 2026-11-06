/**
 * MOCK booking lookup — the stand-in for the Django tracking endpoint
 * (GET /api/bookings/track?phone=…&reference=…). The response shape here IS
 * the API contract the backend should implement; when it exists, replace the
 * body of `trackBooking` with a fetch and delete the fixtures.
 *
 * Fixtures cover one booking per lifecycle state so every screen state can
 * be exercised by hand:
 *   0712 345 678 / ZK-2603-0142 — under review (Amina's wedding)
 *   0754 111 222 / ZK-2603-0138 — deposit due, hold ending (Neema's send-off)
 *   0788 555 444 / ZK-2602-0121 — confirmed (Fatma's wedding)
 *   0767 000 111 / ZK-2601-0098 — completed (corporate dinner)
 */

export type BookingStatus =
  | 'requested'
  | 'under_review'
  | 'deposit_due'
  | 'confirmed'
  | 'completed'
  | 'rejected'
  | 'expired'
  | 'cancelled'

export type Booking = {
  reference: string
  clientName: string
  eventType: string
  space: string
  eventDate: string
  guests: number
  decorPackage: string | null
  status: BookingStatus
  /** Only while status is deposit_due. */
  holdEndsOn?: string
  depositAmount?: string
}

const FIXTURES: Array<{ phone: string; booking: Booking }> = [
  {
    phone: '0712345678',
    booking: {
      reference: 'ZK-2603-0142',
      clientName: 'Amina Juma',
      eventType: 'Wedding',
      space: 'Main hall',
      eventDate: '2027-03-13',
      guests: 300,
      decorPackage: 'Premium',
      status: 'under_review',
    },
  },
  {
    phone: '0754111222',
    booking: {
      reference: 'ZK-2603-0138',
      clientName: 'Neema Kato',
      eventType: 'Send-off',
      space: 'Second space',
      eventDate: '2027-03-21',
      guests: 150,
      decorPackage: 'Classic',
      status: 'deposit_due',
      holdEndsOn: '2026-11-12',
      depositAmount: 'TZS [amount]',
    },
  },
  {
    phone: '0788555444',
    booking: {
      reference: 'ZK-2602-0121',
      clientName: 'Fatma Ally',
      eventType: 'Wedding',
      space: 'Main hall',
      eventDate: '2027-04-24',
      guests: 350,
      decorPackage: 'Signature',
      status: 'confirmed',
    },
  },
  {
    phone: '0767000111',
    booking: {
      reference: 'ZK-2601-0098',
      clientName: 'Baraka Ltd',
      eventType: 'Corporate dinner',
      space: 'Main hall',
      eventDate: '2026-09-18',
      guests: 220,
      decorPackage: null,
      status: 'completed',
    },
  },
]

/** Digits only, local form: '+255 712 345 678' and '0712-345-678' both match. */
function normalisePhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.startsWith('255') ? '0' + digits.slice(3) : digits
}

export async function trackBooking(
  phone: string,
  reference: string,
): Promise<Booking | null> {
  // Simulated network latency so loading states are visible in development.
  await new Promise((resolve) => setTimeout(resolve, 700))
  const wantedPhone = normalisePhone(phone)
  const wantedRef = reference.trim().toUpperCase()
  const hit = FIXTURES.find(
    (fixture) =>
      normalisePhone(fixture.phone) === wantedPhone &&
      fixture.booking.reference.toUpperCase() === wantedRef,
  )
  return hit ? hit.booking : null
}
