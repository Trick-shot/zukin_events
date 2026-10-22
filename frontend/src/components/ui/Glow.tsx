import { cn } from '@/lib/cn'

export type GlowProps = {
  /** pink reads on cream sections, magenta on plum ones. */
  tone?: 'pink' | 'magenta'
  size?: number
  className?: string
}

/**
 * The soft radial bloom behind most sections (Figma calls these "Glow"
 * ellipses, 700-900px across).
 *
 * Rendered as a blurred radial-gradient div rather than an exported PNG:
 * it costs no bytes, scales to any viewport, and recolours from tokens.
 * Always decorative, so it is hidden from assistive tech and never
 * intercepts a pointer.
 */
export function Glow({ tone = 'pink', size = 700, className }: GlowProps) {
  const color = tone === 'pink' ? 'var(--color-pink)' : 'var(--color-magenta)'

  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, color-mix(in oklab, ${color} 55%, transparent) 0%, transparent 70%)`,
      }}
      className={cn('pointer-events-none absolute -z-10 rounded-full blur-3xl', className)}
    />
  )
}
