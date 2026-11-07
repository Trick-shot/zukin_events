import { useTranslation } from 'react-i18next'

import { Container } from '@/components/layout/Container'
import { Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/Button'
import { pageTitle, usePageMeta } from '@/hooks/usePageMeta'

export function NotFoundPage() {
  usePageMeta(pageTitle('Page not found'), 'That page does not exist at Zukin Hall. Try the spaces, the gallery or contact reception.')
  const { t } = useTranslation()

  return (
    <Section tone="cream" className="pt-40 pb-28" labelledBy="notfound-heading">
      <Container>
        <h1 id="notfound-heading" className="text-4xl xl:text-5xl">
          {t('notFound.title')}
        </h1>
        <p className="mt-4 text-muted">{t('notFound.body')}</p>
        <Button as="link" to="/" variant="outline" className="mt-8">
          {t('notFound.backHome')}
        </Button>
      </Container>
    </Section>
  )
}
