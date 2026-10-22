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

---

## D5. Spatial order: one crossing, never back outside
**Addendum F, 2026-10-23. Audited in c1.**

All 23 detected segments are tagged EXTERIOR / THRESHOLD / INTERIOR in
`scripts/audit_sheet.py` and rendered to `docs/hero-v2/contact/audit.html`.
The proposed order passes `E E E E E T I I I I I I`.

The threshold is at **source 20.20s** — measured, not guessed: sampling the
walk-in at 0.6s intervals shows the camera still under the canopy at 19.6s and
through the wooden doors by 20.2s.

The walk-in take is listed as three rows (ext / cross / int) only to show
where it crosses. It is never cut there — it is the one uncut take in the
sequence, which is exactly why the single doorway crossing is seamless.

**The one spatial jump I could not remove** (rule 6 asks for these): frame 1 is
the front view at 17.40s, and the next beat is the aerial orbit. That is a
pull-back from ground level to the air. It is unavoidable given the order the
addendum specifies (front view -> aerial -> ground -> facade -> doors), and it
also means the facade appears twice: once as frame 1, once as the head of the
walk-in. Both are frontal views of the same wall, so it reads as a return
rather than a contradiction — but it is a cut outward, and the only one.

If you would rather have zero outward movement, the alternative is to drop the
separate front-view beat and start the walk-in at 17.40 so frame 1 *is* the
front view, giving `facade -> doors -> inside` with the aerial living only in
the intro film. That costs the aerial its place in the journey.

---

## D6. Payload at the new spec needs a decision
**Raised in c1 after addendum D.**

1920-wide frames at q85 are roughly 311 KB each (measured baseline: 127 KB at
1600/q72; 1920 is 1.44x the pixels and q85 about 1.7x the bytes).

| fps | frames | desktop payload |
| --- | --- | --- |
| 8 | 188 | ~57 MB |
| 10 | 235 | ~71 MB |
| 12 | 282 | ~86 MB |

For comparison the current shipped set is 20.9 MB. Real-ESRGAN on the
interior frames alone is ~1.7 h of compute at 10 fps.

No decision taken — this is a trade for Erick between fidelity and weight.

---

## D7. Loop structure supersedes the "ends inside" rule
**Addendum L, 2026-10-23.**

The journey is now a loop: EXTERIOR-IN -> THRESHOLD -> INTERIOR ->
THRESHOLD-OUT -> EXTERIOR-OUT (parking) -> FINALE. This replaces F.1/F.3
("never back outside") and D.3 ("last frame inside"). The spirit of F
survives: no RANDOM jumps, every move between inside and outside is one
continuous, believable path.

The exit is the walk-in take played at a descending frame index. No new
frames, no cut, and spatially exact because it is literally the same camera
path in reverse.

**Reverse-safety checked** (L requires it): sampling 20.7-27.0s at 0.7s steps
shows the interior walk-in is empty of people, with no moving objects and no
doors opening. Reversing frame order does not mirror the image, so the stage
signage stays readable. Safe to reverse.

---

## D8. The aerial moves to the intro, which is what makes the interior share work
**Addendum H + G, 2026-10-23.**

H puts the aerial orbit and the ground approach in the INTRO FILM, not the
scroll journey. That single change is what lets the interior clear its share:
the scroll journey now starts on the held front view and goes straight to the
doors.

Measured allocation: EXTERIOR-IN 11%, THRESHOLD 3%, INTERIOR 60%,
THRESHOLD-OUT 11%, EXTERIOR-OUT 10%, FINALE 5%. Interior plus the reversed
exit is **71%**, inside the 65-75% band.

---

## D9. Interior inventory, and what the clip does not have
**Addendum G.2/G.3.**

**9 distinct interior views, 27.20s total, 24.20s usable** (takes >=1.2s).

That is enough for seven interior chapters without repeating a viewpoint. It
is NOT enough to pad toward a higher share honestly, so per G.3 the missing
views are listed as a client shot request in `docs/hero-v2/plan.html` rather
than invented or looped. The most valuable asks: a reverse angle from the
stage, a low guest-eye table shot, and one slow 8-12s uncut gimbal move down
the hall.

K.08 "SOUND AND SERVICE" is deferred: the footage shows speakers and a wall
AC unit only incidentally, and the line claims a service the client has not
confirmed.

---

## D10. Third-party wedding banner is masked, not cropped
**Raised by Erick, 2026-10-23.**

A banner by the doors carries another client's **photograph and names**
("Welcome to Rega…"). That is identifiable personal data about people who did
not agree to appear on this site, so it is removed rather than left in.

Measured on a 10% grid, it appears in BOTH sources, in the lower-right
quadrant running to the frame edges:

| Source | Visible | Frames |
| --- | --- | --- |
| exterior_C cleaned | 3.00–3.70s | ~18 |
| original clip | 19.70–20.35s | ~16 |

**The first fix leaked, and the leak is the lesson.** I sized a feathered
blur from two sampled frames. In a third frame the camera angle put the
banner ~150px higher, so a man's face sat ABOVE the box — sharp, identifiable,
and *sharpened further by Real-ESRGAN*, which made it more identifiable than
the source. Sampling two frames to bound a moving object was the error; it
only surfaced because I looked at the staged output rather than trusting the
earlier verification.

**The fix is to avoid the frames, not to blur them.** Measured entry and exit
at 1:1 on the right edge:

| Source | Banner present | Window now used |
| --- | --- | --- |
| exterior_C cleaned | from ~2.70s | 1.70-2.65 |
| original clip | until ~20.40s | 20.42-20.82 |

Both windows are now banner-free by measurement, and **every frame** of the
two risky shots is checked, not a sample. The parking clip is clean (no
banner, no people, no signage).

The feathered-blur mask is kept in the script but DISABLED on every shot:
once the windows avoid the banner it only destroys a quarter of the frame
for no benefit. Re-enable it on any shot retimed back over the banner.

---

## D11. The cleaned sign-to-doors clip is good, with one caveat
**Checked at Erick's request, 2026-10-23.**

Compared cleaned against UNCLEANED (same clip, same timestamps) so only the
cleaning differs — not against the original, which would also fold in the
grade.

- The pine branch is cleanly removed, no ghosting or smear.
- The sky is **not** flatter; the cleaned version holds slightly MORE cloud
  structure. My first read of a "magenta artefact" was wrong — that red strip
  was the sign itself bleeding into my crop.
- Sign lettering passes I.4: same typeface, proportions and spacing, slate
  matching piece-for-piece. Enhanced, not invented.

**Caveat worth knowing:** Runway also painted construction debris off the
canopy roof — planks and scattered objects present in the original. Probably
desirable for marketing, but the cleaned clip is no longer a faithful record
of the building as it stands.

---

## D12. Front view at Tier 2 — lettering verified
**Addendum I.4.**

At 1:1 on the shipped pixels, original vs Tier 1 vs Tier 2: the letterforms
stay faithful through Tier 2 (same slab typeface, proportions, spacing,
drop-shadow intact; spelling correct). Tier 2 is sharpest — slate gains
individual stone definition and brick mortar lines resolve where the original
is mushy. **No rejection; Tier 2 kept for the front view.**

---

## D13. Real-ESRGAN cost, measured not estimated

At 1920 input: **44.9s per frame**, **48 MB per intermediate** (7680x4320).
~198 interior frames is **~2.5 hours**. Each intermediate is deleted the
moment it is downscaled, so peak disk stays near one frame.

Shots stage under their own name and a separate numbering pass walks the shot
table in scroll order. Without that split, filtering by tier processed shots
out of order and scrambled the frame numbering — and it also makes a 2.5 hour
run resumable rather than all-or-nothing.
