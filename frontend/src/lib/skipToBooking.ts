/**
 * Scroll the booking bar into a state where it can actually be used.
 *
 * A plain `href="#booking-bar"` is not enough while the hero is pinned. The
 * bar lives inside a sticky stage, so its document position is near the top of
 * a 450vh section — jumping there lands at about 20% progress, where the bar
 * is still faded out, aria-hidden and not clickable. The link has to jump to
 * the END of the pinned section, which is where the sequence reveals it.
 *
 * With pinning off (prefers-reduced-motion, or a failed sequence) the hero is
 * a normal block and the ordinary anchor behaviour is correct, so this falls
 * back to scrolling the element into view.
 */
export function skipToBooking(): void {
  const bar = document.getElementById('booking-bar')
  if (!bar) return

  const hero = document.getElementById('hero')
  const pinned = hero !== null && hero.getBoundingClientRect().height > window.innerHeight * 1.5

  if (pinned && hero) {
    const heroTop = hero.getBoundingClientRect().top + window.scrollY
    // The last scroll position inside the section, i.e. progress === 1.
    const end = heroTop + hero.getBoundingClientRect().height - window.innerHeight
    window.scrollTo({ top: end, behavior: 'auto' })
  } else {
    bar.scrollIntoView({ block: 'center', behavior: 'auto' })
  }

  // Move focus to the first control so a keyboard user carries on from the
  // bar rather than from the link they just left.
  const firstControl = bar.querySelector<HTMLElement>(
    'button, input, select, textarea, a[href]',
  )
  firstControl?.focus({ preventScroll: true })
}
