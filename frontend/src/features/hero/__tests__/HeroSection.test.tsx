import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HeroSection } from '@/features/hero/HeroSection'
import { mockReducedMotion, renderWithProviders } from '@/test/renderWithProviders'

const MANIFEST = {
  frames: 165,
  scrub: { from: 1, to: 162 },
  pattern: 'f_%04d.webp',
  folders: { desktop: 'd', mobile: 'm' },
  beats: [
    { from: 1, to: 26, caption: 'Arrive' },
    { from: 27, to: 53, caption: 'The venue' },
    { from: 54, to: 62, caption: 'Zukin Hall' },
    { from: 63, to: 80, caption: 'Step inside' },
    { from: 81, to: 107, caption: 'The hall' },
    { from: 108, to: 135, caption: 'Made for the day' },
    { from: 136, to: 162, caption: 'Book your date' },
  ],
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(MANIFEST) })),
  )
  // jsdom never fires load/error on Image, so frames stay undecoded. That is
  // the honest "sequence has not arrived yet" state and is what we assert the
  // hero stays usable in.
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('HeroSection under prefers-reduced-motion', () => {
  beforeEach(() => mockReducedMotion(true))

  it('does not pin: the section gets no tall inline height', async () => {
    const { container } = renderWithProviders(<HeroSection />)
    await waitFor(() => expect(screen.getByText('Arrive')).toBeInTheDocument())

    const section = container.querySelector('#hero') as HTMLElement
    expect(section.style.height).toBe('')
  })

  it('shows every caption at once, as real text', async () => {
    renderWithProviders(<HeroSection />)
    await waitFor(() => expect(screen.getByText('Arrive')).toBeInTheDocument())

    // Scoped to the caption list: "Zukin Hall" is also a beat, the brand name
    // bottom-left and the screen-reader heading, so a bare text query is
    // ambiguous by design rather than by accident.
    const items = screen.getAllByRole('listitem').map((node) => node.textContent)
    expect(items).toEqual(MANIFEST.beats.map((beat) => beat.caption))
  })

  it('leaves the booking bar reachable rather than hidden behind the scroll', async () => {
    renderWithProviders(<HeroSection />)
    await waitFor(() => expect(screen.getByText('Arrive')).toBeInTheDocument())

    const bar = document.getElementById('booking-bar')
    expect(bar).toBeInTheDocument()
    expect(bar?.closest('[aria-hidden="true"]')).toBeNull()
  })
})

describe('HeroSection with motion allowed', () => {
  beforeEach(() => mockReducedMotion(false))

  it('pins the section to 450vh', async () => {
    const { container } = renderWithProviders(<HeroSection />)
    await waitFor(() =>
      expect((container.querySelector('#hero') as HTMLElement).style.height).toBe('450vh'),
    )
  })

  it('gives the canvas an accessible description of the walkthrough', async () => {
    renderWithProviders(<HeroSection />)
    await waitFor(() => {
      const canvas = screen.getByRole('img', { name: /walkthrough of Zukin Hall/i })
      expect(canvas.tagName).toBe('CANVAS')
    })
  })

  it('keeps a real heading for screen readers even though the visual is a canvas', async () => {
    renderWithProviders(<HeroSection />)
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Zukin Hall/i),
    )
  })
})

describe('HeroSection when the manifest fails', () => {
  beforeEach(() => {
    mockReducedMotion(false)
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 404 })))
  })

  it('refuses to pin, so a broken sequence cannot become a scroll trap', async () => {
    const { container } = renderWithProviders(<HeroSection />)

    await waitFor(() => expect(screen.getByText(/could not load/i)).toBeInTheDocument())
    expect((container.querySelector('#hero') as HTMLElement).style.height).toBe('')
  })
})
