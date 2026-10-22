import { useTranslation } from 'react-i18next'

import { BrandMark } from '@/components/layout/BrandMark'
import { Container } from '@/components/layout/Container'
import { LanguageToggle } from '@/components/layout/LanguageToggle'

/** Columns match the Figma footer: Explore / Booking / Contact. */
const EXPLORE = [
  { key: 'nav.spaces', href: '#spaces' },
  { key: 'nav.events', href: '#events' },
  { key: 'nav.decoration', href: '#decoration' },
  { key: 'nav.gallery', href: '#gallery' },
] as const

const BOOKING = [
  { key: 'actions.checkAvailability', href: '#availability' },
  { key: 'actions.bookSiteVisit', href: '/book?mode=visit' },
  { key: 'actions.trackBooking', href: '/book?mode=track' },
] as const

// Real phone numbers and social handles are unknown, so these stay as inert
// placeholders rather than invented links. Milestone (e) wires them to the
// contact details once the owner supplies them.
const CONTACT = [
  'footer.call',
  'footer.whatsapp',
  'footer.instagram',
  'footer.facebook',
] as const

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="on-dark bg-plum-deep text-on-dark">
      <Container>
        <div className="flex flex-col gap-14 pt-16 pb-10 xl:pt-[72px]">
          <div className="flex flex-col gap-10 md:flex-row md:gap-10">
            <div className="flex flex-[2] flex-col items-start gap-4">
              <BrandMark size="md" />
              <p className="max-w-[300px] text-[15px] text-on-dark-muted">{t('brand.tagline')}</p>
            </div>

            <nav aria-label={t('a11y.footerNav')} className="flex flex-[3] flex-col gap-10 sm:flex-row">
              <FooterColumn title={t('footer.explore')}>
                {EXPLORE.map((item) => (
                  <FooterLink key={item.key} href={item.href}>
                    {t(item.key)}
                  </FooterLink>
                ))}
              </FooterColumn>

              <FooterColumn title={t('footer.booking')}>
                {BOOKING.map((item) => (
                  <FooterLink key={item.key} href={item.href}>
                    {t(item.key)}
                  </FooterLink>
                ))}
              </FooterColumn>

              <FooterColumn title={t('footer.contact')}>
                {CONTACT.map((key) => (
                  <li key={key} className="text-[15px] text-on-dark">
                    {t(key)}
                  </li>
                ))}
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
      <h2 className="eyebrow font-sans">{title}</h2>
      <ul className="mt-3.5 flex flex-col gap-3.5">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <a href={href} className="text-[15px] text-on-dark transition-opacity hover:opacity-75">
        {children}
      </a>
    </li>
  )
}
