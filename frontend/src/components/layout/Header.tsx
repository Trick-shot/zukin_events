import { Menu, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useLocation } from 'react-router'

import { BrandMark } from '@/components/layout/BrandMark'
import { Container } from '@/components/layout/Container'
import { LanguageToggle } from '@/components/layout/LanguageToggle'
import { Button } from '@/components/ui/Button'
import { useOverDarkSection } from '@/hooks/useOverDarkSection'
import { cn } from '@/lib/cn'

/** v3: real routes, not landing anchors — every page owns its URL. */
const NAV_ITEMS = [
  { key: 'spaces', to: '/spaces' },
  { key: 'decoration', to: '/decoration' },
  { key: 'gallery', to: '/gallery' },
  { key: 'contact', to: '/contact' },
] as const

export function Header() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()

  // Over the landing hero the bar sits on photography and stays transparent
  // with white text; everywhere else (and past the hero) it is the v3 light
  // bar: white with a hairline. Tracked against the hero element, not a
  // scroll threshold, because the hero is pinned for several viewports.
  const overHero = useOverDarkSection('#hero', 80)
  const onLanding = pathname === '/'
  const onDark = onLanding && overHero

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

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        onDark
          ? 'on-dark text-white'
          : 'border-b border-line bg-paper/95 text-ink backdrop-blur-md',
      )}
    >
      <Container>
        <div className="flex items-center justify-between py-4 xl:py-5">
          <Link to="/" className="shrink-0" aria-label={t('brand.name')}>
            <BrandMark />
          </Link>

          <nav aria-label={t('a11y.mainNav')} className="hidden items-center gap-8 lg:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'text-[15px] font-medium transition-opacity hover:opacity-70',
                    isActive && !onDark && 'text-red',
                    isActive && onDark && 'underline underline-offset-8',
                  )
                }
              >
                {t(`nav.${item.key}`)}
              </NavLink>
            ))}
          </nav>

          {/* One action in the bar, the clearest one for a first-time
              visitor: Book venue. Tracking lives in the footer, the booking
              widget's own tab and the mobile menu — returning clients find
              it, new clients are never distracted from booking. */}
          <div className="flex items-center gap-4 xl:gap-5">
            <LanguageToggle className="hidden sm:flex" />
            <Button
              as="link"
              to="/book"
              variant={onDark ? 'outline-light' : 'primary'}
              className="hidden sm:inline-flex"
            >
              {t('actions.bookVenue')}
            </Button>

            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={t('a11y.mainNav')}
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-xs p-2 lg:hidden"
            >
              {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile panel: the v3 light bar continues, white with hairlines. */}
      <div
        id={menuId}
        hidden={!menuOpen}
        className="border-t border-line bg-paper text-ink lg:hidden"
      >
        <Container>
          <nav aria-label={t('a11y.mainNav')} className="flex flex-col py-3">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className="border-b border-line-soft py-3.5 text-base font-medium last:border-b-0"
              >
                {t(`nav.${item.key}`)}
              </NavLink>
            ))}
            <Link
              to="/track"
              onClick={() => setMenuOpen(false)}
              className="py-3.5 text-base font-medium text-muted"
            >
              {t('actions.trackBooking')}
            </Link>
            <div className="mt-2 flex items-center justify-between border-t border-line pt-4 pb-2">
              <LanguageToggle />
              <Button as="link" to="/book" onClick={() => setMenuOpen(false)}>
                {t('actions.bookVenue')}
              </Button>
            </div>
          </nav>
        </Container>
      </div>
    </header>
  )
}
