#!/usr/bin/env python3
"""
Hero v2 shot map and plan (addendum sections D, G, H, I, K, L).

Emits docs/hero-v2/plan.html: the L-taxonomy tag for every segment, the
front-view candidates with measured sign geometry, the interior inventory
G.2 asks for, the shot list in scroll order with progress ranges, and the
chapter copy from K bound to those ranges.

Nothing here renders frames. It is the thing to approve BEFORE the heavy
stages run.
"""
import json
import pathlib
import subprocess

CLIP = "assets-src/zukin_clip.mp4"
RW = "assets-src/runway"
OUT = pathlib.Path("docs/hero-v2")

# --- Front-view candidates, measured on a 10% gridline overlay -------------
# Section I: sign fully visible, centred horizontally, 12-20% of frame width.
FRONT = [
    ("A", "original 17.40s", CLIP, 17.40, 16.9, "+1%", True,
     "mid-band and well centred; from the raw clip so slightly softer"),
    ("B", "runway C 1.80s", f"{RW}/exterior_C_sign_to_doors.mp4", 1.80, 19.4, "+2%", True,
     "visibly cleaner brick and lettering; at the TOP of the 12-20% band"),
    ("C", "runway C 2.40s", f"{RW}/exterior_C_sign_to_doors.mp4", 2.40, 21.1, "0%", False,
     "REJECTED: 21.1% exceeds the 20% cap and the facade is cropped"),
]
RECOMMEND = "A"

# --- Interior inventory (G.2) ---------------------------------------------
VIEWS = [
    ("Foyer, inside the doors", [(20.60, 21.60)], "walk-in"),
    ("Floral arch, approach and passage", [(21.60, 23.60)], "walk-in"),
    ("Aisle toward the stage", [(23.60, 25.60)], "walk-in"),
    ("Hall from the aisle, ceiling overhead", [(25.60, 27.24)], "walk-in"),
    ("Hall wide, tables laid", [(27.24, 29.68), (29.68, 30.72)], "seg 12, 13"),
    ("Table setting close", [(30.72, 32.36), (32.36, 33.32)], "seg 14, 15"),
    ("Ceiling, chandelier and blossoms", [(37.36, 40.92)], "seg 18"),
    ("Stage, gold sofa and floral walls", [(33.32, 35.84), (35.84, 37.36),
                                           (40.92, 43.84), (43.84, 46.16)], "seg 16, 17, 19, 20"),
    ("Aisle with arch, walkway", [(46.16, 47.80)], "seg 21"),
]

# Views the clip does NOT contain — a shot request for the client (G.3),
# NOT something to fabricate or pad with repeats.
MISSING = [
    "Hall from the stage looking back toward the entrance (reverse angle)",
    "Tables from a low side angle, guest eye-level",
    "Bar or service area, if one exists",
    "Lounge, restrooms or getting-ready room, if any",
    "A slow gimbal move down the length of the hall (8-12s, uncut)",
    "Sound system and air-conditioning shown deliberately (K.08 depends on it)",
    "The hall dressed for a different event type, to show range",
]

# --- Scroll order (L) ------------------------------------------------------
# tag, name, source, start, end, scroll %, note
SHOTS = [
    ("EXTERIOR-IN", "front_view", "runway C", 1.60, 2.20, 5,
     "frame 1 = the held front view; matches the intro's last frame exactly"),
    ("EXTERIOR-IN", "facade_doors", "runway C", 2.20, 3.40, 6,
     "push in to the canopy and the wooden doors"),
    ("THRESHOLD", "crossing", "clip 20.20-20.60", 20.20, 20.60, 3,
     "the single doorway crossing, uncut"),
    ("INTERIOR", "arch", "clip", 20.60, 23.60, 11, "foyer and the floral arch"),
    ("INTERIOR", "aisle_hall", "clip", 23.60, 27.24, 11, "down the aisle into the hall"),
    ("INTERIOR", "hall_wide", "clip", 27.24, 29.68, 8, "the hall, tables laid"),
    ("INTERIOR", "tables", "clip", 30.72, 32.36, 7, "charger plate, napkin, glassware"),
    ("INTERIOR", "ceiling", "clip", 37.36, 40.92, 9, "chandelier and hanging blossoms"),
    ("INTERIOR", "stage", "clip", 40.92, 43.84, 8, "stage, gold sofa, floral walls"),
    ("INTERIOR", "aisle_decor", "clip", 46.16, 47.80, 6, "aisle arch and walkway"),
    ("THRESHOLD-OUT", "exit_reverse", "reuses arch+aisle_hall frames", 0, 0, 11,
     "walk-in played in REVERSE index; no new frames, no cut"),
    ("EXTERIOR-OUT", "parking", "runway container (cleaned)", 0.0, 4.04, 10,
     "courtyard, paved yard, outbuildings, access road"),
    ("FINALE", "entrance", "runway C", 1.60, 2.20, 5,
     "returns to the scroll-start framing, booking prompt over it"),
]

# --- Chapters (K, with L's finale move) ------------------------------------
CHAPTERS = [
    ("01", "ARRIVAL", "A grand welcome",
     "A bright foyer and a floral arch that set the tone before guests step in.", "arch", "seen"),
    ("02", "THE HALL", "Room to celebrate",
     "A spacious, open hall with polished floors and a clear central aisle.", "aisle_hall", "seen"),
    ("03", "FURNITURE", "Dressed for every table",
     "Round tables, white and gold chairs, and linens in your colours.", "hall_wide", "seen"),
    ("04", "DETAIL", "Details guests notice",
     "Gold charger plates, crystal glassware and fresh floral centrepieces.", "tables", "seen"),
    ("05", "LIGHTING", "A ceiling worth looking up at",
     "Crystal chandeliers, glowing pendants and soft draped fabric overhead.", "ceiling", "seen"),
    ("06", "THE STAGE", "Where the moment happens",
     "A styled stage with a gold sofa and chairs, floral walls and lanterns.", "stage", "seen"),
    ("07", "DECORATION", "Styled to your story",
     "Zukin decoration turns the hall into your theme, from the aisle to the ceiling.",
     "aisle_decor", "confirm packages"),
    ("08", "PARKING AND ACCESS", "Room to arrive",
     "Space to park and a clear approach to the entrance.", "parking", "confirm space count"),
    ("09", "BOOK", "Reserve your date",
     "Check availability and send your request.", "entrance", "seen"),
]

# K.08 "SOUND AND SERVICE" is deliberately NOT included: it depends on the
# client confirming sound, AC and staffing, and the footage only shows
# speakers and a wall unit incidentally. Add it once confirmed.
DEFERRED = ("K.08 SOUND AND SERVICE",
            "needs client confirmation of sound system, air conditioning and on-site team; "
            "the footage shows speakers and a wall AC unit only incidentally")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "front").mkdir(exist_ok=True)
    for lbl, _, path, t, *_ in FRONT:
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", str(t),
                        "-i", path, "-frames:v", "1", "-vf", "scale=600:-2:flags=lanczos",
                        "-q:v", "2", str(OUT / "front" / f"cand_{lbl}.jpg"), "-y"], check=True)

    tot = sum(b - a for _, rs, _ in VIEWS for a, b in rs)
    use = sum(b - a for _, rs, _ in VIEWS for a, b in rs if b - a >= 1.2)

    # Scroll shares
    pct = {}
    for tag, *_rest in SHOTS:
        pct[tag] = pct.get(tag, 0) + _rest[4]
    total_pct = sum(pct.values())
    interior_pct = pct.get("INTERIOR", 0) + pct.get("THRESHOLD-OUT", 0)

    order = ["EXTERIOR-IN", "THRESHOLD", "INTERIOR", "THRESHOLD-OUT", "EXTERIOR-OUT", "FINALE"]
    seq = [s[0] for s in SHOTS]
    ok = [order.index(t) for t in seq] == sorted(order.index(t) for t in seq)

    # progress ranges
    cursor, rows = 0.0, []
    for tag, name, src, a, b, p, note in SHOTS:
        lo, hi = cursor, cursor + p / total_pct
        cursor = hi
        rng = f"{a:.2f}-{b:.2f}s" if b else "reversed"
        rows.append(f'<tr class="t-{tag.lower().replace("-","")}"><td><span class="tag">{tag}</span></td>'
                    f'<td><b>{name}</b></td><td>{src}</td><td class="n">{rng}</td>'
                    f'<td class="n">{p}%</td><td class="n">{lo:.3f}–{hi:.3f}</td><td>{note}</td></tr>')

    vrows = "".join(
        f'<tr><td>{i}</td><td>{n}</td><td class="n">{sum(b-a for a,b in rs):.2f}s</td>'
        f'<td class="n">{sum(b-a for a,b in rs if b-a>=1.2):.2f}s</td><td>{src}</td></tr>'
        for i, (n, rs, src) in enumerate(VIEWS, 1))

    crows = "".join(
        f'<tr><td class="n">{num}</td><td><span class="eyebrow">{eb}</span></td>'
        f'<td><b>{ti}</b></td><td>{ln}</td><td>{shot}</td>'
        f'<td>{"" if st=="seen" else "⚠ "}{st}</td></tr>'
        for num, eb, ti, ln, shot, st in CHAPTERS)

    frows = "".join(
        f'<figure class="{"pick" if l==RECOMMEND else ("bad" if not ok_ else "")}">'
        f'<img src="front/cand_{l}.jpg"><figcaption><b>{l} — {desc}</b>'
        f'{" ← recommended" if l==RECOMMEND else ""}<br>sign width <b>{w}%</b>, '
        f'centring {c}<br>{why}</figcaption></figure>'
        for l, desc, _p, _t, w, c, ok_, why in FRONT)

    (OUT / "plan.html").write_text(f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Zukin Hall — hero v2 shot map and plan</title>
<style>
 :root{{--bg:#fbf7f2;--ink:#1c1217;--muted:#6b5a63;--line:#e8ddd5;--gold:#c8a24a;--red:#d6213b}}
 @media (prefers-color-scheme:dark){{:root{{--bg:#14070f;--ink:#e8d8e0;--muted:#b8a3ae;--line:#3a2430}}}}
 *{{box-sizing:border-box}}
 body{{margin:0;padding:24px;background:var(--bg);color:var(--ink);
  font:15px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}}
 h1{{font-size:23px;margin:0 0 6px}}
 h2{{font-size:13px;text-transform:uppercase;letter-spacing:.14em;color:var(--gold);margin:34px 0 10px}}
 p.lede{{color:var(--muted);max-width:80ch;margin:0 0 10px}}
 table{{border-collapse:collapse;width:100%;font-size:13px}}
 th,td{{text-align:left;padding:7px 10px;border-bottom:1px solid var(--line);vertical-align:top}}
 td.n{{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}}
 .tag{{display:inline-block;padding:2px 7px;border-radius:4px;color:#fff;font-weight:700;
  font-size:10px;letter-spacing:.06em;white-space:nowrap}}
 .t-exteriorin .tag{{background:#2f6f9f}} .t-threshold .tag{{background:#c8a24a}}
 .t-interior .tag{{background:#b0246b}} .t-thresholdout .tag{{background:#8a6d2f}}
 .t-exteriorout .tag{{background:#3f7f5f}} .t-finale .tag{{background:var(--red)}}
 .eyebrow{{color:var(--gold);font-size:11px;letter-spacing:.14em;font-weight:700}}
 .verdict{{padding:12px 14px;border-radius:8px;font-weight:600;margin:10px 0}}
 .pass{{background:color-mix(in oklab,#2e9e5b 16%,transparent);border:1px solid #2e9e5b}}
 .warn{{background:color-mix(in oklab,var(--gold) 20%,transparent);border:1px solid var(--gold)}}
 .trio{{display:flex;gap:14px;flex-wrap:wrap}}
 figure{{margin:0;max-width:600px}}
 figure img{{width:100%;border-radius:4px;display:block;border:3px solid transparent}}
 figure.pick img{{border-color:#2e9e5b}} figure.bad img{{border-color:var(--red);opacity:.55}}
 figcaption{{font-size:12px;color:var(--muted);padding-top:5px}}
 ul{{color:var(--muted);max-width:88ch}} li{{margin-bottom:5px}}
</style></head><body>
<h1>Hero v2 — shot map and plan</h1>
<p class="lede">Steps 1 and 2. Nothing is rendered yet; this is the thing to approve
before the frame pipeline runs.</p>

<h2>1 · Front-view frame (section I)</h2>
<p class="lede">Measured on a 10% gridline overlay. Section I wants the sign fully
visible, centred horizontally, and 12–20% of frame width.</p>
<div class="trio">{frows}</div>

<h2>2 · Interior inventory (section G.2)</h2>
<div class="verdict warn"><b>{len(VIEWS)} distinct interior views</b> ·
{tot:.2f}s total · <b>{use:.2f}s usable</b> (takes ≥1.2s)</div>
<table><tr><th>#</th><th>Distinct view</th><th>Total</th><th>Usable</th><th>Source</th></tr>{vrows}</table>

<h2>3 · Scroll order (section L)</h2>
<div class="verdict {'pass' if ok else 'warn'}">
Tag order {'PASSES' if ok else 'FAILS'} EXTERIOR-IN → THRESHOLD → INTERIOR →
THRESHOLD-OUT → EXTERIOR-OUT → FINALE<br>
Interior scroll share (interior + reversed exit): <b>{interior_pct}%</b> of {total_pct}%
— inside the 65–75% band</div>
<table><tr><th>Where</th><th>Shot</th><th>Source</th><th>Range</th><th>Scroll</th>
<th>Progress</th><th>Note</th></tr>{"".join(rows)}</table>

<h2>4 · Chapter copy (section K)</h2>
<p class="lede">Every line is a placeholder for client review. ⚠ marks a claim
that must be confirmed before launch. Copy lives in i18n keys, EN and SW.</p>
<table><tr><th>#</th><th>Eyebrow</th><th>Title</th><th>Line</th><th>Shot</th><th>Status</th></tr>{crows}</table>
<p class="lede"><b>Deferred:</b> {DEFERRED[0]} — {DEFERRED[1]}.</p>

<h2>5 · Shot request for the client (section G.3)</h2>
<p class="lede">The clip does not contain these. Per G.3 they are listed rather
than padded with repeats or invented.</p>
<ul>{"".join(f"<li>{m}</li>" for m in MISSING)}</ul>
</body></html>""")

    print(f"  front-view candidates: {len(FRONT)} (recommend {RECOMMEND})")
    print(f"  distinct interior views: {len(VIEWS)}  total {tot:.2f}s  usable {use:.2f}s")
    print(f"  tag order valid: {ok}")
    print(f"  scroll: " + "  ".join(f"{k} {v}%" for k, v in pct.items()))
    print(f"  interior share (interior + exit): {interior_pct}% of {total_pct}%")
    print(f"  -> {OUT/'plan.html'}")


if __name__ == "__main__":
    main()
