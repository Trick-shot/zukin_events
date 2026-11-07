import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Reveal } from '@/components/ui/Reveal'
import { mockReducedMotion } from '@/test/renderWithProviders'

type ObserverCallback = (entries: Array<{ isIntersecting: boolean }>) => void

/**
 * Installs a controllable IntersectionObserver. jsdom ships none, so without
 * this every test exercises only the "no observer" fallback.
 */
function mockIntersectionObserver() {
  const disconnect = vi.fn()
  const observe = vi.fn()
  // Every Reveal constructs its own observer, so the callbacks are collected
  // rather than overwritten; with one shared slot only the last-rendered
  // element would ever fire.
  const callbacks: ObserverCallback[] = []

  class FakeObserver {
    constructor(callback: ObserverCallback) {
      callbacks.push(callback)
    }
    observe = observe
    disconnect = disconnect
    unobserve = vi.fn()
    takeRecords = vi.fn()
    root = null
    rootMargin = ''
    thresholds = []
  }

  vi.stubGlobal('IntersectionObserver', FakeObserver)

  return {
    observe,
    disconnect,
    enter: () => act(() => callbacks.forEach((cb) => cb([{ isIntersecting: true }]))),
    leave: () => act(() => callbacks.forEach((cb) => cb([{ isIntersecting: false }]))),
  }
}

/** The class that hides content before it is revealed. */
const HIDDEN = 'motion-safe:opacity-0'
const ANIMATING = 'motion-safe:animate-[rise-in_.5s_ease-out_both]'

afterEach(() => {
  vi.unstubAllGlobals()
  mockReducedMotion(false)
})

describe('Reveal', () => {
  it('reveals immediately when IntersectionObserver is unavailable', () => {
    // The guarantee that matters most: content is never left hidden because
    // an API the browser does not implement never fired.
    render(<Reveal>Two rooms</Reveal>)

    const block = screen.getByText('Two rooms')
    expect(block).toHaveClass(ANIMATING)
    expect(block).not.toHaveClass(HIDDEN)
  })

  it('reveals immediately under reduced motion, without observing', () => {
    mockReducedMotion(true)
    const observer = mockIntersectionObserver()

    render(<Reveal>Booking is four steps</Reveal>)

    expect(screen.getByText('Booking is four steps')).not.toHaveClass(HIDDEN)
    expect(observer.observe).not.toHaveBeenCalled()
  })

  it('starts hidden, then animates once it scrolls into view', () => {
    const observer = mockIntersectionObserver()

    render(<Reveal>Come and see the hall</Reveal>)
    const block = screen.getByText('Come and see the hall')

    expect(block).toHaveClass(HIDDEN)
    expect(observer.observe).toHaveBeenCalled()

    observer.enter()

    expect(block).toHaveClass(ANIMATING)
    expect(block).not.toHaveClass(HIDDEN)
    expect(observer.disconnect).toHaveBeenCalled()
  })

  it('never un-reveals, so scrolling back up cannot blank a section', () => {
    const observer = mockIntersectionObserver()

    render(<Reveal>Find us in Dodoma</Reveal>)
    observer.enter()
    observer.leave()

    expect(screen.getByText('Find us in Dodoma')).not.toHaveClass(HIDDEN)
  })

  it('hides only behind motion-safe, so reduced motion never depends on JS', () => {
    // Belt and braces: even if the observer never fires, the hiding class is
    // gated on motion-safe, so a reduced-motion user sees the content.
    mockIntersectionObserver()
    render(<Reveal>Quiet</Reveal>)

    expect(screen.getByText('Quiet').className).toContain('motion-safe:')
    expect(screen.getByText('Quiet').className).not.toMatch(/(^|\s)opacity-0(\s|$)/)
  })

  it('renders the tag it is told to, so markup stays semantic', () => {
    render(
      <ol>
        <Reveal as="li">Check your date</Reveal>
      </ol>,
    )

    expect(screen.getByText('Check your date').tagName).toBe('LI')
  })

  it('staggers siblings with an animation delay, and leaves lone blocks unset', () => {
    const observer = mockIntersectionObserver()
    render(
      <>
        <Reveal delay={2}>Second space</Reveal>
        <Reveal>Main hall</Reveal>
      </>,
    )
    observer.enter()

    // Asserted on the inline value rather than toHaveStyle: jsdom computes no
    // animation longhands, so toHaveStyle reports it as unset either way.
    expect((screen.getByText('Second space') as HTMLElement).style.animationDelay).toBe('140ms')
    expect(screen.getByText('Main hall')).not.toHaveAttribute('style')
  })
})
