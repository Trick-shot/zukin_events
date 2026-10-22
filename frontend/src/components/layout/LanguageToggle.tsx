import { useTranslation } from 'react-i18next'

import { SUPPORTED_LANGUAGES, type Language } from '@/i18n'
import { cn } from '@/lib/cn'

/**
 * The "EN | SW" switch from the design.
 *
 * Built as a radio group rather than two buttons: the two options are one
 * mutually exclusive choice, so screen readers should announce "1 of 2" and
 * arrow keys should move between them. `aria-checked` carries the state that
 * colour alone conveys visually.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { i18n, t } = useTranslation()
  const current = (i18n.resolvedLanguage ?? 'en') as Language

  return (
    <div role="radiogroup" aria-label={t('a11y.language')} className={cn('flex items-center', className)}>
      {SUPPORTED_LANGUAGES.map((lng, index) => (
        <span key={lng} className="flex items-center">
          {index > 0 && (
            <span aria-hidden="true" className="px-2 opacity-40">
              |
            </span>
          )}
          <button
            type="button"
            role="radio"
            aria-checked={current === lng}
            onClick={() => void i18n.changeLanguage(lng)}
            className={cn(
              'rounded-sm text-sm font-medium uppercase transition-opacity',
              current === lng ? 'opacity-100' : 'opacity-55 hover:opacity-80',
            )}
          >
            {lng}
          </button>
        </span>
      ))}
    </div>
  )
}
