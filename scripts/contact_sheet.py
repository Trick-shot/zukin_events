#!/usr/bin/env python3
"""
Contact-sheet helper for build_hero_assets.sh.

Split out of the shell script because building an HTML table and slicing
segment timings is miserable in bash and obvious in Python. Reads its inputs
from the environment so the shell stays the single source of paths.
"""
import os
import pathlib
import subprocess
import sys

SRC = os.environ["SRC"]
CDIR = pathlib.Path(os.environ["CDIR"])
DUR = float(os.environ["DUR"])

# Shots proposed for the hero, as (stage, name, start, end). Kept in step with
# the tables at the top of build_hero_assets.sh so the sheet highlights exactly
# what is on the table for review.
PROPOSED = [
    ("intro", "aerial_orbit", 9.12, 12.88),
    ("intro", "ground_yard", 12.88, 15.40),
    ("intro", "sign", 16.90, 18.60),
    ("journey", "walkin", 16.90, 27.24),
    ("journey", "hall_wide", 27.24, 29.68),
    ("journey", "table_setting", 30.72, 33.32),
    ("journey", "ceiling", 37.36, 40.92),
    ("journey", "stage", 40.92, 43.84),
    ("journey", "aisle", 46.16, 47.80),
    ("journey", "closing_aerial", 51.20, 53.60),
]


def segments():
    cuts = [float(line) for line in (CDIR / "cuts.txt").read_text().split()]
    bounds = [0.0] + [c for c in cuts if 0.2 < c < DUR - 0.2] + [DUR]
    return [(bounds[i], bounds[i + 1]) for i in range(len(bounds) - 1)]


def extract_segments():
    out = CDIR / "shots"
    out.mkdir(parents=True, exist_ok=True)
    for i, (a, b) in enumerate(segments(), 1):
        mid = a + (b - a) / 2
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", f"{mid:.2f}",
             "-i", SRC, "-frames:v", "1",
             "-vf", "scale=640:-1:flags=lanczos", "-q:v", "3",
             str(out / f"shot_{i:02d}.jpg"), "-y"],
            check=True,
        )
    print(f"  {len(segments())} segment stills")


def picks_for(a, b):
    """Which proposed shots overlap this second/segment."""
    return [p for p in PROPOSED if p[2] < b and p[3] > a]


def html():
    segs = segments()
    secs = sorted((CDIR / "sec").glob("s_*.jpg"))

    rows = []
    for i, (a, b) in enumerate(segs, 1):
        hits = picks_for(a, b)
        label = ", ".join(f"{p[1]}" for p in hits) or "—"
        cls = "used" if hits else "unused"
        rows.append(
            f'<tr class="{cls}"><td>{i}</td><td class="n">{a:.2f}</td>'
            f'<td class="n">{b:.2f}</td><td class="n">{b - a:.2f}</td>'
            f'<td><img src="shots/shot_{i:02d}.jpg" loading="lazy"></td>'
            f'<td>{label}</td></tr>'
        )

    tiles = []
    for idx, path in enumerate(secs):
        t = idx  # fps=1, so tile N is second N
        hits = picks_for(t, t + 1)
        cls = "used" if hits else ""
        tiles.append(
            f'<figure class="{cls}"><img src="sec/{path.name}" loading="lazy">'
            f'<figcaption>{t:02d}s</figcaption></figure>'
        )

    proposed_rows = "".join(
        f'<tr><td>{s}</td><td>{n}</td><td class="n">{a:.2f}</td>'
        f'<td class="n">{b:.2f}</td><td class="n">{b - a:.2f}</td></tr>'
        for s, n, a, b in PROPOSED
    )

    (CDIR / "index.html").write_text(f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Zukin Hall — source clip contact sheet</title>
<style>
  :root {{ --bg:#fbf7f2; --ink:#1c1217; --muted:#6b5a63; --line:#e8ddd5;
           --used:#d6213b; --gold:#c8a24a; }}
  @media (prefers-color-scheme: dark) {{
    :root {{ --bg:#14070f; --ink:#e8d8e0; --muted:#b8a3ae; --line:#3a2430; }}
  }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; padding:24px; background:var(--bg); color:var(--ink);
         font:15px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }}
  h1 {{ font-size:22px; margin:0 0 4px; }}
  h2 {{ font-size:16px; margin:32px 0 10px; text-transform:uppercase;
        letter-spacing:.14em; color:var(--gold); }}
  p.lede {{ color:var(--muted); margin:0 0 8px; max-width:70ch; }}
  table {{ border-collapse:collapse; width:100%; font-size:13px; }}
  th,td {{ text-align:left; padding:6px 10px; border-bottom:1px solid var(--line);
           vertical-align:middle; }}
  td.n {{ text-align:right; font-variant-numeric:tabular-nums; }}
  tr.used {{ background:color-mix(in oklab, var(--used) 10%, transparent); }}
  tr.unused {{ opacity:.55; }}
  table img {{ width:160px; height:auto; border-radius:4px; display:block; }}
  .grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr));
           gap:10px; }}
  figure {{ margin:0; }}
  figure img {{ width:100%; height:auto; border-radius:4px; display:block;
                border:2px solid transparent; }}
  figure.used img {{ border-color:var(--used); }}
  figcaption {{ font-size:11px; color:var(--muted); padding-top:3px;
                font-variant-numeric:tabular-nums; }}
  .wrap {{ overflow-x:auto; }}
</style></head><body>
<h1>Zukin Hall — source clip contact sheet</h1>
<p class="lede">{SRC.split('/')[-1]} — {DUR:.2f}s, {len(segs)} detected segments.
Red outline = part of a proposed shot.</p>

<h2>Proposed shot list (awaiting sign-off)</h2>
<div class="wrap"><table>
<tr><th>Stage</th><th>Name</th><th>Start</th><th>End</th><th>Len</th></tr>
{proposed_rows}
</table></div>

<h2>Every detected segment</h2>
<div class="wrap"><table>
<tr><th>#</th><th>Start</th><th>End</th><th>Len</th><th>Frame</th><th>Used as</th></tr>
{''.join(rows)}
</table></div>

<h2>Second by second</h2>
<div class="grid">{''.join(tiles)}</div>
</body></html>""")
    print(f"  {CDIR / 'index.html'}")


if __name__ == "__main__":
    {"segments": extract_segments, "html": html}[sys.argv[1]]()
