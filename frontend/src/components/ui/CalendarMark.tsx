import { Lottie } from 'lottie-react'

import calendarAnimation from '@/assets/lottie/zukin-calendar.json'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/cn'

/**
 * The brand calendar animation (IconScout, recoloured to the Zukin palette)
 * for date moments: the availability check in the booking flow and the site
 * visit picker. Loops while `busy` (a date is being checked), otherwise
 * plays once and rests. Under reduced motion it renders without playing.
 */
export function CalendarMark({ busy = false, className }: { busy?: boolean; className?: string }) {
  const reducedMotion = useReducedMotion()

  return (
    <Lottie
      src={calendarAnimation}
      loop={busy}
      autoplay={!reducedMotion}
      aria-hidden="true"
      className={cn('size-16', className)}
    />
  )
}
