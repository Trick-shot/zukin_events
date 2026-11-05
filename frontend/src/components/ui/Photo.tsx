import { useState } from 'react'

import { cn } from '@/lib/cn'

export type PhotoProps = {
  /** File name inside /public/images, e.g. "venue/hall_tables.jpg". */
  src: string
  /** Empty string marks the image as decorative; it is then hidden from AT. */
  alt: string
  width: number
  height: number
  className?: string
  /** Escape hatch for per-instance aspect ratios (gallery masonry). */
  style?: React.CSSProperties
  /** The hero is above the fold; everything else stays lazy. */
  priority?: boolean
  /** Label shown when the file is missing, e.g. "[ Photo: Main hall ]". */
  placeholderLabel?: string
}

/**
 * One image component for the whole site.
 *
 * Some photos will be swapped when the owner sends new shots. Rather than
 * let a 404 render a broken-image glyph, we catch `onError` and fall back to
 * a quiet sand block — so a missing file looks deliberate instead of broken.
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
  style,
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
        style={{ aspectRatio: `${width} / ${height}`, ...style }}
        className={cn(
          'relative isolate flex size-full items-end overflow-hidden bg-sand',
          className,
        )}
      >
        {placeholderLabel ? (
          <span className="p-5 text-[11px] tracking-wide text-subtle">
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
      style={style}
      className={cn('size-full object-cover', className)}
    />
  )
}
