# Hero v2: cinematic intro film + smooth scroll journey (ZUKIN HALL)

Read this fully before touching code. It replaces the "Hero scroll animation" section of docs/STAGE1_PROMPT.md. Work in the milestones at the bottom and stop for my review after each one.

## What the owner wants (his words, summarised)
1. The site opens with a short intro film, 5 to 10 seconds, that shows the whole venue clearly: aerial view, side view, ground view, the red ZUKIN HALL sign.
2. Then, as the visitor scrolls, the camera goes INSIDE the hall. Different parts of the venue are shown and explained as you scroll (tables, table settings, ceiling and lighting, stage, aisle, decoration...). Feature sections expand as the scroll progresses.
3. The journey ends by prompting the visitor to book, using the booking bar UI (Check availability / Book a site visit / Track my booking).
4. It must feel smooth, solid and clean, and the footage must look sharp and realistic.
Reference feel: two Instagram videos he showed me. In both, the hero stays pinned while scrolling plays a camera moving through a space (storefront to dining room; kitchen to blueprint to living room), with text appearing at set scroll points. It looks 3D but it is a pre-rendered sequence driven by scroll. There is no real 3D (no Three.js).

## Review of the current implementation (localhost:5173, Chrome, 2056x1168 viewport, DPR 2)
Measured, not guessed:
- The page opens on a static still (frame 1). There is no intro film.
- The hero is 5256px tall and plays 165 frames sampled at only 3 fps from an edited montage. That is about 25px of scroll per frame, and the clip has hard cuts, so scrolling feels "static, then a burst of jumps".
- The canvas backing store is 4082x2336, but the frames are 1280px wide WebP at quality 42. Every frame is upscaled about 3x and heavily compressed. This is the main reason it looks blurry and low quality.
- All 164 frame requests fire at load (no priority order, no progressive loading).
- html has scroll-behavior: smooth, which fights a scroll-scrubbed animation.
- The captions do not match the footage ("The venue" shows on the paved yard; the aerial arrives later). Captions are tied to frame numbers instead of scroll ranges.
- Sections below the hero are placeholder stubs (that is fine for now; out of scope here).

## Target experience
### A. Intro film (autoplay, first 5 to 8 seconds)
- Poster image shows instantly (preload it, fetchpriority="high"). The film autoplays muted, playsInline, no controls, no loop.
- Story: high aerial approach, slow descent to a side view of the building, ground-level view toward the entrance and the red sign. Shots joined with 0.5 to 0.8 s cross-dissolves, never hard cuts.
- Clean cinematic window: for the first 5 to 6 seconds (a single constant, INTRO_CLEAN_MS, default 5500) NO UI is shown: no header, no nav, no logo, no name, no tagline, no booking bar, no scroll cue. The visitor only sees the film.
- After that window the UI fades in, staged: header (logo, nav, EN|SW, "Check availability") fades and slides down about 400 ms, then the "Zukin Hall" name and tagline bottom-left, then the "Scroll to enter" cue. Use opacity/transform only.
- The film itself runs about 7 to 8 s so it is still playing while the UI arrives, then holds on the final frame.
- The UI reveals EARLY (immediately) if the visitor scrolls, clicks/taps, moves the mouse a lot, or presses any key. Never make people wait to use the site.
- While hidden, the header is not just transparent: set visibility:hidden or inert so it cannot be tabbed into or read half-faded. Keep the real DOM (and a visually hidden h1 "Zukin Hall") present for SEO and screen readers. The first Tab press reveals the UI and focuses a "Skip intro" link.
- A subtle "Skip" control is allowed but appears only on first pointer move/touch or Tab, so the clean view is not spoiled. Use sessionStorage so a repeat visit in the same session skips the clean window and shows the UI at once.
- Scrolling during the film is allowed and jumps to the journey smoothly.
- If autoplay fails, or prefers-reduced-motion, or navigator.connection.saveData is on: show the poster only, show the UI immediately (no clean window) and let the visitor scroll.

### B. Scroll journey (the pinned "go inside" section)
- One tall section (about 500 to 600vh, a single constant I can tune) with a sticky 100svh stage containing one canvas.
- Camera moves from the entrance, through the arch, into the hall: arch and ceiling, tables and table settings, stage, aisle, then a closing wide shot.
- Content chapters (6 to 7), each tied to a scroll range (not frame numbers): a small label that expands into a panel with a title, one short paragraph and 2 to 3 feature bullets. Panels grow in with transform/opacity (use grid-template-rows 0fr to 1fr or clip-path, no layout thrash). Previous panel collapses as the next opens. A thin progress rail with chapter dots on the side.
- Chapter copy: use the i18n files (EN and SW). Draft text, mark with TODO for client review, and keep any number or fact as a bracketed placeholder.
- Ending: the booking bar rises into view with the primary "Check availability" button and the "Book a site visit" / "Track my booking" tabs, then the pinned stage releases into the next section.

## Pacing rule (the owner feels there are too many changes in too little scroll)
Right now one scroll step can jump across several different shots, because the montage was sampled sparsely and every few frames is a different scene. Fix the pacing, not only the frame rate:
- The journey uses at most 7 shots. Each shot gets at least one full viewport height of scroll (about 80 to 100vh) and ideally more, so the picture changes slowly and the visitor can read the caption.
- Inside a shot the camera moves continuously (real motion, about 2 to 4 s of footage per shot, slowed slightly if needed with frame blending); between shots there is one slow dissolve, never a hard cut, and never more than one dissolve per 80vh of scroll.
- Total pinned height is about 600 to 700vh to match that pacing. Make it a single constant.
- Chapters and shots share one table in manifest.json, so changing the pacing means editing the table, not code.

## Smoothness: the technical spec
Do these, in this order of importance:
1. Fix the source material (see asset pipeline). Never scrub across hard cuts; bake dissolves in.
2. Smooth the input: use Lenis (or a small critically-damped spring on scroll progress) with a lerp of about 0.08 to 0.1. Remove html scroll-behavior: smooth. One requestAnimationFrame loop for the whole hero. Only redraw when the displayed frame or blend changes.
3. Sub-frame blending: the frame sequence is about 12 fps, so draw frame i and frame i+1 on the canvas and blend them by the fractional position. This gives continuous motion at any scroll position.
4. Right-size the canvas: canvas pixel size = min(viewport CSS size x min(devicePixelRatio, 2), source frame size). Never upscale the backing store beyond the frame resolution. Cover-fit drawing.
5. Progressive loading: load priority order is the poster, then every 6th frame, then every 3rd, then the rest. Use fetch + createImageBitmap so decoding happens off the main thread and the bitmaps are ready before they are needed. While finer frames load, scrubbing still works on the coarse ones. Hold a small loading hairline at the top, not a spinner.
6. Pick the frame set by viewport and connection: desktop 1600w, tablet/mobile 960w. Cap total bytes on mobile.
7. Camera feel on top of the frames: very slow scale (1.00 to 1.05) and a light vignette. GPU-only properties (transform, opacity) for all overlays.
8. Mobile: use 100svh/dvh so the iOS address bar does not cause jumps, touch scrolling must feel native (no scroll hijacking, no preventDefault on wheel/touch).
9. No heavy libraries: plain canvas + a small hook; Lenis is the only extra I accept, and only if it clearly improves feel.

## Asset pipeline (reproducible script, runs on my Mac with ffmpeg)
- Source footage: assets-src/zukin_clip.mp4 (1920x1080, 25 fps, about 55 s, an edited montage). I will put it there. Add assets-src/ to .gitignore; commit only the script and the generated outputs.
- Write scripts/build_hero_assets.sh (documented, idempotent, with a shot table at the top: name, start, end). First generate a contact sheet from the source so we pick shots together; my rough read of the montage, verify it:
  - about 8 to 13 s: aerial of the building (several shots)
  - about 14 to 16 s: ground level, paved yard toward the entrance
  - about 16 to 21 s: red ZUKIN HALL sign, facade
  - about 21 to 26 s: doorway and the arch (first interior)
  - about 26 to 31 s: the hall, tables (wide)
  - about 31 to 41 s: table setting, plates, ceiling flowers and chandelier
  - about 41 to 48 s: stage and aisle
  - about 48 to 55 s: aerial again (closing)
- Video quality is a hard requirement from the owner: ENHANCE the footage, in two tiers. Keep the real look of the venue (pink, gold and white decoration true to life, the red sign true red, no plastic skin or invented texture).
  - Tier 1 (always, pure ffmpeg, already tested by me on this clip with a clearly visible gain on brick, lettering, chair edges and fabric). Apply per shot, in this order: trim; temporal + spatial denoise; light non-local-means; lanczos scale (down to the target, never up beyond the source); sharpen; contrast-adaptive sharpening; subtle contrast and saturation lift. Starting values to tune per shot: `hqdn3d=2.5:2.0:7:6,nlmeans=s=1.2:p=5:r=9,unsharp=5:5:0.9:5:5:0.0,cas=0.45,eq=contrast=1.05:saturation=1.07`. Add vidstab (vidstabdetect then vidstabtransform) for handheld shots. Use one shared grade so warm exteriors and pink interiors feel like one film. Encode intermediates lossless or near-lossless (ProRes or ffv1) so only the final export compresses.
  - Tier 2 (AI restoration, run locally on my Mac, optional but I want it tried): after Tier 1, run an AI restorer on the shots that matter most (the intro film shots, the sign, the arch, the hall wide). Prefer Real-ESRGAN (realesr-general-x4v3 with denoise strength tuned low, or RealESRGAN_x2plus) through Video2X or realesrgan-ncnn-vulkan on Apple Silicon; if I own Topaz Video AI I will say so and you only need to document the settings. Process in tiles, then downscale to the delivery size so the gain shows as cleaner detail, not as a bigger picture. Compare against Tier 1 on 100% crops (sign lettering, brick, chair backs, flowers, a face if any) and REJECT the AI result for a shot if it looks waxy, adds fake texture or shifts colours. Deliver whichever is better per shot and record the choice in the shot table.
  - Smoother motion: for the intro film only, if the source motion is judderly, interpolate to 30 or 50 fps (RIFE through Video2X, or ffmpeg minterpolate as a fallback) and judge it by eye; do not use interpolation if it creates warping.
  - Deliver an A/B page or contact sheet of original vs Tier 1 vs Tier 2 at 100% crops so I can choose.
- Outputs:
  - public/hero/intro.mp4 (H.264 High, 1920x1080, crf about 20, +faststart, 6 to 8 s, aim under 3.5 MB), intro.webm (VP9) and intro-poster.jpg (and a 960px poster for mobile)
  - public/hero/journey/d/ (1600px wide WebP, quality about 72) and public/hero/journey/m/ (960px wide, quality about 68): about 150 to 170 frames at about 12 fps of footage, shots joined with 0.6 s dissolves
  - public/hero/manifest.json: frame count, dimensions, file pattern, and the chapter table (id, scroll range start/end in 0..1, frame range)
- Be honest about limits: enhancement cannot add detail that is not in the footage. Report the real before/after, and list what footage we should ask the client for to get a truly premium result: original high-bitrate 4K clips, one continuous aerial approach (8 s), one continuous ground-level walk from the street through the door into the hall (10 to 15 s), and a few slow gimbal or slider shots inside. The pipeline must work unchanged when new footage replaces the placeholder.
- Remove the old frontend/public/hero-sequence folder and any leftover zukin_hero_sequence.zip once the new assets work.

## Acceptance criteria (measure and report, do not claim)
- First 5.5 s show no UI at all (verify on desktop and mobile); the UI appears by about 6 s, or immediately on scroll/click/key; hidden UI is unreachable by keyboard until revealed.
- Poster visible immediately; LCP under 2.5 s on throttled mobile 4G; no layout shift (CLS 0).
- intro.mp4 under about 3.5 MB; under 1 MB of journey frames needed before the first scroll interaction on mobile.
- Scrubbing holds 60 fps on a mid-range laptop and a mid-range Android phone (Chrome performance panel; report numbers).
- No visible hard cuts; no popping or flicker when frames load; images look sharp at DPR 2 on a 1440 wide laptop (compare against the current blurry version).
- prefers-reduced-motion and saveData show a static poster with all content visible and no pinning.
- Keyboard and screen reader: Skip intro and Skip to booking links, pause control for the film, real text for all captions, the canvas has an accessible label, focus is never trapped.
- Works in Safari iOS (inline autoplay), Chrome, Firefox.

## Milestones (stop after each one, give me a short demo note and what to test)
- c1: asset pipeline and outputs only. Show me contact sheets of the chosen shots, the intro.mp4 and a before/after still. No UI work yet.
- c2: intro film component (poster, autoplay, skip, scroll cue, fallbacks).
- c3: journey engine only: pinned stage, canvas, Lenis, progressive loading, sub-frame blending, no text. Tune the feel with me.
- c4: chapters and expanding panels, progress rail, i18n copy.
- c5: booking prompt at the end, release into the next section, accessibility and performance pass with measured numbers.

Working style: I am a fullstack developer who wants to learn from this. Small commits on a feature branch, explain the why behind non-obvious choices (especially the smoothing and loading decisions), tell me what you assumed and what you would improve, and ask when something is ambiguous. Give me the compare URL for each pushed branch.
