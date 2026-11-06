import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  checkDate,
  closestFreeDates,
  fromISODate,
  isPast,
  isTaken,
  toISODate,
} from '@/lib/mockAvailability'

/**
 * The taken-date rule is documented in mockAvailability.ts:
 *   main-hall    — 8th, 14th, 22nd
 *   second-space — 14th, 27th
 * These tests pin that rule, because the "date unavailable" screen (B5) is
 * only reachable by hand if it holds.
 */

afterEach(() => {
  vi.useRealTimers()
})

describe('date helpers', () => {
  it('round-trips an ISO date through local midnight, not UTC', () => {
    // toISOString() would shift this back a day in any timezone east of UTC.
    expect(toISODate(fromISODate('2027-03-21'))).toBe('2027-03-21')
  })

  it('parses an ISO date as local midnight', () => {
    const parsed = fromISODate('2027-03-21')
    expect(parsed.getFullYear()).toBe(2027)
    expect(parsed.getMonth()).toBe(2)
    expect(parsed.getDate()).toBe(21)
    expect(parsed.getHours()).toBe(0)
  })
})

describe('isTaken', () => {
  it('marks the documented main-hall days', () => {
    expect(isTaken('2027-03-08', 'main-hall')).toBe(true)
    expect(isTaken('2027-03-14', 'main-hall')).toBe(true)
    expect(isTaken('2027-03-22', 'main-hall')).toBe(true)
  })

  it('marks the documented second-space days', () => {
    expect(isTaken('2027-03-14', 'second-space')).toBe(true)
    expect(isTaken('2027-03-27', 'second-space')).toBe(true)
  })

  it('leaves every other day free', () => {
    expect(isTaken('2027-03-09', 'main-hall')).toBe(false)
    expect(isTaken('2027-03-22', 'second-space')).toBe(false)
  })

  it('applies the rule in any month and year', () => {
    expect(isTaken('2026-11-08', 'main-hall')).toBe(true)
    expect(isTaken('2030-01-08', 'main-hall')).toBe(true)
  })

  it('takes the 14th in BOTH spaces, so "try the other room" is no escape', () => {
    expect(isTaken('2027-03-14', 'main-hall')).toBe(true)
    expect(isTaken('2027-03-14', 'second-space')).toBe(true)
  })
})

describe('isPast', () => {
  it('rejects yesterday and accepts today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2027, 2, 10, 13, 0, 0))
    expect(isPast('2027-03-09')).toBe(true)
    // Today is not past, even though midnight has gone.
    expect(isPast('2027-03-10')).toBe(false)
    expect(isPast('2027-03-11')).toBe(false)
  })
})

describe('closestFreeDates', () => {
  it('returns three free dates strictly after the requested one', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2027, 2, 1))

    const dates = closestFreeDates('2027-03-08', 'main-hall')
    expect(dates).toEqual(['2027-03-09', '2027-03-10', '2027-03-11'])
  })

  it('skips the next taken day rather than offering it', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2027, 2, 1))

    // The 13th is free, the 14th is taken, so the 15th comes next.
    const dates = closestFreeDates('2027-03-12', 'main-hall')
    expect(dates).toEqual(['2027-03-13', '2027-03-15', '2027-03-16'])
  })

  it('never offers a date in the past', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2027, 2, 20))

    const dates = closestFreeDates('2027-03-08', 'main-hall')
    expect(dates.every((iso) => !isPast(iso))).toBe(true)
  })
})

describe('checkDate', () => {
  it('reports a free date as available', async () => {
    await expect(checkDate('2027-03-09', 'main-hall')).resolves.toEqual({ available: true })
  })

  it('reports a taken date with three alternatives', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2027, 2, 1))

    const result = await checkDate('2027-03-08', 'main-hall')
    expect(result.available).toBe(false)
    if (result.available) throw new Error('expected unavailable')
    expect(result.closestFreeDates).toHaveLength(3)
    expect(result.closestFreeDates).not.toContain('2027-03-08')
  })

  it('can be free in one space and taken in the other on the same day', async () => {
    await expect(checkDate('2027-03-22', 'second-space')).resolves.toEqual({ available: true })
    const mainHall = await checkDate('2027-03-22', 'main-hall')
    expect(mainHall.available).toBe(false)
  })
})
