import { Menu, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'

import { BrandMark } from '@/components/layout/BrandMark'
import { Container } from '@/components/layout/Container'
import { LanguageToggle } from '@/components/layout/LanguageToggle'
import { Button } from '@/components/ui/Button'
import { useScrolledPast } from '@/hooks/useScrolledPast'
import { cn } from '@/lib/cn'

/** Nav target ids. Sections claim these as they are built in later milestones. */
const NAV_ITEMS = [
  { key: 'spaces', href: '#spaces' },
  { key: 'events', href: '#events' },
  { key: 'decoration', href: '#decoration' },
  { key: 'gallery', href: '#gallery' },
  { key: 'availability', href: '#availability' },
  { key: 'contact', href: '#location' },
] as const

export function Header() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()

  // Figma only draws the header over the dark hero, where white text reads
  // fine. Past the hero the page turns cream and white would vanish, so the
  // bar fades to an opaque cream state. The design has no artwork for this —
  // see the assumptions note in the PR.
  const scrolled = useScrolledPast(120)

  // Only the landing page has a dark hero to sit on. /book and /404 start on
  // cream, so the transparent white state would be invisible there.
  const onLanding = pathname === '/'
  const overHero = onLanding

  // In-page anchors only resolve on the landing page. From /book or a 404 the
  // same link has to go home first, so prefix it there.
  const hrefFor = (hash: string) => (onLanding ? hash : `/${hash}`)

  // Close the mobile menu on Escape and whenever the viewport grows past the
  // breakpoint where the full nav reappears.
  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    const desktop = window.matchMedia('(min-width: 64rem)')
    const onChange = () => {
      if (desktop.matches) setMenuOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    desktop.addEventListener('change', onChange)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      desktop.removeEventListener('change', onChange)
    }
  }, [menuOpen])

  const onDark = overHero && !scrolled

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        onDark ? 'on-dark text-white' : 'bg-cream/95 text-ink shadow-sm backdrop-blur-md',
      )}
    >
      <Container>
        <div className="flex items-center justify-between py-5 xl:py-[30px]">
          <a href={onLanding ? '#top' : '/'} className="shrink-0" aria-label={t('brand.name')}>
            <BrandMark />
          </a>

          <nav
            aria-label={t('a11y.mainNav')}
            className="hidden items-center gap-9 lg:flex"
          >
            {NAV_ITEMS.map((item) => (
              <a
                key={item.key}
                href={hrefFor(item.href)}
                className="text-[15px] font-medium transition-opacity hover:opacity-70"
              >
                {t(`nav.${item.key}`)}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4 xl:gap-[22px]">
            <LanguageToggle className="hidden sm:flex" />
            <Button
              as="a"
              href={hrefFor('#availability')}
              variant={onDark ? 'outline-light' : 'outline'}
              className="hidden sm:inline-flex"
            >
              {t('actions.checkAvailability')}
            </Button>

            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={t('a11y.mainNav')}
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-pill p-2 lg:hidden"
            >
              {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile panel. There is no mobile design yet, so this is a plain
          stacked list in the plum tone rather than an invented drawer. */}
      <div
        id={menuId}
        hidden={!menuOpen}
        className="on-dark border-t border-white/10 bg-plum text-on-dark lg:hidden"
      >
        <Container>
          <nav aria-label={t('a11y.mainNav')} className="flex flex-col py-4">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.key}
                href={hrefFor(item.href)}
                onClick={() => setMenuOpen(false)}
                className="py-3 text-base font-medium"
              >
                {t(`nav.${item.key}`)}
              </a>
            ))}
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-5">
              <LanguageToggle />
              <Button as="a" href={hrefFor('#availability')} variant="outline-light" onClick={() => setMenuOpen(false)}>
                {t('actions.checkAvailability')}
              </Button>
            </div>
          </nav>
        </Container>
      </div>
    </header>
  )
}
