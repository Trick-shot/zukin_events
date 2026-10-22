/**
 * Typed access to the Vite env. Centralised so that a missing or renamed
 * variable fails in one obvious place instead of producing `undefined/api/...`
 * request URLs at runtime.
 */
const rawApiUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

export const env = {
  /** Django origin, no trailing slash. */
  apiUrl: rawApiUrl.replace(/\/$/, ''),
  siteUrl: (import.meta.env.VITE_SITE_URL ?? 'http://localhost:5173').replace(/\/$/, ''),
} as const
