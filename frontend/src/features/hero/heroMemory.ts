/**
 * Has this visitor already experienced the hero tour this session?
 *
 * First visit: the full thing — title film, then the scroll journey. Once
 * they have been through it (or navigated away from the landing page),
 * coming home should not make them scrub the whole venue again: they land
 * at the end of the sequence, booking bar ready, and can swipe UP to replay
 * the tour backwards whenever they want it.
 *
 * sessionStorage, not localStorage, on purpose: a visitor returning
 * tomorrow gets the full experience again.
 */
const KEY = 'zukin-hero-seen'

export function heroSeen(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function markHeroSeen(): void {
  try {
    window.sessionStorage.setItem(KEY, '1')
  } catch {
    // Blocked storage just means the tour replays; nothing breaks.
  }
}
