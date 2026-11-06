import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { Container } from '@/components/layout/Container'

/**
 * The standard inner-page opening: breadcrumb, Fraunces title, optional
 * intro. No decorative kicker above the title — v3 killed the eyebrow there.
 * Top padding clears the fixed header.
 */
export function PageHeading({
  crumb,
  title,
  intro,
  children,
}: {
  crumb: string
  title: string
  intro?: string
  children?: ReactNode
}) {
  const rise = (delay: number) =>
    ({
      animationDelay: `${delay}ms`,
    }) as const

  return (
    <div className="pt-28 pb-10 xl:pt-36 xl:pb-14">
      <Container>
        <nav
          aria-label="Breadcrumb"
          style={rise(0)}
          className="flex items-center gap-1.5 text-sm text-subtle motion-safe:animate-[rise-in_.45s_ease-out_both]"
        >
          <Link to="/" className="transition-colors hover:text-ink">
            Home
          </Link>
          <ChevronRight size={13} aria-hidden="true" />
          <span aria-current="page" className="text-muted">
            {crumb}
          </span>
        </nav>
        <h1
          style={rise(70)}
          className="mt-5 max-w-4xl text-4xl leading-[1.08] motion-safe:animate-[rise-in_.45s_ease-out_both] sm:text-5xl xl:text-[42px]"
        >
          {title}
        </h1>
        {intro ? (
          <p
            style={rise(140)}
            className="mt-4 max-w-2xl text-lg text-muted motion-safe:animate-[rise-in_.45s_ease-out_both]"
          >
            {intro}
          </p>
        ) : null}
        {children}
      </Container>
    </div>
  )
}
