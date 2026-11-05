import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { BrandMark } from '@/components/layout/BrandMark'
import { Container } from '@/components/layout/Container'
import { LanguageToggle } from '@/components/layout/LanguageToggle'
import { CONTACT } from '@/content/site'

/** Columns match the v3 Figma footer: Visit / Booking / Contact. */
const VISIT = [
  { key: 'nav.spaces', to: '/spaces' },
  { key: 'nav.decoration', to: '/decoration' },
  { key: 'nav.gallery', to: '/gallery' },
  { key: 'footer.terms', to: '/terms' },
] as const

const BOOKING = [
  { key: 'actions.checkDate', to: '/book' },
  { key: 'actions.bookSiteVisit', to: '/site-visit' },
  { key: 'actions.trackBooking', to: '/track' },
] as const

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="on-dark bg-wine-900 text-on-dark">
      <Container>
        <div className="flex flex-col gap-14 pt-16 pb-10 xl:pt-[72px]">
          <div className="flex flex-col gap-10 md:flex-row md:gap-10">
            <div className="flex flex-[2] flex-col items-start gap-4">
              <BrandMark size="md" />
              <p className="max-w-[300px] text-[15px] text-on-dark-muted">{t('brand.tagline')}</p>
              <p className="max-w-[300px] text-sm text-on-dark-faint">{CONTACT.address}</p>
            </div>

            <nav
              aria-label={t('a11y.footerNav')}
              className="flex flex-[3] flex-col gap-10 sm:flex-row"
            >
              <FooterColumn title={t('footer.visit')}>
                {VISIT.map((item) => (
                  <FooterLink key={item.key} to={item.to}>
                    {t(item.key)}
                  </FooterLink>
                ))}
              </FooterColumn>

              <FooterColumn title={t('footer.booking')}>
                {BOOKING.map((item) => (
                  <FooterLink key={item.key} to={item.to}>
                    {t(item.key)}
                  </FooterLink>
                ))}
              </FooterColumn>

              {/* Real numbers are pending, so these stay inert values rather
                  than invented tel:/wa.me links. */}
              <FooterColumn title={t('footer.contact')}>
                <li className="text-[15px] text-on-dark">{CONTACT.phone}</li>
                <li className="text-[15px] text-on-dark">{CONTACT.email}</li>
                <li className="text-[15px] text-on-dark-muted">{CONTACT.hours}</li>
              </FooterColumn>
            </nav>
          </div>

          <div className="flex flex-col gap-4 border-t border-white/12 pt-6 text-[13px] text-on-dark-faint sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span>{t('footer.copyright')}</span>
              <span aria-hidden="true">·</span>
              <LanguageToggle />
            </div>
            <p>{t('footer.builtBy')}</p>
          </div>
        </div>
      </Container>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex-1">
      <h2 className="text-[12px] font-semibold tracking-[0.14em] text-on-dark-faint uppercase">
        {title}
      </h2>
      <ul className="mt-3.5 flex flex-col gap-3.5">{children}</ul>
    </div>
  )
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="text-[15px] text-on-dark transition-opacity hover:opacity-75">
        {children}
      </Link>
    </li>
  )
}
