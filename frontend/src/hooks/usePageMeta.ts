import { useEffect } from 'react'

/**
 * Sets the document title and meta description for a route.
 *
 * Deliberately a hook rather than a head-manager dependency: the whole need
 * is two DOM writes per navigation, and react-helmet and friends bring a
 * provider, a context and a rendering model for that. If the site ever grows
 * canonical tags, per-route Open Graph or server rendering, swap this for a
 * real library then, not before.
 *
 * Open Graph lives statically in index.html. Crawlers that execute no
 * JavaScript, which includes most link unfurlers, read that copy for every
 * route, so a shared link to any page previews as the home page. Fixing that
 * properly needs server rendering or prerendering, not a bigger hook.
 */
export const SITE_NAME = 'Zukin Hall'

/** Home keeps the full sentence; every other page is "<Page> | Zukin Hall". */
export function pageTitle(page?: string): string {
  return page ? `${page} | ${SITE_NAME}` : `${SITE_NAME} | Event venue and decoration in Dodoma`
}

export function usePageMeta(title: string, description: string): void {
  useEffect(() => {
    document.title = title

    let tag = document.head.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('name', 'description')
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', description)
  }, [title, description])
}
