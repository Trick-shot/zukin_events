import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

/**
 * The gold uppercase label above every section heading. Rendered as <p> so it
 * never competes with the real heading in the document outline.
 */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('eyebrow', className)}>{children}</p>
}
