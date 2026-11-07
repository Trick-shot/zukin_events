/**
 * One place for the site's real content: the two spaces, the event types,
 * the gallery, the booking steps, the contact details.
 *
 * Anything the client has not confirmed yet renders inside [brackets] so a
 * reviewer can grep the page for "[" and find every open question. The list
 * of pending items lives in docs/UI_HANDOFF.md ("Placeholders to confirm").
 * Never replace a bracket with an invented number.
 */

export type SpaceSlug = 'main-hall' | 'second-space'

export type Space = {
  slug: SpaceSlug
  name: string
  strap: string
  /** Seated / Cocktail / Theatre — the capacity row every venue site leads with. */
  capacity: { seated: string; cocktail: string; theatre: string }
  priceFrom: string
  description: string
  bestFor: string
  photos: { main: string; side: string }
  included: string[]
}

export const SPACES: Space[] = [
  {
    slug: 'main-hall',
    name: 'Main hall',
    strap: 'The big day, under the chandeliers.',
    capacity: { seated: '[000]', cocktail: '[000]', theatre: '[000]' },
    priceFrom: 'TZS [price]',
    description:
      'The hall you have seen in every Zukin photo: white drapery, chandeliers and hanging ' +
      'flowers over the aisle, with the stage and its gold sofa at the far end. It takes a ' +
      'full wedding, from ceremony to meal to dancing, without resetting the room.',
    bestFor: 'Weddings, send-offs and large celebrations',
    photos: { main: 'venue/hall_tables.jpg', side: 'venue/stage_sofa.jpg' },
    included: [
      'Tables and chairs for your layout',
      'Stage with the gold sofa set',
      'Sound system and microphones [confirm spec]',
      'Changing room for the couple',
      'On-site parking [000 cars]',
      'Standby generator [confirm]',
    ],
  },
  {
    slug: 'second-space',
    name: 'Second space',
    strap: 'Closer, warmer, easier to fill.',
    capacity: { seated: '[000]', cocktail: '[000]', theatre: '[000]' },
    priceFrom: 'TZS [price]',
    description:
      'A smaller room for kitchen parties, birthdays and company dinners. The same ' +
      'decoration team and the same kitchen access, at a size where fifty guests feel ' +
      'like a full house rather than a scattered one.',
    bestFor: 'Kitchen parties, birthdays and corporate dinners',
    photos: { main: 'venue/stage_wide.jpg', side: 'venue/centrepiece.jpg' },
    included: [
      'Tables and chairs for your layout',
      'Sound system [confirm spec]',
      'Decorated entrance',
      'On-site parking [000 cars]',
    ],
  },
]

export const EVENT_TYPES = [
  {
    name: 'Weddings',
    detail: 'Ceremony and reception under one roof, from the aisle to the stage.',
    format: 'Full day',
  },
  {
    name: 'Send-offs',
    detail: 'A daytime celebration with the hall dressed in your colours.',
    format: 'Daytime',
  },
  {
    name: 'Kitchen parties',
    detail: 'A closer arrangement around the stage sofa for gifts and advice.',
    format: 'Daytime',
  },
  {
    name: 'Corporate',
    detail: 'Dinners, galas and product launches with staging and sound.',
    format: 'Evening',
  },
] as const

/** The landing gallery band; the gallery page shows the full set. */
export const GALLERY_PREVIEW = [
  { src: 'venue/hall_ceiling.jpg', alt: 'Chandeliers and hanging flowers over the hall', tall: true },
  { src: 'venue/plate.jpg', alt: 'A set charger plate with a folded napkin', tall: false },
  { src: 'venue/arch.jpg', alt: 'The white flower arch at the hall entrance', tall: false },
  { src: 'venue/tables.jpg', alt: 'Round guest tables laid for a wedding', tall: true },
  { src: 'venue/stage_sofa.jpg', alt: 'The gold sofa on the decorated stage', tall: true },
  { src: 'venue/centrepiece.jpg', alt: 'A table centrepiece of fresh flowers', tall: false },
] as const

export type GalleryItem = { src: string; alt: string; h: 260 | 300 | 380 | 420 }

/** Full gallery, three masonry columns as in the Figma grid (93:1238). */
export const GALLERY_COLUMNS: GalleryItem[][] = [
  [
    { src: 'venue/hall_ceiling.jpg', alt: 'Chandeliers and hanging flowers over the hall', h: 420 },
    { src: 'venue/stage_sofa.jpg', alt: 'The gold sofa on the decorated stage', h: 300 },
    { src: 'venue/aisle.jpg', alt: 'The white aisle leading to the stage', h: 380 },
    { src: 'venue/foyer.jpg', alt: 'The entrance foyer', h: 260 },
  ],
  [
    { src: 'venue/arch.jpg', alt: 'The white flower arch at the hall entrance', h: 300 },
    { src: 'venue/plate.jpg', alt: 'A set charger plate with a folded napkin', h: 420 },
    { src: 'venue/centrepiece.jpg', alt: 'A table centrepiece of fresh flowers', h: 260 },
    { src: 'venue/hall_tables.jpg', alt: 'The main hall laid for a full wedding', h: 380 },
  ],
  [
    { src: 'venue/tables.jpg', alt: 'Round guest tables laid for a wedding', h: 380 },
    { src: 'venue/aerial.jpg', alt: 'Zukin Hall from the air', h: 260 },
    { src: 'venue/stage_ceiling.jpg', alt: 'Drapery and lights above the stage', h: 420 },
    { src: 'venue/front.jpg', alt: 'The front of Zukin Hall with the red sign', h: 300 },
  ],
]

export const BOOKING_STEPS = [
  {
    title: 'Check your date',
    detail: 'Pick a date and a space. If the date is taken we show the closest free ones.',
  },
  {
    title: 'Send your request',
    detail: 'Your name, phone number and the basics of the event. No account, no payment yet.',
  },
  {
    title: 'We call you back',
    detail: 'Reception reviews it within [24 hours] and confirms the details on the phone.',
  },
  {
    title: 'Deposit holds the date',
    detail: 'A [00%] deposit within 7 days makes it yours. The balance is due [before the event].',
  },
] as const

export const DECOR_PACKAGES = [
  {
    name: 'Classic',
    priceFrom: 'TZS [price]',
    summary: 'The hall dressed and ready: drapery, table linen and a decorated stage.',
    includes: ['Ceiling and wall drapery', 'Table linen and chair covers', 'Stage backdrop', 'Entrance decoration'],
  },
  {
    name: 'Premium',
    priceFrom: 'TZS [price]',
    summary: 'Classic, plus fresh flowers and the lit aisle from the photos.',
    includes: ['Everything in Classic', 'Fresh flower centrepieces', 'Flower arch at the entrance', 'Lit aisle to the stage'],
  },
  {
    name: 'Signature',
    priceFrom: 'TZS [price]',
    summary: 'The full Zukin look, styled around your colours with your stylist.',
    includes: ['Everything in Premium', 'Hanging ceiling flowers', 'Custom colour scheme', 'Dedicated stylist on the day'],
  },
] as const

/**
 * Live social presence, read off the real profile on 7 Nov 2026. The counts
 * are shown on the site because they are genuinely earned proof; refresh
 * them (or wire the IG API) before launch so they never read stale.
 */
export const SOCIAL = {
  instagramHandle: '@zukinevents.dar_dodoma',
  instagramUrl: 'https://www.instagram.com/zukinevents.dar_dodoma/',
  followers: '90.9K',
  posts: '1,116',
  countsAsOf: '7 Nov 2026',
  whatsapp: '+255 788 044 382',
  whatsappUrl: 'https://wa.me/255788044382',
} as const

export const CONTACT = {
  phone: '[+255 000 000 000]',
  /** From the Instagram bio's wa.me link; the voice line is still pending. */
  whatsapp: '+255 788 044 382',
  email: '[bookings@zukinhall.co.tz]',
  address: '[Street / plot], Dodoma, Tanzania',
  hours: 'Monday to Saturday, 9:00 to 18:00',
  mapsUrl: 'https://maps.google.com/?q=Zukin+Hall+Dodoma',
} as const

/** "Karibu Zukin Hall — your joy is our work." Native-speaker review pending. */
export const KANGA_LINE = 'Karibu Zukin Hall · furaha yenu, ndiyo kazi yetu'
