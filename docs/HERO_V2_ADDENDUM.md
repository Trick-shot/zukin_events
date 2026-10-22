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

Design (matches Figma frames "Loading screen WHITE, desktop 1440" and "mobile 390"; WHITE is the chosen variant, ignore the dark one):
- Full-screen pure white (#FFFFFF) background with a very soft pink glow (#E9A9C6 at ~28% opacity, heavily blurred, about 570px) behind the rose.
- Centered: the gold rose Lottie (already recoloured to #B58A2A in the JSON) at about 260px desktop (190px mobile), then eyebrow "WELCOME TO" (Inter Medium 12px, tracking 30%, magenta #A8185F), the ZUKIN HALL wordmark (Playfair Display SemiBold 44px desktop / 34px mobile, tracking 18%, plum #3A1230), and caption "DODOMA, TANZANIA" (Inter 11px, tracking 28%, #7A6575).
- A thin 1px gold (#B58A2A) progress hairline (240px wide, track at 20% opacity), percent in #7A6575, under the wordmark that fills with real load progress (poster image + first N frames of the hero sequence), not a fake timer. Minimum display time 1.2s so it never flashes.
- Exit: when the first frames are ready and the minimum time has passed, fade the whole loader out over 700ms while the intro film begins underneath. The INTRO_CLEAN_MS clean window starts at the moment the fade completes.
- Lock scroll while the loader is visible. Lazy load the lottie library so it does not block first paint (the loader markup itself is inline CSS/JS in index.html or a tiny component).
- Accessibility: role="status", aria-live polite "Loading", and reduced-motion shows the rose as a static first-frame/SVG.

## C. Shot list consequence (decided after reviewing the shot-list proposal)

The journey must END inside the venue, so drop the `closing_aerial` shot. Last journey shot is `aisle` (or `stage`). Order: walkin, hall_wide, table_setting, ceiling, stage, aisle. The aerial appears only in the intro film and as the rewind target at scrollY = 0.

## D. More interior, crisper frames (supersedes the shot-list budget and the "only two shots" Tier 2 limit)

The inside of the venue is the core of the service. The journey must spend most of its scroll length inside the hall.

Interior share:
1. At least 65% of total journey scroll length and frame count is INSIDE the building (from the doorway onward). Exterior/approach gets the rest.
2. Re-scan the whole clip for every usable interior segment, not only the shots already listed. Candidates: the gaps between listed shots (29.68-30.72, 33.32-37.36, 43.84-46.16, 47.80-51.20) and the interior half of the walk-in take (doorway onward). Add any steady, sharp, well-lit interior take at least 1.2 s long. Update the contact sheet and show me the new shot list before the heavy stages.
3. Order the interior so it reads as a tour: doorway/arch -> hall wide -> tables -> ceiling/chandelier -> stage -> aisle. The last frame is still inside the hall.
4. Interior chapters get more scroll distance each (about 1.5x the exterior chapters) and slower scrub so details stay readable. Use sub-frame blending; add optical-flow interpolation (minterpolate) only on slow, steady interior shots, never on fast motion.
5. Budget: if frame count must grow, reduce exterior frames first. Keep total payload sensible with progressive loading (interior frames load in priority after the first screen).

Crispness:
1. Run Tier 2 (Real-ESRGAN, tools/realesrgan, model realesrgan-x4plus) on ALL interior shots, not only the walk-in and aerial. Process only the frames we actually ship (sampled), one shot at a time, delete intermediates after each shot (about 16 GB disk free).
2. Pipeline per shot: extract lossless PNG frames -> light denoise (hqdn3d, low strength) -> Real-ESRGAN 4x -> downscale to the delivery size with Lanczos -> gentle sharpen (cas or unsharp, subtle, no halos) -> cwebp at high quality (q 85-90 for interior, near-lossless on hero stills). Do not resample more than twice.
3. Delivery size: desktop frames 1920 wide (not 1280), mobile 1080 tall-crop versions. Canvas renders at devicePixelRatio, capped by frame size, with image-rendering default (no CSS blur/scale tricks).
4. Compare at 100% crop: original vs Tier 1 vs Tier 2 on brick, chair edges, table setting and the ceiling flowers. Pick the best per shot. Reject any result with plastic skin/texture, ringing, or invented detail (Real-ESRGAN can hallucinate pattern on fabric and flowers; fall back to Tier 1 for that shot).
5. Honest limit stays: enhancement cannot invent detail. The ask to the client remains original 4K at high bitrate, with slow gimbal moves inside the hall.

## E. Opening frame = front view of Zukin Hall (overrides "aerial at the top" in section A)

1. On first load AND on every refresh at the top of the page, the first thing visible (poster behind the loader, first canvas frame, scrollY = 0) is the FRONT view of Zukin Hall: camera facing the building head-on, facade centered and symmetrical. Not a side angle, not an aerial, not a close detail.
2. Pick this frame from the clip: scan for the most frontal, centered, sharp, well-exposed view of the facade (check the start of the walk-in take around 16.76-18.6 s, the sign/facade material, and the aerial/ground shots near 12.88-15.40). Show me 3 candidates on the contact sheet and wait for my choice if no frame is clearly frontal.
3. The intro film (first ~5.5 s, UI hidden) STARTS on that front-view frame, then moves through the aerial and ground shots, and ends handing off to the walk-in. The loader fades out onto this same frame so there is no visual jump.
4. At scrollY = 0 (initial load, refresh, or after scrolling back up) the canvas shows this front-view frame. So the journey rewinds to the front view, not to the aerial. The aerial remains part of the intro film only.
5. Generate the poster from this exact frame (desktop and mobile crops, mobile crop keeps the facade centered), at full Tier 2 quality, and preload it as the first resource so the loader exits onto a sharp image.
6. Reloading mid-page still restores the frame from scroll position (section A rule 5); only the top-of-page state is pinned to the front view.

## F. One continuous spatial order: outside -> doorway -> inside, never back out

Problem seen in the current build: the frames go outside, then inside, then suddenly outside again. This breaks the "journey into the hall" story.

Rules:
1. The whole sequence is ONE chronological, spatial path with a single crossing of the doorway: front view (frame 1, section E) -> exterior views (side view, aerial orbit, ground approach) -> the sign/facade -> entrance and doors -> arch -> inside the hall -> deeper inside. After the doorway frame there must be NO exterior frame anywhere (no aerial, no street, no facade).
2. Scrolling down only ever moves outside -> inside. Scrolling up is the exact reverse: inside -> doorway -> outside -> front view at scrollY = 0. No extra shots in the reverse direction.
3. Audit every shot in the journey and intro for "where is the camera": tag each segment EXTERIOR / THRESHOLD / INTERIOR on the contact sheet. The order must be all EXTERIOR first, one THRESHOLD, then all INTERIOR. Drop or move any segment that breaks this (this removes closing_aerial and any exterior b-roll sitting among interior shots).
4. Exterior segments are ordered so the camera keeps getting closer: front view -> side/aerial orbit (overview of the whole compound) -> ground approach -> facade/sign -> doors. Do not jump from close to far and back.
5. Within the interior, order as a tour (arch -> hall wide -> tables -> ceiling -> stage -> aisle) with no cuts back toward the door. If a shot looks toward the entrance, put it where it makes sense or drop it.
6. Between segments use short dissolves only where the camera position changes; the walk-in take stays uncut. After assembly, review the full sequence frame by frame at the contact sheet level and list any spatial jump you could not remove.
7. Chapter text/features follow the same order: exterior chapters first (the venue, location), interior chapters after (hall, tables, ceiling, stage), ending with the booking prompt while still inside.

Acceptance:
- On the contact sheet, the EXTERIOR / THRESHOLD / INTERIOR tags read exactly E...E, T, I...I.
- Scrolling slowly down shows no moment where the viewer is back outside.
- Scrolling up from the end retraces the same path backwards.

## G. Even more interior views (raises section D)

1. Raise the interior share from 65% to at least 75% of journey scroll length and frames. Exterior stays short: front view, one aerial/side overview, ground approach, doors.
2. Use every distinct interior viewpoint the clip offers. Report how many distinct interior views exist and how many seconds of usable interior footage there are, before choosing.
3. If the clip does not have enough distinct interior views for the 75% target, do NOT pad with repeats or loops. Instead list the missing views (for example: entrance hall from inside, tables from the side, stage from the aisle, ceiling detail, bar/service area, restrooms/lounge if any) as a shot request for the client.
4. Extra interior views may also come from REAL client photos: turn each real photo into a slow, subtle camera move (push-in or pan, 3-5 s) with Runway image-to-video or a plain Ken Burns move. Keep it faithful to the photo: no added decor, no changed colours. Reject any result that alters the room.
5. Never generate interior views from text only. The interior must always be the real hall.

## H. Opening story (supersedes section E points 1-4 where they conflict)

The owner's idea, in order:
1. The page opens (first load and every refresh) with a short intro video, about 5.5 s, UI hidden: it starts with the AERIAL view of the whole venue.
2. The camera then comes down and settles on the FRONT view of Zukin Hall, with the red ZUKIN HALL sign centred. The intro ends HOLDING on this front frame for about 1 s.
3. Only then do the header and UI appear. The user scrolls down, and the video continues the same journey: front of the venue -> doors -> arch -> inside the hall -> deeper inside. It never goes back outside (section F).
4. After the intro has played, the resting state at scrollY = 0 is the held FRONT view, not the aerial. Scrolling back to the top shows the front view (no replay of the intro and no jump to the aerial). A full refresh replays the intro.
5. The loader (section B) fades out onto the FIRST intro frame (aerial). The poster image behind the loader is therefore the first aerial frame; the front-view frame is the hold frame, the reduced-motion static image, and the scroll start.
6. Intro shot order: aerial orbit -> ground/approach -> front-view settle. Choose these from cleaned footage (Runway-cleaned exterior clips when available). Dissolve between shots only where the camera position changes. The last intro frame must equal the first scroll frame exactly (no visual jump when the UI appears).
7. If the clip has no clean frontal frame, show me 3 candidates (see section E point 2) before the heavy stages.

## I. The sign must be seen

1. The held front-view frame (end of the intro, scrollY = 0 resting state, scroll start) must show the red ZUKIN HALL sign fully inside the frame, centred horizontally in the upper-middle, sharp and readable at desktop and mobile sizes. No part of the sign cropped, no tree or object covering it.
2. Do not pick a frame where the sign is partly cut off or too small. The sign should take roughly 12-20% of the frame width on desktop.
3. On mobile (portrait crop) the sign must stay fully visible and centred; adjust the crop per frame, not a single global crop.
4. Sharpen the sign area deliberately: check lettering at 100% crop after Tier 2 and reject any result with smeared, warped or redrawn letters. If an AI step garbles the text, use the original or Tier 1 for that frame.
5. Keep the header logo and the loader wordmark consistent with the sign text: "ZUKIN HALL".

## J. Interior feature chapters (premium storytelling while scrolling inside)

As the user scrolls through the interior, short chapters appear over the footage, each tied to what the camera is showing at that moment: furniture, lighting, decoration, sound/atmosphere.

Design:
1. One chapter per interior shot, each with: a small gold eyebrow label (e.g. "01 FURNITURE"), a short Playfair Display title (3-5 words), one line of description (max 14 words), optional thin gold line. Placed in a clear area of the frame (left or right third), never covering the focal point (sign, chandelier, stage).
2. Chapters fade/slide in slowly (500-700 ms) as the shot enters and fade out before the next. Reduced-motion: no slide, just fade. Text over a soft plum gradient scrim for readability, WCAG AA contrast.
3. Chapter list (copy is a PLACEHOLDER and must be confirmed by the client; never claim anything the venue does not have):
   - 01 Arrival: "Step into Zukin Hall" / "A grand entrance, ready to welcome your guests."
   - 02 Space: "A hall made for the day" / "Open, bright and arranged around your event."
   - 03 Furniture: "Elegant seating and tables" / "Chairs, tables and gold sofa styled for every celebration." [confirm]
   - 04 Lighting: "Warm, layered lighting" / "Chandeliers and soft light that flatter every moment." [confirm]
   - 05 Decoration: "Flowers and styling" / "Hanging florals and decor, including Zukin decoration packages." [confirm]
   - 06 Sound and atmosphere: "Made to feel special" / "Sound, light and setting working together." [confirm: only if a sound system exists]
   - Final: "Reserve your date" with the booking button (still inside the hall).
4. Copy lives in the i18n files (EN and SW), keyed per chapter, so the client can edit it. Swahili copy is a draft to be reviewed by a native speaker.
5. Each chapter is a data entry {id, shotId, startProgress, endProgress, side} in one config file, so timings follow the shot list without code changes.

Sound (optional, off by default):
1. Add a small sound toggle (icon, bottom corner). Default OFF; browsers block autoplay with sound, so audio starts only after the user turns it on.
2. If enabled, play a quiet, premium ambient instrumental loop (licensed or royalty-free, confirm the licence), fading in/out over 1 s, never louder than a gentle background level. Remember the choice for the session.
3. Do not ship any music file until the licence is confirmed; use a clearly named placeholder.

## K. Chapter copy grounded in what the footage actually shows (replaces the placeholder list in section J, point 3)

Based on a review of the interior frames. [seen] = visible in the footage. [confirm] = plausible but must be confirmed by the client before launch. Keep copy short and premium; no capacity numbers, prices or claims that are not confirmed.

| # | Shot | Eyebrow | Title | One line |
|---|------|---------|-------|----------|
| 01 | Entrance / arch | ARRIVAL | A grand welcome | A bright foyer and a floral arch that set the tone before guests step in. [seen: white foyer, glass doors, floral arch, fairy lights] |
| 02 | Hall wide | THE HALL | Room to celebrate | A spacious, open hall with polished floors and a clear central aisle. [seen] |
| 03 | Tables and chairs | FURNITURE | Dressed for every table | Round tables, white and gold chairs, and linens in your colours. [seen: round tables, gold-frame chairs, coloured linens] |
| 04 | Table setting | DETAIL | Details guests notice | Gold charger plates, crystal glassware and fresh floral centrepieces. [seen] |
| 05 | Ceiling | LIGHTING | A ceiling worth looking up at | Crystal chandeliers, glowing pendants and soft draped fabric overhead. [seen: chandeliers, hanging blossoms, drapes, fairy lights] |
| 06 | Stage | THE STAGE | Where the moment happens | A styled stage with a gold sofa and chairs, floral walls and lanterns. [seen] |
| 07 | Aisle | DECORATION | Styled to your story | Zukin decoration turns the hall into your theme, from the aisle to the ceiling. [seen decor; "Zukin decoration" service per owner, confirm packages] |
| 08 | Atmosphere | SOUND AND SERVICE | Made to feel effortless | Professional sound, air conditioning and a team to look after the day. [seen: speakers on stands, wall AC unit, screen; confirm sound, AC and team services] |
| 09 | Closing | BOOK | Reserve your date | Check availability and send your request. Still inside the hall. |

Rules: eyebrow in gold caps; title Playfair Display; one line Inter, max 14 words. Chapter 08 appears only if the client confirms sound, AC and service. Swahili versions to be drafted and reviewed by a native speaker. All copy in i18n keys per chapter.

Visual note for design: the hall's colour palette in the footage is fuchsia/magenta, white and gold, with violet-blue ambient lighting. Use the site's magenta and gold accents so the UI matches the real venue.

## L. Loop structure: out -> in -> back out (parking) -> entrance (supersedes section F points 1, 3 and section J "Final" and section D point 3 last frame rule)

The owner now wants a deliberate loop. The rule from section F still stands in spirit: no RANDOM jumps. Every movement between inside and outside must be one continuous, believable camera path.

Story order while scrolling down:
1. Intro (not scroll): aerial -> front view of Zukin Hall with the sign (hold). This is the scroll start (sections H, I).
2. Scroll: front -> doors -> arch -> inside the hall (interior chapters, sections J/K). Interior stays the longest part (at least 65-75%).
3. Exit: after the last interior chapter, the camera walks BACK out through the hall, the arch and the doors. Implement by playing the walk-in take in reverse (frame index counts down) so the path is spatially exact. This is one continuous move; no new shot and no cut.
4. Outside again: from the doorway the camera continues outward and rises into exterior shots that show the PARKING and surroundings (courtyard, gravel/paved yard, the car area, access road), using the cleaned Runway clips (assets-src/runway/cleaned/). Chapter: "PARKING AND ACCESS" with a short line (e.g. "Ample space to park and arrive in comfort." [confirm number of spaces, show no number until confirmed]).
5. Finale: the camera returns to the front entrance and the red ZUKIN HALL sign (same framing as the scroll-start frame or its close variant) for the booking section: "Reserve your date" with the booking button over the entrance view. Header/UI fully visible.
6. After the finale, normal page sections continue (section 2 Intro etc.); the canvas holds the entrance frame.

Rules:
- Scrolling up is the exact reverse of everything above, down to the front view at scrollY = 0.
- Mark each segment in the contact sheet as EXTERIOR-IN (approach), THRESHOLD, INTERIOR, THRESHOLD-OUT (reverse walk), EXTERIOR-OUT (parking/access), FINALE. The sequence must read in that order; any other order is a bug.
- Reverse playback: the interior walk-in must contain no text or objects that look wrong backwards (no signage, no people). Check the frames. If the reversed section looks wrong at the doorway, replace it with a short dissolve between the interior's last frame and a doorway frame.
- Frame budget: reuse the walk-in frames for the exit (just reversed index mapping); do not duplicate files.
- The exit takes about 10-12% of total scroll length, parking 8-10%, finale 5%.
- Update chapter config (section J point 5) with the new chapters and progress ranges.
