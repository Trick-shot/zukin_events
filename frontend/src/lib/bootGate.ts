/**
 * One-shot signal for "the boot veil has lifted".
 *
 * The hero's intro film must not start playing behind the white veil — the
 * visitor would miss its first second. The veil resolves this promise as it
 * begins to fade; the intro awaits it. On SPA navigations (no veil) the
 * promise is already resolved, so nothing waits.
 */
let resolveBoot: () => void = () => {}
let settled = false

export const bootDone: Promise<void> = new Promise((resolve) => {
  resolveBoot = () => {
    settled = true
    resolve()
  }
})

export function markBootDone(): void {
  if (!settled) resolveBoot()
}
