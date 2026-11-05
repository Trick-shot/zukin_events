import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import { Link } from 'react-router'

import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'outline' | 'outline-light' | 'dark' | 'ghost'
export type ButtonSize = 'md' | 'lg'

/**
 * v3 buttons are near-square (2px radius) with a small tracking, after the
 * Figma Button component (86:53). Primary is the sign red and is the only
 * saturated action colour on any screen; `dark` is the wine fill used on the
 * two wine bands.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-red text-white hover:bg-red-dark active:bg-red-dark',
  outline: 'border border-ink/30 text-ink hover:border-ink/60 hover:bg-ink/5',
  'outline-light': 'border border-white/70 text-white hover:bg-white/10',
  dark: 'bg-wine-900 text-white hover:bg-wine-800',
  ghost: 'text-ink hover:bg-ink/5',
}

const SIZES: Record<ButtonSize, string> = {
  md: 'h-11 px-6 text-[15px]',
  lg: 'h-13 px-7 text-[15px]',
}

const BASE =
  'inline-flex items-center justify-center gap-2.5 rounded-xs font-semibold leading-none tracking-[0.02em] ' +
  'transition-colors duration-150 whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none'

type BaseProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: ReactNode
  /**
   * Async-action state: shows a spinner before the label and disables the
   * button. The label should already say what is happening ("Sending…").
   * Kept on the button (not a page overlay) so the visitor never loses the
   * form they just filled in.
   */
  loading?: boolean
}

type ButtonAsButton = BaseProps &
  Omit<ComponentPropsWithoutRef<'button'>, keyof BaseProps> & { as?: 'button' }

type ButtonAsLink = BaseProps &
  Omit<ComponentPropsWithoutRef<'a'>, keyof BaseProps> & { as: 'a'; href: string }

type ButtonAsRouterLink = BaseProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, keyof BaseProps> & { as: 'link'; to: string }

export type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsRouterLink

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', className, children, loading = false, ...rest } = props
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className)
  const content = (
    <>
      {loading ? <Spinner className="size-4" /> : null}
      {children}
    </>
  )

  if (rest.as === 'link') {
    const { as: _as, ...linkProps } = rest
    return (
      <Link {...linkProps} className={classes} aria-busy={loading || undefined}>
        {content}
      </Link>
    )
  }

  if (rest.as === 'a') {
    const { as: _as, ...anchorProps } = rest
    return (
      <a {...anchorProps} className={classes} aria-busy={loading || undefined}>
        {content}
      </a>
    )
  }

  const { as: _as, type, disabled, ...buttonProps } = rest as ButtonAsButton & { as?: ElementType }
  return (
    <button
      {...buttonProps}
      type={type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
    >
      {content}
    </button>
  )
}
