import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router'

import { SiteLayout } from '@/components/layout/SiteLayout'
import { ToastProvider } from '@/components/ui/Toast'
import { BookPage } from '@/pages/BookPage'
import { ContactPage } from '@/pages/ContactPage'
import { DecorationPage } from '@/pages/DecorationPage'
import { GalleryPage } from '@/pages/GalleryPage'
import { LandingPage } from '@/pages/LandingPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SpaceDetailPage } from '@/pages/SpaceDetailPage'
import { SpacesPage } from '@/pages/SpacesPage'
import { TermsPage } from '@/pages/TermsPage'

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
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/spaces" element={<SpacesPage />} />
              <Route path="/spaces/:slug" element={<SpaceDetailPage />} />
              <Route path="/decoration" element={<DecorationPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/book" element={<BookPage />} />
              {/* The real tracking and site-visit flows are the next
                  milestone; until then both land on the booking stub so no
                  CTA on the site points at a 404. */}
              <Route path="/track" element={<BookPage />} />
              <Route path="/site-visit" element={<BookPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </SiteLayout>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
