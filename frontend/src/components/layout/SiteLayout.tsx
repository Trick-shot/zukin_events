import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'

/**
 * Header + main + footer for every public page.
 *
 * The two skip links are the first focusable things on the page. The second
 * one matters more than usual here: milestone (c) pins the hero across roughly
 * 400-500vh of scrolling, and a keyboard user must be able to reach the
 * booking bar without scrubbing through the whole sequence.
 */
export function SiteLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation()

  return (
    <div id="top" className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only rounded-pill bg-red px-5 py-3 text-white focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100"
      >
        {t('a11y.skipToContent')}
      </a>
      <a
        href="#booking-bar"
        className="sr-only rounded-pill bg-red px-5 py-3 text-white focus:not-sr-only focus:absolute focus:top-4 focus:left-48 focus:z-100"
      >
        {t('a11y.skipToBooking')}
      </a>

      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
