/**
 * MOCK date availability — the stand-in for the Django availability endpoint
 * (GET /api/bookings/availability?date=…&space=…). The response shape here IS
 * the API contract; see docs/API_CONTRACT.md. When the backend exists, replace
 * the body of `checkDate` with a fetch and delete the rules below.
 *
 * WHICH DATES ARE TAKEN
 * ---------------------
 * Deterministic and date-of-month based, so the "date unavailable" screen
 * (B5) is reachable by hand on any day of any year without seeding a
 * database, and so tests do not go stale as the calendar moves:
 *
 *   main-hall     — the 8th, 14th and 22nd of every month
 *   second-space  — the 14th and 27th of every month
 *
 * The 14th is taken in BOTH spaces on purpose: it is the case where
 * "try the other space" is no help either, which is its own screen state.
 */

import type { SpaceSlug } from '@/content/site'

const TAKEN_DAYS_OF_MONTH: Record<SpaceSlug, readonly number[]> = {
  'main-hall': [8, 14, 22],
  'second-space': [14, 27],
}

export type AvailabilityResult =
  | { available: true }
  | {
      available: false
      /** Up to three free dates after the requested one, soonest first. */
      closestFreeDates: string[]
    }

/** `YYYY-MM-DD` in local time — `toISOString()` would shift across midnight. */
export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Parses `YYYY-MM-DD` as a local midnight, never UTC. */
export function fromISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

export function isTaken(iso: string, space: SpaceSlug): boolean {
  const day = fromISODate(iso).getDate()
  return TAKEN_DAYS_OF_MONTH[space].includes(day)
}

/** Midnight today, local — the boundary a date must be on or after. */
export function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function isPast(iso: string): boolean {
  return fromISODate(iso).getTime() < startOfToday().getTime()
}

/**
 * The next `count` free dates strictly after `iso` for that space.
 *
 * Scans forward a day at a time rather than computing the next free day
 * arithmetically: the real endpoint will consult actual bookings, and a
 * caller should not come to depend on the gaps being predictable.
 */
export function closestFreeDates(iso: string, space: SpaceSlug, count = 3): string[] {
  const found: string[] = []
  const cursor = fromISODate(iso)
  const today = startOfToday()

  // 120 days is a hard stop so a pathological rule can never spin forever.
  for (let step = 0; step < 120 && found.length < count; step += 1) {
    cursor.setDate(cursor.getDate() + 1)
    const candidate = toISODate(cursor)
    if (cursor.getTime() < today.getTime()) continue
    if (!isTaken(candidate, space)) found.push(candidate)
  }
  return found
}

/** Simulated latency, so loading states are visible in development. */
const LATENCY_MS = 500

export async function checkDate(date: string, space: SpaceSlug): Promise<AvailabilityResult> {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS))

  if (!isTaken(date, space)) return { available: true }
  return { available: false, closestFreeDates: closestFreeDates(date, space) }
}
