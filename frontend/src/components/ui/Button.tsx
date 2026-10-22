import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import { Link } from 'react-router'

import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'outline' | 'outline-light' | 'ghost'
export type ButtonSize = 'md' | 'lg'

/**
 * Every call to action in the design is a pill. Only three things change:
 * the fill, the border, and whether it sits on cream or on plum. Encoding
 * that as variants keeps `rounded-pill` and the padding scale in exactly one
 * place, so a later tweak to button height cannot drift between sections.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-red text-white hover:bg-red/90 active:bg-red/95',
  outline: 'border-[1.5px] border-ink/25 text-ink hover:border-ink/50 hover:bg-ink/5',
  'outline-light': 'border-[1.5px] border-white text-white hover:bg-white/10',
  ghost: 'text-ink hover:bg-ink/5',
}

const SIZES: Record<ButtonSize, string> = {
  md: 'px-7 py-4 text-[15px]',
  lg: 'px-8 py-4 text-base',
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-pill font-semibold leading-none ' +
  'transition-colors duration-150 whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none'

type BaseProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: ReactNode
}

type ButtonAsButton = BaseProps &
  Omit<ComponentPropsWithoutRef<'button'>, keyof BaseProps> & { as?: 'button' }

type ButtonAsLink = BaseProps &
  Omit<ComponentPropsWithoutRef<'a'>, keyof BaseProps> & { as: 'a'; href: string }

type ButtonAsRouterLink = BaseProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, keyof BaseProps> & { as: 'link'; to: string }

export type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsRouterLink

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', className, children, ...rest } = props
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className)

  if (rest.as === 'link') {
    const { as: _as, ...linkProps } = rest
    return (
      <Link {...linkProps} className={classes}>
        {children}
      </Link>
    )
  }

  if (rest.as === 'a') {
    const { as: _as, ...anchorProps } = rest
    return (
      <a {...anchorProps} className={classes}>
        {children}
      </a>
    )
  }

  const { as: _as, type, ...buttonProps } = rest as ButtonAsButton & { as?: ElementType }
  return (
    <button {...buttonProps} type={type ?? 'button'} className={classes}>
      {children}
    </button>
  )
}
