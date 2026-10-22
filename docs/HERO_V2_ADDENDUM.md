# Hero v2 addendum: scroll direction + loading screen

Read together with docs/HERO_V2_PROMPT.md. These two items are additions, not replacements.

## A. Scroll direction and end state (bidirectional journey)

Rules:
1. Frame position is a pure function of scroll progress inside the pinned hero range: progress 0 = opening aerial view, progress 1 = last frame, inside the hall. No "played once" flags, no one-way state. Scroll down moves the journey forward, scroll up moves it backward, frame by frame, at the same smoothness.
2. When the pin releases and the user reaches section 2 (Intro) and everything below, the canvas stays on the LAST frame (inside the venue). Do not snap, loop, or fade to a different image. Section 2 content sits over or after that final frame (use a soft plum overlay/gradient so text stays readable).
3. Scrolling back up from section 2 re-enters the pinned range and the journey rewinds all the way to the opening aerial view at scrollY = 0. At the very top the user sees the aerial opening frame again.
4. The intro film (first ~5.5s, UI hidden) plays only on first load while scrollY is 0. If the user returns to the top later, show the aerial frame statically with the header and UI visible (no replay, no hidden UI). Optional: replay only on a fresh page load.
5. Deep links (e.g. /#availability) and reloads mid-page must restore the correct frame from scroll position on load, with no flash of the wrong frame. Compute the frame from window.scrollY before the first paint.
6. Respect prefers-reduced-motion: show the poster aerial frame and the last frame as static images instead of scrubbing.

Acceptance:
- Scroll to section 3, then scroll to top: the hero rewinds smoothly to the aerial frame, no jumps.
- Reload while on section 5: the canvas already shows the inside-the-hall frame.
- No console errors when scrolling fast in either direction.

## B. Loading screen (preloader)

Asset: frontend/src/assets/zukin-loader-rose.json (IconScout Lottie "Flower", gold #C8A24A line-art roses that draw themselves, free for commercial use, no attribution needed). Use lottie-react or @lottiefiles/dotlottie-react (loop the draw animation).

Design (matches Figma frame "Loading screen" next to the landing page):
- Full-screen deep plum background (#1E0B1A to #2A1022 vertical gradient), very soft magenta glow behind the rose.
- Centered: the gold rose Lottie at about 220px (180px on mobile), above the ZUKIN HALL wordmark (Playfair Display, letter-spaced, gold), with a small caption "Dodoma" below.
- A thin 1px gold progress hairline (240px wide) under the wordmark that fills with real load progress (poster image + first N frames of the hero sequence), not a fake timer. Minimum display time 1.2s so it never flashes.
- Exit: when the first frames are ready and the minimum time has passed, fade the whole loader out over 700ms while the intro film begins underneath. The INTRO_CLEAN_MS clean window starts at the moment the fade completes.
- Lock scroll while the loader is visible. Lazy load the lottie library so it does not block first paint (the loader markup itself is inline CSS/JS in index.html or a tiny component).
- Accessibility: role="status", aria-live polite "Loading", and reduced-motion shows the rose as a static first-frame/SVG.

## C. Shot list consequence (decided after reviewing the shot-list proposal)

The journey must END inside the venue, so drop the `closing_aerial` shot. Last journey shot is `aisle` (or `stage`). Order: walkin, hall_wide, table_setting, ceiling, stage, aisle. The aerial appears only in the intro film and as the rewind target at scrollY = 0.
