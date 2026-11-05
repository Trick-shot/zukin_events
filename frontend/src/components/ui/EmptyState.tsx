import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

/**
 * The quiet no-result state (e.g. tracking lookup with no match). Plain text
 * on sand — calm, not cute: no illustration, no emoji. Appears in place of
 * the result it stands in for.
 */
export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-sm bg-sand px-6 py-7', className)}>
      <h3 className="font-sans text-base font-semibold">{title}</h3>
      {children ? <p className="mt-1.5 text-sm text-muted">{children}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
