#!/usr/bin/env python3
"""
Build the original / Tier 1 / Tier 2 comparison page.

Crops are taken at 1:1 from the 1600px delivery frames and shown without any
CSS scaling, so what you see is literally the pixels that ship. Anything
scaled in the browser would hide exactly the difference we are judging.
"""
import os
import pathlib
import subprocess

TMP = pathlib.Path(os.environ["TMP"])
CDIR = pathlib.Path(os.environ["CDIR"])
W = int(os.environ["W"])

CROP = 460  # 1:1 pixels shown per crop

# Where to look on each frame, as fractions of the frame, picked for the
# features the brief names: lettering, brick, petals, chair backs.
REGIONS = {
    "sign":   [("lettering + brick", 0.50, 0.33), ("window frames", 0.26, 0.55)],
    "arch":   [("petals on the arch", 0.50, 0.42), ("chairs + table", 0.74, 0.70)],
    "hall":   [("ceiling flowers", 0.46, 0.30), ("chair backs", 0.30, 0.72)],
    "aerial": [("roof edge + render", 0.46, 0.46), ("distant buildings", 0.74, 0.26)],
}

rows = [r for r in os.environ["COMPARE_STR"].splitlines() if r.strip()]
frames = [r.split("|") for r in rows]

CDIR.mkdir(parents=True, exist_ok=True)
(CDIR / "crops").mkdir(exist_ok=True)

def crop(src, dst, cx, cy):
    """Centre-weighted crop, clamped so it never runs off the frame."""
    x = max(0, min(int(cx * W) - CROP // 2, W - CROP))
    y = max(0, min(int(cy * (W * 9 // 16)) - CROP // 2, (W * 9 // 16) - CROP))
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(src),
         "-vf", f"crop={CROP}:{CROP}:{x}:{y}", "-q:v", "2", str(dst)],
        check=True,
    )

TIERS = [("t0", "Original"), ("t1", "Tier 1 (ffmpeg)"), ("t2", "Tier 2 (Real-ESRGAN)")]

blocks = []
for name, t, note in frames:
    # Full frames, scaled down, purely for orientation.
    for tier, _ in TIERS:
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
             "-i", str(TMP / f"{name}_{tier}.png"),
             "-vf", "scale=520:-2:flags=lanczos", "-q:v", "3",
             str(CDIR / "crops" / f"{name}_{tier}_full.jpg")],
            check=True,
        )

    region_html = ""
    for ri, (label, cx, cy) in enumerate(REGIONS[name]):
        cells = ""
        for tier, tier_label in TIERS:
            out = CDIR / "crops" / f"{name}_{ri}_{tier}.jpg"
            crop(TMP / f"{name}_{tier}.png", out, cx, cy)
            cells += (f'<figure><img src="crops/{out.name}" width="{CROP}" '
                      f'height="{CROP}"><figcaption>{tier_label}</figcaption></figure>')
        region_html += f'<h3>{label}</h3><div class="trio">{cells}</div>'

    full = "".join(
        f'<figure><img src="crops/{name}_{tier}_full.jpg">'
        f'<figcaption>{lbl}</figcaption></figure>' for tier, lbl in TIERS
    )
    blocks.append(
        f'<section><h2>{name} <span class="t">@ {t}s</span></h2>'
        f'<p class="note">{note}</p>'
        f'<div class="trio small">{full}</div>{region_html}</section>'
    )

(CDIR / "index.html").write_text(f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Zukin Hall — original vs Tier 1 vs Tier 2</title>
<style>
  :root {{ --bg:#fbf7f2; --ink:#1c1217; --muted:#6b5a63; --line:#e8ddd5; --gold:#c8a24a; }}
  @media (prefers-color-scheme: dark) {{
    :root {{ --bg:#14070f; --ink:#e8d8e0; --muted:#b8a3ae; --line:#3a2430; }}
  }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; padding:24px; background:var(--bg); color:var(--ink);
    font:15px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }}
  h1 {{ font-size:22px; margin:0 0 6px; }}
  h2 {{ font-size:18px; margin:36px 0 2px; }}
  h2 .t {{ color:var(--muted); font-weight:400; font-size:14px; }}
  h3 {{ font-size:13px; text-transform:uppercase; letter-spacing:.14em;
    color:var(--gold); margin:22px 0 8px; }}
  p.note, p.lede {{ color:var(--muted); margin:0 0 10px; max-width:74ch; }}
  section {{ border-top:1px solid var(--line); padding-top:4px; }}
  .trio {{ display:flex; gap:12px; flex-wrap:wrap; }}
  .trio.small img {{ width:520px; height:auto; }}
  figure {{ margin:0; }}
  figure img {{ display:block; border-radius:3px; max-width:100%; height:auto; }}
  figcaption {{ font-size:12px; color:var(--muted); padding-top:4px; }}
</style></head><body>
<h1>Original vs Tier 1 vs Tier 2</h1>
<p class="lede">Crops are {CROP}x{CROP} at 1:1 from the {W}px delivery frames —
no browser scaling, so this is the pixels that ship. Tier 2 is Real-ESRGAN
x4 on the Tier 1 frame, resampled back to {W}px.</p>
{''.join(blocks)}
</body></html>""")
print(f"  {len(frames)} frames, {sum(len(REGIONS[f[0]]) for f in frames)} crop pairs")
