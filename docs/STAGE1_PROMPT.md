# Stage 1 prompt for Claude Code: ZUKIN HALL landing page

You are helping me build Stage 1 of the ZUKIN HALL website: the public landing page. The repo is already cloned and I am in its root. I am Erick (Trickshot), a fullstack developer. My stack is React + Django. Work like a senior engineer pairing with a junior: explain WHY you choose things, keep steps small, and stop for my review at each milestone. Do not build beyond the scope below.

## Project context
ZUKIN HALL is a new event venue and decoration business in Dodoma, Tanzania. The full product will have: landing page + public pages, a customer booking flow (no customer accounts; tracking by phone + reference), and a reception portal. Stage 1 is ONLY the landing page and the read-only data it needs.

## Design source of truth
Figma file key: ZbmGApY1xgt6npjWMkM6XB, page "Website".
Frame "Landing page DETAILED, desktop 1440" (node 21:2). Use the Figma MCP (get_metadata, get_design_context, get_screenshot) to read it section by section and match it. Follow the figma-design-to-code skill if available. Do not use the older grey wireframe frame (14:2) except for reference.
There is no mobile design yet. Build mobile-first and responsive using sensible breakpoints (360, 768, 1024, 1440), keeping the same section order and look. Flag anything where you had to guess.

## Design tokens
- Colors: red #D6213B (primary buttons), magenta #A8185F, pink #F2A6C8, gold #C8A24A, plum #2B0F22, cream #FBF7F2, ink #1C1217, muted #6B5A63, line #E8DDD5
- Fonts: Playfair Display (headings, numerals), Inter (body/UI). Self-host with fontsource.
- Style: pill buttons, 20-24px card radius, soft pink/magenta radial glows on cream sections, gold eyebrow labels (uppercase, wide letter-spacing).
Put tokens in the Tailwind config (or CSS variables), not hard-coded in components.

## Landing page sections (in order)
1. Hero: a PINNED, scroll-driven 3D-feel animation (see the Hero scroll animation section below), with the header (nav + EN|SW toggle + "Check availability" outline button), a small "Zukin Hall" name bottom-left, and the hero booking bar (tabs: Check availability / Book a site visit / Track my booking; fields: event date, space, event type, guests; red "Check availability" button) that appears at the end of the sequence.
2. Marquee band: event types in serif text, looping.
3. Intro: short text + 4 facts + photo with gold outline.
4. Spaces (2 cards: Main hall, Second space).
5. Events (5 photo tiles with icon chips).
6. Zukin decoration (3 packages; the middle one highlighted "Most chosen").
7. Gallery (6 slots, first is a video tile that opens a lightbox).
8. Availability (month calendar: available / on hold / booked; legend; selected-date card; "Request this date").
9. How booking works (4 steps).
10. Location (map slot + contact details + buttons).
11. CTA banner with faded photo background.
12. Footer.

## Hero scroll animation (replaces the crossfade idea)
Reference: two Instagram videos the owner showed me. In both, the hero is pinned full-screen while scrolling plays a camera moving through a space (one walks from a storefront into a dining room; the other flies through a kitchen and a blueprint to a living room), and text and buttons appear at set scroll points. It is NOT real 3D. It is a pre-rendered image sequence scrubbed by scroll. Build exactly that.
- Frames are in /frontend/public/hero-sequence: d/ (1280px, desktop) and m/ (720px, mobile), files f_0001.webp to f_0165.webp, plus manifest.json with the frame count and the story beats (caption + frame range). They are placeholders sampled from the venue clip; the clip is an edited montage, so some transitions are cuts. Design the code so the frames can be replaced by a smoother walkthrough later with only a manifest change.
- Implementation: a tall section (about 400-500vh) with a sticky 100vh stage containing one <canvas>. Map scroll progress (0 to 1) to a frame index. Use requestAnimationFrame with a small lerp so frames glide instead of snapping, and draw with cover-fit scaling. Preload progressively: load the first ~15 frames immediately and show them while the rest load in the background; show the first frame as a poster so there is no blank state. Pick d/ or m/ by viewport width (and consider devicePixelRatio and connection saveData).
- Content on scroll: overlay captions from manifest.beats that fade and slide in at their frame range, while the "Zukin Hall" name stays bottom-left. At the end of the sequence the booking bar rises into view, then the pinned section releases into the marquee band.
- Add subtle camera-feel on top of the frames: a slow scale (1.00 to 1.06) and a light vignette, plus a thin scroll progress cue. No heavy animation or 3D libraries; plain CSS, canvas and a small custom hook (a tiny helper like lenis is fine only if smooth scrolling clearly improves it).
- Accessibility and fallbacks: honour prefers-reduced-motion (show a static poster with the content visible, no pinning), keep the page keyboard- and screen-reader-usable (captions are real text, the canvas has an accessible label), and make sure the booking bar is reachable without scrolling through the sequence (a "Skip to booking" link).
- Performance targets: initial hero payload under ~600KB, no layout shift, 60fps scrubbing on a mid-range phone. Report the measured numbers when this milestone is done.

## Stack and structure
Monorepo:
- /frontend: Vite + React + TypeScript, Tailwind, React Router, react-i18next (EN + SW), lucide-react for icons for now (the design uses simple line icons; I will swap in IconScout SVGs later via src/assets/icons).
- /backend: Django + Django REST Framework + django-cors-headers, SQLite for dev (settings ready for Postgres later via env), python-decouple or django-environ for env vars.
Add a README with run instructions, a .env.example for both sides, and a sensible .gitignore.

## Backend scope (read-only for Stage 1)
- Models: Space (name, slug, capacity, features, from_price, order, is_active), DecorationPackage (name, from_price, included_items JSON, is_highlighted, order), BlockedDate (space FK, date, reason, status: booked|hold|blocked).
- Endpoints: GET /api/spaces/, GET /api/decoration-packages/, GET /api/availability/?month=YYYY-MM&space=<slug> returning each date with status available|hold|booked.
- A seed command (manage.py seed_demo) with placeholder data. Prices and capacities are unknown, so keep them clearly marked placeholders and nullable; the UI must show "[TZS 000,000]"-style placeholders when null.
- Admin registered for all three models.
- Tests for the availability endpoint (a booked date, a hold date, a free date, month boundaries).
Do NOT build booking requests, payments, auth or the reception portal yet. Keep model choices extensible, since a Booking model comes next (statuses: Requested, Under review, Deposit due, Confirmed, Completed, Rejected, Expired, Cancelled).

## Frontend requirements
- Text content lives in i18n files (en.json, sw.json). Swahili can be a reasonable first draft; mark it for my review. Placeholder facts stay in square brackets, e.g. [000] guests, and must not be invented.
- Images: the photos are in /frontend/public/images (see the README there). Use a single <Photo> component that renders a gradient placeholder if a file is missing, otherwise the real <img> (lazy-loaded, width/height set, alt text). Expected names: hero-1..4.jpg, intro-aisle.jpg, space-main.jpg, space-second.jpg, event-weddings.jpg, event-sendoffs.jpg, event-kitchen.jpg, event-birthdays.jpg, event-corporate.jpg, decor-classic.jpg, decor-premium.jpg, decor-signature.jpg, gallery-1..6.jpg, cta-bg.jpg.
- The availability calendar and the spaces/packages sections fetch from the Django API (TanStack Query or simple fetch hooks), with loading and error states.
- Booking bar and "Request this date": for now navigate to /book with the chosen date, space, event type and guests as query params, to a simple placeholder page ("Booking opens soon"). The real flow is Stage 2.
- Accessibility: semantic landmarks, keyboard-usable nav, calendar and lightbox with focus management, visible focus rings, contrast checked on the plum and gold areas, prefers-reduced-motion respected for the hero crossfade and marquee.
- Performance: no heavy animation libraries (CSS + small hooks), fonts self-hosted with swap, images lazy-loaded except the hero, aim for Lighthouse 90+ on mobile once real photos are in.
- SEO: title/description/Open Graph tags, LocalBusiness JSON-LD with placeholders, sitemap and robots.

## Working agreement
1. First, read the repo and the Figma frame, then reply with a short plan: folder structure, libraries and why, and the milestone breakdown. Wait for my OK.
2. Milestones, with a commit and a summary after each: (a) project scaffolding + tokens + layout shell (header/footer); (b) Django models, API, seed, tests; (c) pinned scroll-scrubbed hero + captions + booking bar, built and tuned on its own before anything else on the page; (d) intro, marquee, spaces, events, decoration; (e) gallery + lightbox, availability calendar, how-it-works, location, CTA; (f) i18n pass, responsive pass, a11y pass, SEO.
3. Use small, descriptive commits. Do not push to main directly; work on a feature branch and open a PR for each milestone.
4. After each milestone tell me: what you built, any assumptions, what you would improve, and what I should test. If something is ambiguous, ask me instead of guessing.
5. Write tests where they matter (API; calendar status logic). Keep components small and reusable.

Start with step 1 now.
