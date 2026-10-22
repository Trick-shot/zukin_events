import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

/**
 * 1280px of content inside 80px gutters reproduces the 1440 Figma frame
 * exactly. The gutter steps down to 20px on phones so the 360px base width
 * keeps a usable line length.
 */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-site px-5 md:px-10 xl:px-20', className)}>
      {children}
    </div>
  )
}
