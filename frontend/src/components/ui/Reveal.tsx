import type { CSSProperties, ElementType, HTMLAttributes, ReactNode, Ref } from 'react'

import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/cn'

export type RevealProps = {
  children: ReactNode
  /** Tag to render, so the markup stays semantic. */
  as?: ElementType
  /**
   * Position among staggered siblings; each step adds 70ms. Use it for a row
   * of cards, not for consecutive sections — a page where everything is
   * staggered reads as slow, not considered.
   */
  delay?: number
  className?: string
} & Omit<HTMLAttributes<HTMLElement>, 'children' | 'className'>

/** One step of stagger. Short enough that three siblings still feel like one move. */
const STAGGER_MS = 70

/**
 * Rises content into view as it is scrolled to, using the same `rise-in`
 * keyframe as the inner-page entrance so the whole site moves one way.
 *
 * Wrap the content INSIDE a coloured band, never the band itself: fading a
 * section that carries its own background makes the sand and wine bands flash
 * white before they arrive.
 *
 * Never wrap anything containing a `position: fixed` or `sticky` descendant.
 * While animating, this element has a transform, which would become their
 * containing block.
 *
 * Reduced motion is handled by the `motion-safe:` prefixes rather than by JS:
 * when the user asks for less motion, neither the hiding class nor the
 * animation class applies, so the content is simply there.
 */
export function Reveal({ children, as, delay = 0, className, ...rest }: RevealProps) {
  const { ref, revealed } = useReveal()
  const Tag = (as ?? 'div') as ElementType

  return (
    <Tag
      ref={ref as Ref<HTMLElement>}
      className={cn(
        revealed
          ? 'motion-safe:animate-[rise-in_.5s_ease-out_both]'
          : // Hidden only while motion is welcome, so reduced motion never
            // depends on the observer firing to see the page.
            'motion-safe:opacity-0',
        className,
      )}
      style={
        revealed && delay ? ({ animationDelay: `${delay * STAGGER_MS}ms` } as CSSProperties) : undefined
      }
      {...rest}
    >
      {children}
    </Tag>
  )
}
