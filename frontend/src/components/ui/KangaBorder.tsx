import { cn } from '@/lib/cn'

/**
 * A kanga border strip (the pindo — the patterned band every real kanga
 * cloth carries along its edge). Alternating wine and bronze triangles over
 * a dotted baseline, sized and toned to read as a woven trim, not a banner.
 *
 * This is the "beautiful pattern" treatment for sand sections: bounded in a
 * strip the way the cloth itself bounds it, so it decorates the edge of a
 * section without turning the whole background into wallpaper.
 */
const TILE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='20'%3E%3Cpath d='M12 3 21 15 3 15Z' fill='%236e1630' fill-opacity='.5'/%3E%3Cpath d='M36 3 45 15 27 15Z' fill='%239a8c6f' fill-opacity='.55'/%3E%3Ccircle cx='12' cy='18' r='1.1' fill='%239a8c6f' fill-opacity='.6'/%3E%3Ccircle cx='36' cy='18' r='1.1' fill='%236e1630' fill-opacity='.5'/%3E%3C/svg%3E\")"

export function KangaBorder({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('w-full', className)}>
      <div
        style={{ backgroundImage: TILE, backgroundRepeat: 'repeat-x' }}
        className="h-5 w-full"
      />
      <div className="mt-1 h-px w-full bg-gold/40" />
    </div>
  )
}
