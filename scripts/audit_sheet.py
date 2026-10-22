#!/usr/bin/env python3
"""
Spatial audit for addendum section F.

Tags every detected segment EXTERIOR / THRESHOLD / INTERIOR and checks the
proposed journey reads exactly E...E, T, I...I — the rule that the viewer
crosses the doorway once and never goes back outside.

Tags are from watching the segment stills, recorded here rather than guessed
at render time so the ordering can be checked without re-watching the clip.
"""
import json
import os
import pathlib
import subprocess

SRC = "assets-src/zukin_clip.mp4"
CDIR = pathlib.Path("docs/hero-v2/contact")

# seg -> (tag, where the camera is)
TAGS = {
    1:  ("EXTERIOR", "facade + sign, oblique, backlit"),
    2:  ("EXTERIOR", "facade + sign, 3/4 view, canopy"),
    3:  ("EXTERIOR", "aerial, side building, paved yard"),
    4:  ("EXTERIOR", "aerial, side building, parked truck"),
    5:  ("EXTERIOR", "ground, side view, brick tower + entrance"),
    6:  ("EXTERIOR", "aerial, straight-on entrance, green lawn"),
    7:  ("EXTERIOR", "aerial oblique, whole compound"),
    8:  ("EXTERIOR", "aerial orbit, whole compound"),
    9:  ("EXTERIOR", "ground approach across the yard"),
    10: ("EXTERIOR", "ground, through the gate, tree blocks the view"),
    11: ("MIXED",    "walk-in: facade -> doors (E) -> crossing (T) -> hall (I)"),
    12: ("INTERIOR", "hall wide, tables laid"),
    13: ("INTERIOR", "hall wide, ceiling lights"),
    14: ("INTERIOR", "table setting, charger plate, napkin"),
    15: ("INTERIOR", "table setting detail, glasses"),
    16: ("INTERIOR", "stage, gold sofa"),
    17: ("INTERIOR", "stage, closer"),
    18: ("INTERIOR", "ceiling, chandelier + hanging flowers"),
    19: ("INTERIOR", "stage, gold sofa, flower walls"),
    20: ("INTERIOR", "stage wide, flowers in foreground"),
    21: ("INTERIOR", "aisle, arch, walkway"),
    22: ("EXTERIOR", "aerial, whole compound"),
    23: ("EXTERIOR", "aerial, fades to black"),
}

THRESHOLD_T = 20.20   # where the walk-in crosses the wooden doors

FRONT_VIEW = [
    ("A", 16.80, "widest, most context — but sun flare left, pine tree right, sign off-centre"),
    ("B", 17.40, "sign and brick tower centred, facade symmetric, clean sky, no intrusions"),
    ("C", 17.90, "centred but tight — facade cropped at the sides, reads as a close-up"),
]
RECOMMEND = "B"

# Proposed journey, in order. (name, start, end, tag, why)
JOURNEY = [
    ("front_view",   17.40, 18.00, "EXTERIOR", "frame 1 = the chosen front view"),
    ("aerial_orbit",  9.45, 11.75, "EXTERIOR", "overview of the whole compound"),
    ("side_view",     4.96,  6.20, "EXTERIOR", "ground, the building's flank"),
    ("ground_approach", 12.95, 15.15, "EXTERIOR", "walking across the yard"),
    ("walkin_ext",   16.90, 20.20, "EXTERIOR", "facade -> sign -> canopy -> doors"),
    ("walkin_cross", 20.20, 20.60, "THRESHOLD", "crossing the wooden doors (uncut)"),
    ("walkin_int",   20.60, 27.24, "INTERIOR", "lobby -> arch -> aisle -> hall (uncut)"),
    ("hall_wide",    27.24, 29.68, "INTERIOR", "the hall, tables laid"),
    ("tables",       30.72, 32.36, "INTERIOR", "charger plate, napkin, glasses"),
    ("ceiling",      37.36, 40.92, "INTERIOR", "chandelier and hanging flowers"),
    ("stage",        40.92, 43.84, "INTERIOR", "stage, gold sofa, flower walls"),
    ("aisle",        46.16, 47.80, "INTERIOR", "aisle arch — journey ends here"),
]

DROPPED = [
    (22, "aerial after the threshold — section F forbids any exterior frame once inside"),
    (23, "same, and it fades to black"),
    (6,  "aerial straight-on: duplicates the overview and re-raises the camera"),
    (7,  "aerial oblique: folded into the single orbit beat"),
    (3,  "aerial side building: a spatial detour away from the entrance"),
    (4,  "aerial side building: same"),
    (1,  "facade oblique + backlit; the frontal walk-in head is better"),
    (2,  "facade 3/4; same reason"),
    (10, "tree blocks the building; nothing legible"),
    (13, "1.04s — under the 1.2s floor"),
    (15, "0.96s — under the 1.2s floor"),
    (16, "stage, but chronologically before the ceiling; the tour order puts stage after"),
    (17, "stage closer — duplicates the chosen stage beat"),
    (20, "stage wide — duplicates the chosen stage beat"),
]


def order_ok(seq):
    """Tags must read E...E, T, I...I — one crossing, never back out."""
    order = {"EXTERIOR": 0, "THRESHOLD": 1, "INTERIOR": 2}
    vals = [order[t] for _, _, _, t, _ in seq]
    return all(a <= b for a, b in zip(vals, vals[1:])), vals


def main():
    (CDIR / "front").mkdir(parents=True, exist_ok=True)
    for lbl, t, _ in FRONT_VIEW:
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", str(t),
                        "-i", SRC, "-frames:v", "1", "-vf",
                        "scale=640:-2:flags=lanczos", "-q:v", "2",
                        str(CDIR / "front" / f"fv_{lbl}.jpg"), "-y"], check=True)

    ok, vals = order_ok(JOURNEY)
    ext = sum(e - s for _, s, e, t, _ in JOURNEY if t == "EXTERIOR")
    thr = sum(e - s for _, s, e, t, _ in JOURNEY if t == "THRESHOLD")
    inte = sum(e - s for _, s, e, t, _ in JOURNEY if t == "INTERIOR")
    total = ext + thr + inte
    share = inte / total * 100

    fv = "".join(
        f'<figure class="{"pick" if l == RECOMMEND else ""}">'
        f'<img src="front/fv_{l}.jpg"><figcaption><b>{l} — {t}s</b>'
        f'{" (recommended)" if l == RECOMMEND else ""}<br>{why}</figcaption></figure>'
        for l, t, why in FRONT_VIEW)

    jrows = "".join(
        f'<tr class="tag-{t.lower()}"><td>{i}</td><td><b>{n}</b></td>'
        f'<td class="n">{s:.2f}</td><td class="n">{e:.2f}</td>'
        f'<td class="n">{e-s:.2f}</td><td><span class="tag">{t[0]}</span> {t}</td>'
        f'<td>{why}</td></tr>'
        for i, (n, s, e, t, why) in enumerate(JOURNEY, 1))

    srows = ""
    for i in sorted(TAGS):
        tag, where = TAGS[i]
        used = any(abs(s - 16.90) < 9 for _, s, _, _, _ in JOURNEY) if i == 11 else None
        srows += (f'<tr class="tag-{tag.lower()}"><td>{i}</td>'
                  f'<td><img src="shots/shot_{i:02d}.jpg"></td>'
                  f'<td><span class="tag">{tag[0]}</span> {tag}</td><td>{where}</td></tr>')

    drops = "".join(f"<li><b>segment {i}</b> — {why}</li>" for i, why in DROPPED)

    (CDIR / "audit.html").write_text(f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Zukin Hall — spatial audit (E / T / I)</title>
<style>
 :root{{--bg:#fbf7f2;--ink:#1c1217;--muted:#6b5a63;--line:#e8ddd5;--gold:#c8a24a;
  --e:#2f6f9f;--t:#c8a24a;--i:#b0246b;}}
 @media (prefers-color-scheme:dark){{:root{{--bg:#14070f;--ink:#e8d8e0;--muted:#b8a3ae;--line:#3a2430;}}}}
 *{{box-sizing:border-box}}
 body{{margin:0;padding:24px;background:var(--bg);color:var(--ink);
  font:15px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}}
 h1{{font-size:22px;margin:0 0 6px}}
 h2{{font-size:13px;text-transform:uppercase;letter-spacing:.14em;color:var(--gold);margin:34px 0 10px}}
 p.lede{{color:var(--muted);max-width:76ch;margin:0 0 6px}}
 table{{border-collapse:collapse;width:100%;font-size:13px}}
 th,td{{text-align:left;padding:7px 10px;border-bottom:1px solid var(--line);vertical-align:middle}}
 td.n{{text-align:right;font-variant-numeric:tabular-nums}}
 td img{{width:150px;border-radius:4px;display:block}}
 .tag{{display:inline-block;width:19px;height:19px;line-height:19px;text-align:center;
  border-radius:4px;color:#fff;font-weight:700;font-size:11px;margin-right:5px}}
 .tag-exterior .tag{{background:var(--e)}} .tag-threshold .tag{{background:var(--t)}}
 .tag-interior .tag{{background:var(--i)}} .tag-mixed .tag{{background:#777}}
 .verdict{{padding:12px 14px;border-radius:8px;font-weight:600;margin:10px 0}}
 .pass{{background:color-mix(in oklab,#2e9e5b 16%,transparent);border:1px solid #2e9e5b}}
 .trio{{display:flex;gap:14px;flex-wrap:wrap}}
 figure{{margin:0;max-width:640px}} figure img{{width:100%;border-radius:4px;display:block;border:3px solid transparent}}
 figure.pick img{{border-color:var(--gold)}}
 figcaption{{font-size:12px;color:var(--muted);padding-top:5px}}
 ul{{color:var(--muted);max-width:86ch}} li{{margin-bottom:4px}}
 code{{background:color-mix(in oklab,var(--ink) 8%,transparent);padding:1px 5px;border-radius:3px}}
</style></head><body>
<h1>Spatial audit — one path, outside &rarr; doorway &rarr; inside</h1>
<p class="lede">Addendum F: the tags must read E&hellip;E, T, I&hellip;I, with a single
crossing of the doorway and no exterior frame after it.</p>

<h2>Front-view candidates (addendum E)</h2>
<div class="trio">{fv}</div>

<h2>Proposed journey order</h2>
<div class="verdict pass">Tag sequence: {' '.join(t[0] for _,_,_,t,_ in JOURNEY)}
&nbsp;&mdash;&nbsp; {'PASSES' if ok else 'FAILS'} E&hellip;E, T, I&hellip;I</div>
<p class="lede">Interior {inte:.2f}s of {total:.2f}s = <b>{share:.1f}%</b> of footage
(target &ge;65%). The walk-in is one uncut take listed in three rows only to show
where it crosses the threshold &mdash; it is never cut there.</p>
<table><tr><th>#</th><th>Shot</th><th>Start</th><th>End</th><th>Len</th><th>Where</th><th>Why</th></tr>
{jrows}</table>

<h2>All 23 detected segments, tagged</h2>
<table><tr><th>#</th><th>Frame</th><th>Where</th><th>Camera position</th></tr>{srows}</table>

<h2>Dropped, and why</h2>
<ul>{drops}</ul>
</body></html>""")

    print(f"  tag sequence: {' '.join(t[0] for _,_,_,t,_ in JOURNEY)}")
    print(f"  E...E,T,I...I: {'PASS' if ok else 'FAIL'}")
    print(f"  interior {inte:.2f}s / {total:.2f}s = {share:.1f}%  (target >=65%)")
    print(f"  exterior {ext:.2f}s, threshold {thr:.2f}s")
    print(f"  -> {CDIR/'audit.html'}")


if __name__ == "__main__":
    main()
