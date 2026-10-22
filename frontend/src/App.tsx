import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router'

import { SiteLayout } from '@/components/layout/SiteLayout'
import { BookPage } from '@/pages/BookPage'
import { LandingPage } from '@/pages/LandingPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

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
        <SiteLayout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/book" element={<BookPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </SiteLayout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
