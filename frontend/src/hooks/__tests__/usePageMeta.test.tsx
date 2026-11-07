import { render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { pageTitle, usePageMeta } from '@/hooks/usePageMeta'

function Page({ title, description }: { title: string; description: string }) {
  usePageMeta(title, description)
  return null
}

function descriptionTag() {
  return document.head.querySelector<HTMLMetaElement>('meta[name="description"]')
}

afterEach(() => {
  document.head.querySelectorAll('meta[name="description"]').forEach((tag) => tag.remove())
})

describe('pageTitle', () => {
  it('keeps the full sentence for the home page', () => {
    expect(pageTitle()).toBe('Zukin Hall | Event venue and decoration in Dodoma')
  })

  it('suffixes every other page', () => {
    expect(pageTitle('Gallery')).toBe('Gallery | Zukin Hall')
    expect(pageTitle('Book venue')).toBe('Book venue | Zukin Hall')
  })

  it('uses no dash, per the project copy rule', () => {
    for (const title of [pageTitle(), pageTitle('Spaces'), pageTitle('Track my booking')]) {
      expect(title).not.toMatch(/[—–]/)
    }
  })
})

describe('usePageMeta', () => {
  it('sets the document title', () => {
    render(<Page title="Gallery | Zukin Hall" description="Real photographs." />)

    expect(document.title).toBe('Gallery | Zukin Hall')
  })

  it('creates the description tag when the document has none', () => {
    expect(descriptionTag()).toBeNull()

    render(<Page title="A" description="Written from the page content." />)

    expect(descriptionTag()).not.toBeNull()
    expect(descriptionTag()).toHaveAttribute('content', 'Written from the page content.')
  })

  it('reuses the existing tag rather than stacking duplicates', () => {
    const existing = document.createElement('meta')
    existing.setAttribute('name', 'description')
    existing.setAttribute('content', 'from index.html')
    document.head.appendChild(existing)

    render(<Page title="A" description="from the route" />)

    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1)
    expect(descriptionTag()).toHaveAttribute('content', 'from the route')
  })

  it('updates both when the route changes', () => {
    const { rerender } = render(<Page title="Spaces | Zukin Hall" description="Two rooms." />)
    expect(document.title).toBe('Spaces | Zukin Hall')

    rerender(<Page title="Contact | Zukin Hall" description="Talk to reception." />)

    expect(document.title).toBe('Contact | Zukin Hall')
    expect(descriptionTag()).toHaveAttribute('content', 'Talk to reception.')
  })
})
