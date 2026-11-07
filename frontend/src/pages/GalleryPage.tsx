import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { PageHeading } from '@/components/ui/PageHeading'
import { Photo } from '@/components/ui/Photo'
import { GALLERY_COLUMNS } from '@/content/site'
import { pageTitle, usePageMeta } from '@/hooks/usePageMeta'

/**
 * /gallery — a dominant feature image, then the three-column masonry, with a
 * lightbox (Figma 93:1192 / 93:1323 / overlay 93:1440). Filters arrive with
 * real event photos; today every image is of the hall itself, so a filter row
 * would be pretending to have categories it does not.
 */
export function GalleryPage() {
  usePageMeta(pageTitle('Gallery'), 'Real photographs taken at Zukin Hall in Dodoma, nothing staged elsewhere and nothing rendered.')
  const flat = useMemo(() => GALLERY_COLUMNS.flat(), [])
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const close = useCallback(() => setOpenIndex(null), [])
  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) =>
        current === null ? null : (current + delta + flat.length) % flat.length,
      )
    },
    [flat.length],
  )

  useEffect(() => {
    if (openIndex === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowLeft') step(-1)
      if (event.key === 'ArrowRight') step(1)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [openIndex, close, step])

  const open = openIndex === null ? null : flat[openIndex]

  return (
    <>
      <PageHeading
        crumb="Gallery"
        title="See Zukin Hall for yourself"
        intro="Real photos from the hall. Nothing staged elsewhere, nothing rendered."
      />

      <section aria-label="Photo gallery" className="bg-paper pb-24">
        <Container>
          <button
            type="button"
            onClick={() => setOpenIndex(flat.findIndex((item) => item.src === 'venue/stage_wide.jpg'))}
            className="block w-full overflow-hidden rounded-card"
            aria-label="Open photo: the stage, wide"
          >
            <Photo
              src="venue/stage_wide.jpg"
              alt="The decorated stage, seen across the hall"
              width={1920}
              height={760}
              priority
              className="aspect-[12/5] transition-transform duration-300 hover:scale-[1.01]"
            />
          </button>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
            {GALLERY_COLUMNS.map((column, columnIndex) => (
              <div key={columnIndex} className="flex flex-col gap-4">
                {column.map((item) => {
                  const index = flat.indexOf(item)
                  return (
                    <button
                      key={item.src}
                      type="button"
                      onClick={() => setOpenIndex(index)}
                      className="block overflow-hidden rounded-card"
                      aria-label={`Open photo: ${item.alt}`}
                    >
                      <Photo
                        src={item.src}
                        alt={item.alt}
                        width={860}
                        height={item.h * 2}
                        style={{ aspectRatio: `430 / ${item.h}` }}
                        className="transition-transform duration-300 hover:scale-[1.02]"
                      />
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-between gap-6 border-t border-line pt-10">
            <h2 className="text-2xl">Like what you see?</h2>
            <div className="flex gap-4">
              <Button as="link" to="/site-visit">
                Book a site visit
              </Button>
              <Button as="link" to="/book" variant="outline">
                Check your date
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Lightbox */}
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={open.alt}
          className="fixed inset-0 z-50 flex items-center justify-center bg-wine-900/95 p-4"
          onClick={close}
        >
          <img
            key={open.src}
            src={`/images/${open.src}`}
            alt={open.alt}
            className="max-h-[86vh] max-w-full rounded-card object-contain motion-safe:animate-[photo-fade_200ms_ease-out]"
            onClick={(event) => event.stopPropagation()}
          />
          <p className="absolute bottom-5 left-1/2 w-full max-w-xl -translate-x-1/2 px-6 text-center text-sm text-on-dark-muted">
            {open.alt} · {(openIndex ?? 0) + 1} / {flat.length}
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-5 right-5 rounded-pill p-2 text-white hover:bg-white/10"
          >
            <X size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              step(-1)
            }}
            aria-label="Previous photo"
            className="absolute left-3 rounded-pill p-2 text-white hover:bg-white/10"
          >
            <ChevronLeft size={26} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              step(1)
            }}
            aria-label="Next photo"
            className="absolute right-3 rounded-pill p-2 text-white hover:bg-white/10"
          >
            <ChevronRight size={26} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </>
  )
}
