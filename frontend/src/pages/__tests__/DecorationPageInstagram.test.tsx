import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SOCIAL } from '@/content/site'
import { DecorationPage } from '@/pages/DecorationPage'
import { renderWithProviders } from '@/test/renderWithProviders'

/**
 * The post paths live in INSTAGRAM_SETS inside DecorationPage. They are not
 * exported, so they are restated here on purpose: if someone edits the list,
 * this test should fail and make them confirm the new links are real posts
 * rather than silently following along.
 */
const POSTS = [
  'p/De9j73KC6BQ',
  'p/DepfEGvC32K',
  'p/De48Q_eCOdX',
  'p/DepE73IC0Cl',
  'p/DemSFJWi3al',
  'p/DelJkMzC_uk',
  'p/DeuahJIClVF',
  'reel/DfUo7-7NnP8',
]

function instagramBand(): HTMLElement {
  const heading = screen.getByRole('heading', { name: 'Straight from their feed.' })
  const section = heading.closest('section')
  if (!section) throw new Error('instagram band not found')
  return section
}

describe('DecorationPage Instagram band', () => {
  it('renders the heading', () => {
    renderWithProviders(<DecorationPage />)

    expect(screen.getByRole('heading', { name: 'Straight from their feed.' })).toBeInTheDocument()
  })

  it('renders eight photos, each with real alt text', () => {
    renderWithProviders(<DecorationPage />)
    const band = instagramBand()

    const photos = within(band).getAllByRole('img')
    expect(photos).toHaveLength(8)
    for (const photo of photos) {
      expect(photo).toHaveAccessibleName()
      expect(photo.getAttribute('alt')).not.toBe('')
    }
  })

  it('links every photo to its own Instagram post', () => {
    const { container } = renderWithProviders(<DecorationPage />)
    const band = instagramBand()

    const postLinks = [...band.querySelectorAll('a')].filter((a) =>
      /instagram\.com\/(p|reel)\//.test(a.getAttribute('href') ?? ''),
    )
    expect(postLinks).toHaveLength(8)

    const hrefs = postLinks.map((a) => a.getAttribute('href'))
    for (const post of POSTS) {
      expect(hrefs).toContain(`https://www.instagram.com/${post}/`)
    }
    // Distinct posts, not the same link eight times.
    expect(new Set(hrefs).size).toBe(8)
    expect(container).toBeTruthy()
  })

  it('opens each post in a new tab without leaking the referrer', () => {
    renderWithProviders(<DecorationPage />)
    const band = instagramBand()

    const postLinks = [...band.querySelectorAll('a')].filter((a) =>
      /instagram\.com\/(p|reel)\//.test(a.getAttribute('href') ?? ''),
    )
    for (const link of postLinks) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link.getAttribute('rel')).toContain('noreferrer')
    }
  })

  it('offers the "See all posts" button with the live count', () => {
    renderWithProviders(<DecorationPage />)
    const band = instagramBand()

    const button = within(band).getByRole('link', { name: `See all ${SOCIAL.posts} posts` })
    expect(button).toHaveAttribute('href', SOCIAL.instagramUrl)
    expect(button).toHaveAttribute('target', '_blank')
  })
})
