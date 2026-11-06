import { AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

/**
 * The submission-failed banner: rose tint, red text, and whatever retry
 * control the caller passes. It never clears the form — the copy promises
 * "your details are still here", and the component holds the caller to it by
 * rendering above the form instead of replacing it.
 */
export function ErrorBanner({
  children,
  action,
  className,
}: {
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-3 rounded-sm bg-rose-tint px-4 py-3.5 text-sm text-red-dark',
        'motion-safe:animate-[rise-in_200ms_ease-out]',
        className,
      )}
    >
      <AlertCircle size={18} aria-hidden="true" className="shrink-0" />
      <p className="flex-1">{children}</p>
      {action}
    </div>
  )
}
