/**
 * Join class names, dropping anything falsy.
 *
 * Deliberately not `clsx` + `tailwind-merge`: with tokens in `@theme` we write
 * few conditional classes, and two dependencies to concatenate strings is not a
 * trade worth making. Revisit if variant-heavy components start fighting over
 * the same utility.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
