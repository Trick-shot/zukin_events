import { Check } from 'lucide-react'

import { cn } from '@/lib/cn'

/**
 * The booking flow's progress, after the Figma Step component (86:212):
 * Done / Current / Upcoming, each a number + label. Done swaps the number for
 * a check, current is the sign red, upcoming is subtle.
 *
 * It is a `<nav>` with an ordered list rather than decoration: a visitor on
 * step 2 of 3 needs to know that from a screen reader too, hence the
 * per-step "completed"/"current" wording and `aria-current="step"`.
 *
 * Done steps are buttons when `onStepClick` is given, because the flow keeps
 * every earlier answer and going back is lossless. Upcoming steps are never
 * clickable — they would skip validation.
 */
export type StepState = 'done' | 'current' | 'upcoming'

export function StepIndicator({
  steps,
  current,
  onStepClick,
  className,
}: {
  steps: readonly string[]
  /** 0-based index of the current step. */
  current: number
  onStepClick?: (index: number) => void
  className?: string
}) {
  return (
    <nav aria-label="Booking progress" className={className}>
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {steps.map((label, index) => {
          const state: StepState =
            index < current ? 'done' : index === current ? 'current' : 'upcoming'
          const interactive = state === 'done' && onStepClick !== undefined

          const body = (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-pill text-[12px] font-semibold',
                  state === 'done' && 'bg-success-bg text-success',
                  state === 'current' && 'bg-red text-white',
                  state === 'upcoming' && 'border border-line text-subtle',
                )}
              >
                {state === 'done' ? <Check size={13} strokeWidth={3} /> : index + 1}
              </span>
              <span
                className={cn(
                  'text-[13px] font-medium',
                  state === 'current' ? 'text-ink' : 'text-muted',
                )}
              >
                {label}
              </span>
              {/* Spoken, not shown — the colour and the check carry it visually. */}
              <span className="sr-only">
                {state === 'done' ? ' (completed)' : state === 'current' ? ' (current step)' : ''}
              </span>
            </>
          )

          return (
            <li key={label} className="flex items-center gap-3">
              {interactive ? (
                <button
                  type="button"
                  onClick={() => onStepClick(index)}
                  className="flex items-center gap-2 rounded-xs hover:underline underline-offset-4"
                >
                  {body}
                </button>
              ) : (
                <span
                  className="flex items-center gap-2"
                  aria-current={state === 'current' ? 'step' : undefined}
                >
                  {body}
                </span>
              )}
              {index < steps.length - 1 ? (
                <span aria-hidden="true" className="h-px w-6 bg-line sm:w-10" />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
