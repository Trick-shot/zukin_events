import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type Toast = { id: number; kind: 'success' | 'error'; message: string }

const ToastContext = createContext<{ show: (kind: Toast['kind'], message: string) => void }>({
  show: () => {},
})

/** `const { show } = useToast(); show('success', 'Request approved — SMS sent')` */
export function useToast() {
  return useContext(ToastContext)
}

/**
 * One toast at a time, bottom-left, after the motion spec: success enters
 * 160ms ease-out and dismisses itself after 4s; an error stays until the next
 * toast replaces it (it usually pairs with an inline ErrorBanner anyway).
 * Newest always replaces oldest — queues of toasts are how portals get noisy.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const show = useCallback((kind: Toast['kind'], message: string) => {
    window.clearTimeout(timer.current)
    setToast({ id: Date.now(), kind, message })
    if (kind === 'success') {
      timer.current = window.setTimeout(() => setToast(null), 4000)
    }
  }, [])

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          key={toast.id}
          role="status"
          className={cn(
            'fixed bottom-6 left-6 z-50 flex max-w-sm items-center gap-2.5 rounded-sm px-4 py-3',
            'text-sm text-white shadow-pop motion-safe:animate-[toast-in_160ms_ease-out]',
            toast.kind === 'success' ? 'bg-ink' : 'bg-red-dark',
          )}
        >
          {toast.kind === 'success' ? (
            <CheckCircle2 size={17} aria-hidden="true" className="shrink-0 text-success-bg" />
          ) : (
            <AlertCircle size={17} aria-hidden="true" className="shrink-0" />
          )}
          {toast.message}
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}
