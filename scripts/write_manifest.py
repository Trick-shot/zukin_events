#!/usr/bin/env python3
"""
Emit frontend/public/hero/manifest.json.

The manifest is the one place that knows how scroll maps onto frames, so
re-pacing the hero means editing this table (or the shot table that feeds it)
rather than touching a component.

Scroll ranges are deliberately NOT proportional to footage duration. The
walk-in is 52% of the footage but carries four distinct beats (sign, doors,
arch, aisle), so it earns the most scroll; the room shots are short clips that
would otherwise flash past in 40vh. Allocating scroll by narrative weight
instead of by seconds is what lets every shot clear the brief's ~80vh floor.
"""
import json
import os
import pathlib

fps = float(os.environ["JOURNEY_FPS"])
dissolve = float(os.environ["JOURNEY_DISSOLVE"])
frames = int(os.environ["FRAME_COUNT"])
out = pathlib.Path(os.environ["OUT"])
pin_vh = int(os.environ["PIN_VH"])
w_d, w_m = int(os.environ["W_D"]), int(os.environ["W_M"])

rows = [r for r in os.environ["JOURNEY_SHOTS_STR"].splitlines() if r.strip()]
shots = []
for row in rows:
    name, start, end, stab, note = row.split("|")
    shots.append({"name": name, "start": float(start), "end": float(end), "note": note})

# Where each shot lands on the joined timeline. xfade overlaps clips, so every
# shot after the first begins one dissolve earlier than its raw duration
# implies — miss this and the chapter boundaries drift later and later.
acc = 0.0
for i, shot in enumerate(shots):
    shot["t_start"] = acc
    dur = shot["end"] - shot["start"]
    acc += dur - (dissolve if i < len(shots) - 1 else 0)
    shot["t_end"] = shot["t_start"] + dur
total = acc

# Scroll weight per shot: narrative, not seconds.
WEIGHT = {
    "walkin": 240, "hall_wide": 85, "table_setting": 85,
    "ceiling": 85, "stage": 85, "aisle": 70,
}
weights = [WEIGHT.get(s["name"], 85) for s in shots]
wsum = sum(weights)

chapters = []
cursor = 0.0
for shot, w in zip(shots, weights):
    span = w / wsum
    f_from = max(1, min(frames, round(shot["t_start"] * fps) + 1))
    f_to = max(1, min(frames, round(shot["t_end"] * fps)))
    chapters.append({
        "id": shot["name"],
        "scrollFrom": round(cursor, 4),
        "scrollTo": round(cursor + span, 4),
        "frameFrom": f_from,
        "frameTo": f_to,
        "vh": w,
        "note": shot["note"],
    })
    cursor += span
chapters[-1]["scrollTo"] = 1.0

manifest = {
    "version": 2,
    "frames": frames,
    "fps": fps,
    "pattern": "f_%04d.webp",
    "pinVh": pin_vh,
    "dissolve": dissolve,
    "variants": {
        "desktop": {"folder": "d", "width": w_d},
        "mobile": {"folder": "m", "width": w_m},
    },
    "intro": {
        "mp4": "intro.mp4",
        "webm": "intro.webm",
        "poster": "intro-poster.jpg",
        "posterMobile": "intro-poster-960.jpg",
        # The film ends holding on the sign; the journey opens on the same
        # sign, so scrolling continues one camera move instead of cutting.
        "handoffNote": "intro ends at source 18.60s; journey frame 1 is source 16.90s",
    },
    "source": (
        "assets-src/zukin_clip.mp4, Tier 1 graded. Regenerate with "
        "scripts/build_hero_assets.sh journey"
    ),
    "chapters": chapters,
}

(out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")

print(f"  {frames} frames, {total:.2f}s of footage, {len(chapters)} chapters")
for c in chapters:
    print(f"    {c['id']:<14} scroll {c['scrollFrom']:.3f}-{c['scrollTo']:.3f}"
          f"  frames {c['frameFrom']:>3}-{c['frameTo']:<3}  {c['vh']}vh")
