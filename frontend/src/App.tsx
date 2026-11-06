import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'

import { SiteLayout } from '@/components/layout/SiteLayout'
import { PageLoader } from '@/components/ui/PageLoader'
import { ToastProvider } from '@/components/ui/Toast'
import { LandingPage } from '@/pages/LandingPage'

/**
 * The landing page ships in the main bundle — the first visit must show the
 * hero immediately, never a loader. Every other page is its own chunk, so on
 * a slow connection the rose PageLoader (white screen, Lottie) covers the
 * wait. PageLoader itself only appears after 300ms, so on good connections
 * navigation stays instant with no flash.
 */
const SpacesPage = lazy(() => import('@/pages/SpacesPage').then((m) => ({ default: m.SpacesPage })))
const SpaceDetailPage = lazy(() =>
  import('@/pages/SpaceDetailPage').then((m) => ({ default: m.SpaceDetailPage })),
)
const DecorationPage = lazy(() =>
  import('@/pages/DecorationPage').then((m) => ({ default: m.DecorationPage })),
)
const GalleryPage = lazy(() =>
  import('@/pages/GalleryPage').then((m) => ({ default: m.GalleryPage })),
)
const ContactPage = lazy(() =>
  import('@/pages/ContactPage').then((m) => ({ default: m.ContactPage })),
)
const TermsPage = lazy(() => import('@/pages/TermsPage').then((m) => ({ default: m.TermsPage })))
const BookPage = lazy(() => import('@/pages/BookPage').then((m) => ({ default: m.BookPage })))
const SiteVisitPage = lazy(() =>
  import('@/pages/SiteVisitPage').then((m) => ({ default: m.SiteVisitPage })),
)
const TrackPage = lazy(() => import('@/pages/TrackPage').then((m) => ({ default: m.TrackPage })))
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)

/**
 * One client for the app. `staleTime` is generous because spaces, packages
 * and a month of availability barely change while someone reads the page —
 * without it, React Query refetches on every window focus, which would make
 * the calendar flicker each time the visitor tabs back.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <SiteLayout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/spaces" element={<SpacesPage />} />
                <Route path="/spaces/:slug" element={<SpaceDetailPage />} />
                <Route path="/decoration" element={<DecorationPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/book" element={<BookPage />} />
                  <Route path="/track" element={<TrackPage />} />
                {/* The site-visit flow is the next milestone; until then it
                    lands on the booking stub so no CTA points at a 404. */}
                <Route path="/site-visit" element={<SiteVisitPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </SiteLayout>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
