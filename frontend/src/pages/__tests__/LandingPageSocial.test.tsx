import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The hero owns a canvas, a manifest fetch and a scroll-pinned rAF loop, none
 * of which this suite is about. Stubbing it keeps the social section the only
 * thing under test; src/features/hero is untouched.
 */
vi.mock('@/features/hero/HeroSection', () => ({
  HeroSection: () => <div data-testid="hero-stub" />,
}))

import { SOCIAL } from '@/content/site'
import { LandingPage } from '@/pages/LandingPage'
import { mockReducedMotion, renderWithProviders } from '@/test/renderWithProviders'

const REELS = [
  { file: 'sofa', label: /gold sofa/i },
  { file: 'team', label: /zukin crew/i },
  { file: 'ballroom', label: /wine drapery/i },
]

let observed: Element[] = []

function stubIntersectionObserver() {
  observed = []
  class FakeObserver {
    constructor(_cb: unknown) {}
    observe(el: Element) {
      observed.push(el)
    }
    disconnect() {}
    unobserve() {}
    takeRecords() {
      return []
    }
    root = null
    rootMargin = ''
    thresholds = []
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver)
}

beforeEach(() => {
  mockReducedMotion(false)
  stubIntersectionObserver()
  // jsdom implements no media playback; without this, ReelTile's
  // video.play() throws instead of returning a promise.
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

/** The social section, found by its heading rather than by DOM position. */
function socialSection(): HTMLElement {
  const heading = screen.getByRole('heading', { name: 'Their events, as they happen.' })
  const section = heading.closest('section')
  if (!section) throw new Error('social section not found')
  return section
}

describe('LandingPage social section', () => {
  it('renders the heading', () => {
    renderWithProviders(<LandingPage />)

    expect(
      screen.getByRole('heading', { name: 'Their events, as they happen.' }),
    ).toBeInTheDocument()
  })

  it('renders the three reels with their own file and poster', () => {
    const { container } = renderWithProviders(<LandingPage />)

    const videos = [...container.querySelectorAll('video')]
    expect(videos).toHaveLength(REELS.length)

    for (const reel of REELS) {
      const video = videos.find((v) => v.getAttribute('src') === `/videos/social/${reel.file}.mp4`)
      expect(video, `video for ${reel.file}`).toBeDefined()
      expect(video).toHaveAttribute('poster', `/videos/social/${reel.file}.jpg`)
      // Muted and looping, or a wall of sound greets the visitor.
      expect(video).toHaveAttribute('loop')
      expect(video).toHaveAttribute('playsinline')
    }
  })

  it('wraps every reel in a link to the profile, described by what it shows', () => {
    renderWithProviders(<LandingPage />)
    const section = socialSection()

    for (const reel of REELS) {
      const link = within(section).getByRole('link', { name: reel.label })
      expect(link).toHaveAttribute('href', SOCIAL.instagramUrl)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
    }
  })

  it('shows the live profile stats', () => {
    renderWithProviders(<LandingPage />)
    const section = socialSection()

    expect(within(section).getByText(SOCIAL.followers)).toBeInTheDocument()
    expect(within(section).getByText(SOCIAL.posts)).toBeInTheDocument()
    // The handle appears twice: once as a stat, once in the reshare line.
    expect(within(section).getAllByText(SOCIAL.instagramHandle).length).toBeGreaterThan(0)
  })

  it('renders the "More on Instagram" tile pointing at the profile', () => {
    renderWithProviders(<LandingPage />)
    const section = socialSection()

    const tile = within(section).getByRole('link', { name: /more on instagram/i })
    expect(tile).toHaveAttribute('href', SOCIAL.instagramUrl)
    expect(tile).toHaveAttribute('target', '_blank')
  })

  it('offers a follow button alongside the tiles', () => {
    renderWithProviders(<LandingPage />)
    const section = socialSection()

    expect(within(section).getByRole('link', { name: /follow on instagram/i })).toHaveAttribute(
      'href',
      SOCIAL.instagramUrl,
    )
  })

  it('plays the reels only while they are on screen', () => {
    const { container } = renderWithProviders(<LandingPage />)

    // Each reel registers its own observer rather than autoplaying on mount.
    const videos = [...container.querySelectorAll('video')]
    for (const video of videos) {
      expect(observed).toContain(video)
    }
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
  })

  it('under reduced motion it never observes or plays, and rests on the poster', () => {
    mockReducedMotion(true)
    const { container } = renderWithProviders(<LandingPage />)

    const videos = [...container.querySelectorAll('video')]
    expect(videos).toHaveLength(REELS.length)

    // The still poster frame is what the visitor sees, and nothing is
    // scheduled to replace it.
    for (const video of videos) {
      expect(video).toHaveAttribute('poster')
      expect(observed).not.toContain(video)
    }
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
  })
})
