import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

export type SectionTone = 'cream' | 'plum' | 'plum-deep'

export type SectionProps = {
  id?: string
  tone?: SectionTone
  className?: string
  children: ReactNode
  /** Labels the landmark for screen readers; pass the id of its heading. */
  labelledBy?: string
}

/**
 * The page alternates two backgrounds: cream for the informational sections
 * and plum for the hero, decoration, CTA and footer. Centralising that here
 * means a section only declares its tone, and the matching text colours plus
 * the `on-dark` focus-ring switch come with it.
 *
 * `isolate` creates a stacking context so each section's Glow (-z-10) stays
 * behind its own content and never bleeds over the section above.
 */
const TONES: Record<SectionTone, string> = {
  cream: 'bg-cream text-ink',
  plum: 'on-dark bg-plum text-on-dark',
  'plum-deep': 'on-dark bg-plum-deep text-on-dark',
}

export function Section({ id, tone = 'cream', className, children, labelledBy }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn('relative isolate overflow-hidden', TONES[tone], className)}
    >
      {children}
    </section>
  )
}
