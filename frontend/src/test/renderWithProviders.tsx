import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router'

import i18n from '@/i18n'

/**
 * Components under test need i18n (every string goes through `t`) and a router
 * (the booking bar navigates). Wrapping once here keeps that out of each test.
 */
export type ProviderRenderOptions = RenderOptions & {
  /** Router entries, for components that read the query string or params. */
  initialEntries?: string[]
}

export function renderWithProviders(ui: ReactElement, options?: ProviderRenderOptions) {
  const { initialEntries, ...renderOptions } = options ?? {}

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </I18nextProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

/** Force prefers-reduced-motion on or off for a test. */
export function mockReducedMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reduce : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}
