import type { ComponentPropsWithoutRef } from 'react'
import { useId } from 'react'

import { cn } from '@/lib/cn'

export type FieldProps = {
  label: string
  /** Error message; its presence switches the field to the error state. */
  error?: string
  /** Helper text below the input, shown when there is no error. */
  helper?: string
} & Omit<ComponentPropsWithoutRef<'input'>, 'id'>

/**
 * Text input after the Figma Input component (86:80): label above, hairline
 * border, red border + red helper in the error state. Validation is the
 * caller's job (on blur or on submit, never per keystroke); this component
 * just renders whichever state it is given.
 */
export function Field({ label, error, helper, className, ...inputProps }: FieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : helper ? `${id}-helper` : undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        {...inputProps}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'h-12 rounded-sm border bg-paper px-3.5 text-[15px] text-ink placeholder:text-subtle',
          'transition-colors focus:outline-none focus-visible:outline-2',
          error ? 'border-red' : 'border-line focus:border-ink/40',
        )}
      />
      {error ? (
        <p id={`${id}-error`} className="text-[13px] text-red-dark">
          {error}
        </p>
      ) : helper ? (
        <p id={`${id}-helper`} className="text-[13px] text-subtle">
          {helper}
        </p>
      ) : null}
    </div>
  )
}
