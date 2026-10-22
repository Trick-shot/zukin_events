# Hero v2 — running decisions

Decisions taken during build that are not in the brief or the addendum, kept
here so later milestones inherit them instead of rediscovering them.

---

## D1. Reload mid-hero must not "catch up" at speed
**Raised by Erick, 2026-10-23. Applies to milestone c3.**

> "when you refresh the page if am in hero section i dont want it to be sped
> up when page resume it should do smoothly in a visible pace"

The failure mode: the scrubber keeps a floating `currentFrame` and lerps it
toward the target each frame. Initialised at frame 1, a reload at 60% scroll
makes it race through ~100 frames to catch up — a visible fast-forward that
looks like a bug.

**Decision:** on mount, seed the lerp's `currentFrame` to
`frameFromProgress(scrollProgressAtLoad)` rather than to the first frame, and
paint that frame before the first visible paint. There is then no catch-up to
animate: the hero simply *is* at the right place, and normal lerped smoothing
resumes from there at its usual pace.

This also satisfies addendum A.5 ("no flash of the wrong frame"). Note the two
requirements are the same fix, not competing ones — seeding removes both the
flash and the rush.

**Test:** scroll to the stage chapter, reload. The canvas shows the stage
frame immediately and does not animate toward it. Scrolling afterwards feels
identical to a fresh load.

---

## D2. Journey sampled at 10 fps, not 12
**Decided during c1.**

The brief asks for "about 150 to 170 frames at about 12 fps". Those cannot
both hold: six shots at lengths that still read on screen total 16.70s of
footage after dissolves, which at 12 fps is 200 frames. At 10 fps it is 168.

Sub-frame blending interpolates between neighbours, so 10 vs 12 fps is not
visible in motion, while 40 extra frames is 5 MB of real bytes on desktop.

---

## D3. Intro encoded two-pass VBR, not crf 20
**Decided during c1.**

The brief suggests "crf about 20 ... aim under 3.5 MB". Measured on this
footage: crf 20 is 14.8 MB, crf 24 is 7.5 MB, crf 28 is 3.9 MB — still over.
6.6s of high-motion drone footage at 1080p is simply expensive.

Two-pass VBR at 4000k lands at 3.15 MB at full 1920x1080, and allocates bits
to the moving parts rather than spreading them evenly, so it looks better than
a single-pass crf squeezed to the same size.

---

## D4. Tier 2 judged before it is applied
**Decided during c1.**

Real-ESRGAN costs ~33s and ~23 MB of intermediate per frame. Applying it to
the 103-frame walk-in is ~1 hour and ~2.4 GB before anyone has looked at it,
and the brief says to reject the AI result outright if it goes waxy. So the
comparison runs on four representative frames first; the full shots are
processed only once the look is approved.
