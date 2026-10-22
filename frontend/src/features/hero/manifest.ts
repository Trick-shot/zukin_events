/**
 * Shape of /public/hero-sequence/manifest.json.
 *
 * The manifest is fetched at runtime rather than imported, which is what makes
 * the brief's "replaceable with only a manifest change" true in the strong
 * sense: drop in a new frame folder and a new manifest.json and the hero
 * re-times itself with no rebuild. Nothing in the components knows the frame
 * count, the file-name pattern or the story beats.
 */
export type HeroBeat = {
  /** 1-based, inclusive. */
  from: number
  /** 1-based, inclusive. */
  to: number
  caption: string
  note?: string
}

export type FrameRange = { from: number; to: number }

export type HeroManifest = {
  frames: number
  /** printf-style, e.g. "f_%04d.webp". */
  pattern: string
  folders: { desktop: string; mobile: string }
  /**
   * The frames the scrub actually plays, 1-based inclusive. Defaults to the
   * whole sequence. It exists because a clip can carry handles the hero should
   * not show — the placeholder footage fades to black over its last three
   * frames, and ending the pinned section on a black screen under the booking
   * bar would read as a bug. Declaring the usable range here keeps that a
   * content fact, fixable by whoever supplies the next clip, instead of a
   * magic number inside a component.
   */
  scrub: FrameRange
  sizes?: { desktop?: string; mobile?: string }
  source?: string
  beats: HeroBeat[]
}

export const HERO_SEQUENCE_BASE = '/hero-sequence'
export const HERO_MANIFEST_URL = `${HERO_SEQUENCE_BASE}/manifest.json`

/**
 * Narrow unknown JSON to a HeroManifest.
 *
 * Deliberately strict: a malformed manifest should fail loudly at load, where
 * the hero can fall back to its poster, rather than produce NaN frame indices
 * and an empty canvas halfway down the page.
 */
export function parseManifest(value: unknown): HeroManifest {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Hero manifest is not an object')
  }

  const raw = value as Record<string, unknown>

  if (typeof raw.frames !== 'number' || !Number.isInteger(raw.frames) || raw.frames < 1) {
    throw new Error('Hero manifest: "frames" must be a positive integer')
  }
  if (typeof raw.pattern !== 'string' || !raw.pattern.includes('%')) {
    throw new Error('Hero manifest: "pattern" must be a printf-style string')
  }

  const folders = raw.folders as Record<string, unknown> | undefined
  if (
    typeof folders !== 'object' ||
    folders === null ||
    typeof folders.desktop !== 'string' ||
    typeof folders.mobile !== 'string'
  ) {
    throw new Error('Hero manifest: "folders" must name a desktop and a mobile folder')
  }

  const beats = Array.isArray(raw.beats)
    ? raw.beats.filter((beat): beat is HeroBeat => {
        if (typeof beat !== 'object' || beat === null) return false
        const candidate = beat as Record<string, unknown>
        return (
          typeof candidate.from === 'number' &&
          typeof candidate.to === 'number' &&
          typeof candidate.caption === 'string'
        )
      })
    : []

  const scrubRaw = raw.scrub as Record<string, unknown> | undefined
  const scrub: FrameRange =
    typeof scrubRaw === 'object' &&
    scrubRaw !== null &&
    typeof scrubRaw.from === 'number' &&
    typeof scrubRaw.to === 'number'
      ? {
          from: Math.max(1, Math.min(scrubRaw.from, raw.frames)),
          to: Math.max(1, Math.min(scrubRaw.to, raw.frames)),
        }
      : { from: 1, to: raw.frames }

  return {
    frames: raw.frames,
    scrub,
    pattern: raw.pattern,
    folders: { desktop: folders.desktop, mobile: folders.mobile },
    sizes: raw.sizes as HeroManifest['sizes'],
    source: typeof raw.source === 'string' ? raw.source : undefined,
    beats,
  }
}

export async function loadManifest(signal?: AbortSignal): Promise<HeroManifest> {
  const response = await fetch(HERO_MANIFEST_URL, { signal })
  if (!response.ok) {
    throw new Error(`Hero manifest: HTTP ${response.status}`)
  }
  return parseManifest(await response.json())
}
