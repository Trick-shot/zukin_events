import { cn } from '@/lib/cn'

/**
 * Two interlocked wedding rings as thin outlines — the same mark as the
 * zukin-rings Lottie, drawn at architectural scale for the wine bands.
 * Pure decoration is banned here, but this is iconography the brand already
 * owns (confirmed bookings get the rings); at 4% white it reads as embossing,
 * not ornament. Hidden from AT, clipped by the section, never above content.
 */
export function RingsMotif({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 560 420"
      className={cn('pointer-events-none absolute text-white/[0.045]', className)}
      fill="none"
    >
      <circle cx="220" cy="210" r="170" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="350" cy="210" r="170" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  )
}
