import { cn } from '@/lib/cn'

/**
 * The small inline spinner for buttons and quiet corners. A ring in
 * `currentColor`, so it reads white on red buttons and ink on white panels
 * without extra props. The full-page wait uses PageLoader (Lottie), not this.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block size-4 animate-spin rounded-pill border-2 border-current border-t-transparent',
        className,
      )}
    />
  )
}
