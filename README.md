# ZUKIN HALL

Event venue and decoration business in Dodoma, Tanzania.
Monorepo: React landing page (`/frontend`) + Django read-only API (`/backend`).

**Stage 1 scope** is the public landing page and the data it reads. The booking
flow and the reception portal come later; `/book` is a placeholder page.

---

## Pinned versions

Pinned exactly (no `^`), so every machine and CI run resolves the same tree.
Bump deliberately, in their own commit.

| Tool | Version | Note |
| --- | --- | --- |
| Node | 24.14.0 | |
| npm | 11.14.1 | |
| Python | 3.14.7 | Supported by Django 6.1 (`requires_python >=3.12`) |
| Django | 6.1.2 | |
| Django REST Framework | 3.18.3 | Classifies Django 6.1 |
| django-cors-headers | 4.9.0 | |
| django-environ | 0.14.0 | |
| Vite | 8.3.5 | |
| React | 19.3.1 | |
| TypeScript | 6.0.3 | Version the Vite template pins; TS 7 not adopted yet |
| Tailwind CSS | 4.3.3 | CSS-first `@theme`, no `tailwind.config.js` |
| React Router | 8.5.0 | |
| TanStack Query | 5.104.5 | |
| Vitest | 5.0.5 | |

> Django 5.2 LTS does **not** support Python 3.14 (it caps at 3.13). Django 6.1
> does, so the choice was Django 6.1 on Python 3.14 rather than downgrading
> Python. If you later want the LTS guarantee, move to Python 3.13 + Django 5.2.

---

## Run it

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev          # http://localhost:5173
```

| Script | Does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) then production build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | oxlint |
| `npm test` | Vitest once |
| `npm run test:watch` | Vitest in watch mode |

### Backend

Arrives in milestone (b). It will be:

```bash
cd backend
cp .env.example .env
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver     # http://127.0.0.1:8000
```

---

## Layout

```
frontend/
  public/
    images/            # venue photos; 13 of 24 still missing (see its README)
    hero-sequence/     # d/ + m/ frame sequences + manifest.json for the hero
  src/
    components/ui/     # Button, Photo, Glow, Eyebrow
    components/layout/ # Header, Footer, Container, Section, SiteLayout
    sections/          # one component per Figma section (milestones d, e)
    features/          # booking bar, availability calendar, gallery lightbox
    hooks/             # useScrolledPast, and the hero scroll hook in (c)
    i18n/              # en.json, sw.json
    lib/               # cn, env
    pages/             # LandingPage, BookPage, NotFoundPage
    styles/            # tokens.css (@theme), global.css
backend/               # Django project (milestone b)
docs/STAGE1_PROMPT.md  # the brief
```

---

## Design

Figma is the source of truth: file `ZbmGApY1xgt6npjWMkM6XB`, page "Website",
frame **"Landing page DETAILED, desktop 1440"** (node `21:2`). The older grey
wireframe (`14:2`) is reference only. Each milestone re-reads its own sections
with the Figma MCP rather than working from a stale copy.

### Tokens

All colour, type, radius and breakpoint tokens live in
`frontend/src/styles/tokens.css` under Tailwind v4's `@theme`. That block is
the only place a hex value may appear — components use the generated utilities
(`bg-plum`, `text-gold`, `rounded-card`) or the CSS variables.

Four tokens are **not** in the brief and were measured off the Figma frame:
`plum-deep` (`#14070f`, the footer), and `on-dark` / `on-dark-muted` /
`on-dark-faint`, the three text tints used on dark sections — the brief's
`muted` is tuned for cream and fails contrast on plum.

### Breakpoints

The brief names 360 / 768 / 1024 / 1440. 360 is the mobile-first base and needs
no query; `md` (768) and `lg` (1024) already match Tailwind's defaults; `xl` is
moved from 1280 to **1440** so `xl:` means "the Figma desktop frame". `2xl` is
removed so nothing can silently target a width we have no design for.

---

## Milestones

| | Milestone | Branch | State |
| --- | --- | --- | --- |
| a | Scaffolding, tokens, fonts, layout shell | `feat/scaffolding` | ✅ |
| b | Django models, API, seed, tests | `feat/backend-api` | |
| c | Pinned scroll-scrubbed hero + booking bar | `feat/hero` | ✅ |
| d | Marquee, intro, spaces, events, decoration | `feat/sections-mid` | |
| e | Gallery, availability, how-it-works, location, CTA | `feat/sections-late` | |
| f | i18n, responsive, a11y, SEO passes | `feat/polish` | |

---

## Hero sequence

The hero is a pre-rendered image sequence scrubbed by scroll, not video and
not 3D. Frames live in `frontend/public/hero-sequence/` as `d/` (1280px) and
`m/` (720px), with `manifest.json` holding the frame count, the file-name
pattern, the story beats and the usable scrub range.

**Nothing in the code knows the frame count, the pattern or the beats** — the
manifest is fetched at runtime, so a new walkthrough is a drop-in replacement
of the frames plus the manifest, with no rebuild.

`scrub` caps which frames play. The current placeholder clip fades to black
over frames 163-165, so it is set to `1-162`; widen it when real footage
replaces these frames.

Measured against the committed placeholder frames:

| | Desktop (`d/`) | Mobile (`m/`) |
| --- | --- | --- |
| Mean frame size | 57.9 KB | 25.7 KB |
| Frames loaded eagerly | 12 | 15 |
| **Initial payload** | **486 KB** | **286 KB** |
| Full scrub range | 9.4 MB | 4.2 MB |

The eager count differs per variant because 15 desktop frames measure 652 KB,
over the brief's ~600 KB budget. The full range downloads in the background;
Save-Data and 2g force the mobile set regardless of viewport.

---

## Content rules

- All visible copy lives in `src/i18n/en.json` / `sw.json`. No hardcoded strings.
- `sw.json` is an **unreviewed first draft** — see the `"//"` key at its top.
- Unknown facts stay bracketed (`[000] guests`, `TZS [000,000]`) and come from
  nullable API fields. Never invent a number, price, address or phone number.
