import { Reveal } from '@/components/ui/Reveal'
import { KANGA_LINE } from '@/content/site'

/**
 * The kanga band: a narrow wine strip with a gold zig-zag border top and
 * bottom (after the kanga cloth motif in the Figma component 106:301) and the
 * Swahili welcome line. Swahili wording is flagged for native review.
 */
export function KangaBand() {
  const zigzag = {
    backgroundImage:
      'linear-gradient(135deg, var(--color-gold) 25%, transparent 25%), linear-gradient(225deg, var(--color-gold) 25%, transparent 25%)',
    backgroundSize: '12px 6px',
    backgroundRepeat: 'repeat-x',
  } as const

  return (
    <div className="on-dark bg-wine-800 text-on-dark">
      <div style={zigzag} className="h-1.5" aria-hidden="true" />
      <Reveal as="p" lang="sw" className="px-5 py-4 text-center font-display text-lg tracking-wide">
        {KANGA_LINE}
      </Reveal>
      <div style={{ ...zigzag, transform: 'scaleY(-1)' }} className="h-1.5" aria-hidden="true" />
    </div>
  )
}
