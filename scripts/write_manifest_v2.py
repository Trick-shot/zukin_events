#!/usr/bin/env python3
"""
Emit frontend/public/hero/manifest.json for the hero v2 loop.

Reads .hero-build/.index (written by the numbering pass) so the frame ranges
are whatever was actually produced, never a guess. Scroll ranges come from the
weights below and are the single place pacing is tuned.

Chapter copy is section K, with L's finale moved outside to the entrance.
Every line is a placeholder for client review; `confirm` marks a claim that
must not ship unverified.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
INDEX = ROOT / ".hero-build/.index"
OUT = ROOT / "frontend/public/hero"

PIN_VH = 700          # total pinned height; the one pacing constant
FPS = 10

# Scroll weight per shot. Deliberately NOT proportional to footage duration:
# the interior is the service, so it buys scroll that its seconds alone would
# not. L's budget: exit 10-12%, parking 8-10%, finale 5%.
WEIGHT = {
    "front_view": 5, "facade_doors": 6, "crossing": 3,
    "arch": 11, "aisle_hall": 11, "hall_wide": 8, "tables": 7,
    "ceiling": 9, "stage": 8, "aisle_decor": 6,
    "exit_reverse": 11, "parking": 10, "finale": 5,
}

CHAPTERS = [
    ("01", "ARRIVAL", "A grand welcome",
     "A bright foyer and a floral arch that set the tone before guests step in.",
     "arch", None),
    ("02", "THE HALL", "Room to celebrate",
     "A spacious, open hall with polished floors and a clear central aisle.",
     "aisle_hall", None),
    ("03", "FURNITURE", "Dressed for every table",
     "Round tables, white and gold chairs, and linens in your colours.",
     "hall_wide", None),
    ("04", "DETAIL", "Details guests notice",
     "Gold charger plates, crystal glassware and fresh floral centrepieces.",
     "tables", None),
    ("05", "LIGHTING", "A ceiling worth looking up at",
     "Crystal chandeliers, glowing pendants and soft draped fabric overhead.",
     "ceiling", None),
    ("06", "THE STAGE", "Where the moment happens",
     "A styled stage with a gold sofa and chairs, floral walls and lanterns.",
     "stage", None),
    ("07", "DECORATION", "Styled to your story",
     "Zukin decoration turns the hall into your theme, from the aisle to the ceiling.",
     "aisle_decor", "decoration packages"),
    ("08", "PARKING AND ACCESS", "Room to arrive",
     "Space to park and a clear approach to the entrance.",
     "parking", "number of parking spaces — show no number until confirmed"),
    ("09", "BOOK", "Reserve your date",
     "Check availability and send your request.",
     "finale", None),
]


def main():
    shots = []
    for line in INDEX.read_text().splitlines():
        if not line.strip():
            continue
        name, tag, first, last = line.split("|")
        shots.append({"id": name, "tag": tag,
                      "frameFrom": int(first), "frameTo": int(last)})

    by_id = {s["id"]: s for s in shots}
    frames = max(s["frameTo"] for s in shots)

    # The exit replays the interior walk-in backwards. It adds scroll but no
    # files: frameFrom > frameTo tells the player to count the index DOWN.
    walk = [by_id[n] for n in ("arch", "aisle_hall") if n in by_id]
    if walk:
        shots.insert(
            [s["id"] for s in shots].index("parking"),
            {"id": "exit_reverse", "tag": "THRESHOLD-OUT",
             "frameFrom": walk[-1]["frameTo"], "frameTo": walk[0]["frameFrom"],
             "reversed": True,
             "note": "replays the walk-in backwards; reuses frames, adds no files"},
        )

    total_w = sum(WEIGHT.get(s["id"], 5) for s in shots)
    cursor = 0.0
    for s in shots:
        w = WEIGHT.get(s["id"], 5)
        s["scrollFrom"] = round(cursor, 4)
        cursor += w / total_w
        s["scrollTo"] = round(cursor, 4)
        s["vhShare"] = round(w / total_w * PIN_VH)
    shots[-1]["scrollTo"] = 1.0

    chapters = []
    for num, eyebrow, title, line, shot_id, confirm in CHAPTERS:
        s = by_id.get(shot_id) or next((x for x in shots if x["id"] == shot_id), None)
        if not s:
            continue
        chapters.append({
            "id": f"ch{num}", "shotId": shot_id,
            "i18nKey": f"hero.chapters.{shot_id}",
            "eyebrow": eyebrow, "title": title, "line": line,
            "scrollFrom": s["scrollFrom"], "scrollTo": s["scrollTo"],
            "side": "left" if int(num) % 2 else "right",
            **({"confirm": confirm} if confirm else {}),
        })

    interior = sum(s["scrollTo"] - s["scrollFrom"] for s in shots
                   if s["tag"] in ("INTERIOR", "THRESHOLD-OUT"))

    manifest = {
        "version": 3,
        "frames": frames,
        "fps": FPS,
        "pattern": "f_%04d.webp",
        "pinVh": PIN_VH,
        "variants": {
            "desktop": {"folder": "d", "interiorWidth": 1920, "exteriorWidth": 1600},
            "mobile": {"folder": "m", "width": 960},
        },
        "intro": {
            "mp4": "intro.mp4", "webm": "intro.webm",
            "poster": "intro-poster.jpg", "posterMobile": "intro-poster-960.jpg",
            "frontView": "front-view.jpg",
            "note": ("loader fades onto the FIRST intro frame (aerial); the intro's "
                     "LAST frame equals journey frame 1 exactly (the held front view)"),
        },
        "interiorScrollShare": round(interior, 4),
        "shots": shots,
        "chapters": chapters,
        "copyStatus": "PLACEHOLDER — every line needs client review; `confirm` fields must not ship unverified",
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")

    print(f"  {frames} frames, {len(shots)} shots, {len(chapters)} chapters")
    print(f"  interior scroll share: {interior*100:.1f}%")
    for s in shots:
        arrow = "<-" if s.get("reversed") else "->"
        print(f"    {s['id']:<14} {s['tag']:<14} {s['scrollFrom']:.3f}-{s['scrollTo']:.3f}"
              f"  frames {s['frameFrom']}{arrow}{s['frameTo']}  {s['vhShare']}vh")


if __name__ == "__main__":
    main()
