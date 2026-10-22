import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/cn'

/**
 * The red two-line sign mark, which stands in for the venue's real logo.
 * Figma uses 13px/4px radius in the header and a slightly larger 15px/6px in
 * the footer, so size is a prop rather than two near-identical components.
 */
export function BrandMark({ size = 'sm', className }: { size?: 'sm' | 'md'; className?: string }) {
  const { t } = useTranslation()

  return (
    <span
      className={cn(
        'inline-flex flex-col items-start rounded-mark bg-red font-bold leading-none text-white',
        size === 'sm' ? 'gap-1 px-2.5 py-1.5 text-[13px]' : 'gap-1 px-3 py-1.5 text-[15px]',
        className,
      )}
    >
      <span>{t('brand.line1')}</span>
      <span>{t('brand.line2')}</span>
    </span>
  )
}
