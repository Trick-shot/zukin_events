import type { BookingStatus } from '@/lib/mockBookings'
import { cn } from '@/lib/cn'

/**
 * Status badge matching the Figma component (86:183): tinted background,
 * darker text, no icon. One colour per meaning — green only ever means
 * confirmed/positive, amber means money or time pressure, blue means "in
 * someone's hands", neutral means over.
 */
const STYLES: Record<BookingStatus, { label: string; className: string }> = {
  requested: { label: 'Requested', className: 'bg-info-bg text-info' },
  under_review: { label: 'Under review', className: 'bg-info-bg text-info' },
  deposit_due: { label: 'Deposit due', className: 'bg-warning-bg text-warning' },
  confirmed: { label: 'Confirmed', className: 'bg-success-bg text-success' },
  completed: { label: 'Completed', className: 'bg-neutral-bg text-muted' },
  rejected: { label: 'Not available', className: 'bg-danger-bg text-red-dark' },
  expired: { label: 'Hold expired', className: 'bg-danger-bg text-red-dark' },
  cancelled: { label: 'Cancelled', className: 'bg-neutral-bg text-muted' },
}

export function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const style = STYLES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-xs px-2.5 py-1 text-[13px] font-semibold',
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  )
}
