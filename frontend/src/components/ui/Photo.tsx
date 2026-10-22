import { useState } from 'react'

import { cn } from '@/lib/cn'

export type PhotoProps = {
  /** File name inside /public/images, e.g. "space-main.jpg". */
  src: string
  /** Empty string marks the image as decorative; it is then hidden from AT. */
  alt: string
  width: number
  height: number
  className?: string
  /** The hero is above the fold; everything else stays lazy. */
  priority?: boolean
  /** Caption burned into the Figma mock, e.g. "[ Photo: Main hall ]". */
  placeholderLabel?: string
}

/**
 * One image component for the whole site.
 *
 * 13 of the 24 photos the brief names do not exist yet, and more will be
 * swapped when the owner sends real shots. Rather than let a 404 render a
 * broken-image glyph, we catch `onError` and fall back to the plum/magenta
 * gradient the Figma frame already uses for every unfilled photo slot — so a
 * missing file looks deliberate instead of broken.
 *
 * `width`/`height` are required, not optional: the aspect ratio they imply is
 * what stops the page shifting as images arrive, and the brief asks for no
 * layout shift.
 */
export function Photo({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholderLabel,
}: PhotoProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        style={{ aspectRatio: `${width} / ${height}` }}
        className={cn(
          'relative isolate flex size-full items-end overflow-hidden',
          'bg-[linear-gradient(135deg,var(--color-magenta)_0%,var(--color-plum)_55%,var(--color-plum-deep)_100%)]',
          className,
        )}
      >
        {placeholderLabel ? (
          <span className="p-5 text-[11px] tracking-wide text-on-dark-faint">
            {placeholderLabel}
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <img
      src={`/images/${src}`}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding={priority ? 'sync' : 'async'}
      onError={() => setFailed(true)}
      className={cn('size-full object-cover', className)}
    />
  )
}
