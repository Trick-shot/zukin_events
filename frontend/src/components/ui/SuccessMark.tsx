import { Lottie } from 'lottie-react'

import ringsAnimation from '@/assets/lottie/zukin-rings.json'
import successAnimation from '@/assets/lottie/zukin-success.json'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/cn'

const ANIMATIONS = {
  /** Check draw — request sent, site visit booked. Plays once, ~1.2s, freezes. */
  success: successAnimation,
  /** Interlocked rings — booking confirmed. Plays once on first view. */
  rings: ringsAnimation,
} as const

/**
 * The one-shot celebration mark for success screens. Never loops (a looping
 * success reads as a stuck spinner), never confetti. Under reduced motion it
 * renders without playing.
 */
export function SuccessMark({
  kind = 'success',
  className,
}: {
  kind?: keyof typeof ANIMATIONS
  className?: string
}) {
  const reducedMotion = useReducedMotion()

  return (
    <Lottie
      src={ANIMATIONS[kind]}
      loop={false}
      autoplay={!reducedMotion}
      aria-hidden="true"
      className={cn('size-20', className)}
    />
  )
}
