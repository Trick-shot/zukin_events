#!/usr/bin/env bash
#
# ZUKIN HALL — hero asset pipeline
# ================================
#
# Turns assets-src/zukin_clip.mp4 into everything the hero needs:
#   frontend/public/hero/intro.mp4|.webm|-poster.jpg   the autoplay intro film
#   frontend/public/hero/journey/{d,m}/f_%04d.webp     the scroll-scrubbed frames
#   frontend/public/hero/manifest.json                 frame + chapter table
#
# Idempotent: every stage writes to a temp dir and only replaces its outputs on
# success, so re-running after a tweak is safe and cheap.
#
# Usage:
#   ./scripts/build_hero_assets.sh check      # what tools are present
#   ./scripts/build_hero_assets.sh contact    # contact sheet, for choosing shots
#   ./scripts/build_hero_assets.sh intro      # intro film + posters
#   ./scripts/build_hero_assets.sh journey    # journey frame sets
#   ./scripts/build_hero_assets.sh compare    # original vs Tier 1 vs Tier 2 crops
#   ./scripts/build_hero_assets.sh all
#
# Env overrides:
#   TIER2=1   use Tier 2 (AI-restored) intermediates where they exist
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/assets-src/zukin_clip.mp4"
OUT="$ROOT/frontend/public/hero"
WORK="$ROOT/.hero-build"          # gitignored scratch; safe to delete
DOCS="$ROOT/docs/hero-v2"

# ---------------------------------------------------------------------------
# SHOT TABLE
# ---------------------------------------------------------------------------
# Source timings were derived from ffmpeg scene detection on the montage, not
# guessed — see `contact` below, which regenerates the evidence.
#
# The single most important fact about this clip: 16.76 -> 27.24 is ONE
# continuous 10.48s take that walks from the red sign, through the doors and
# the flower arch, down the aisle into the hall. It is never cut. The journey
# scrubs through it, which is why most chapters below share one shot.
#
# Fields: name | start | end | stabilise(0/1) | grade notes
#
# STATUS: PROPOSED — awaiting Erick's sign-off before the intro/journey
# stages are run in anger.

# --- Intro film: aerial -> ground -> the sign -------------------------------
INTRO_SHOTS=(
  "aerial_orbit|9.12|12.88|0|high aerial, continuous slow orbit of the compound"
  "ground_yard|12.88|15.40|1|ground level, paved yard toward the entrance"
  "sign|16.90|18.60|1|the red ZUKIN HALL sign (head of the walk-in take)"
)

# --- Journey: the walk-in, then the rooms -----------------------------------
JOURNEY_SHOTS=(
  "walkin|16.90|27.24|1|CONTINUOUS: sign -> doors -> arch -> aisle -> hall"
  "hall_wide|27.24|29.68|1|the hall, tables laid, wide"
  "table_setting|30.72|33.32|1|charger plate, napkin, glasses, centrepiece"
  "ceiling|37.36|40.92|1|chandelier and hanging flowers"
  "stage|40.92|43.84|1|stage, gold sofa, flower walls"
  "aisle|46.16|47.80|1|aisle arch and walkway"
  "closing_aerial|51.20|53.60|0|closing aerial (trimmed before the fade to black)"
)

# ---------------------------------------------------------------------------
# Tier 1 grade — pure ffmpeg, always applied.
# ---------------------------------------------------------------------------
# Order matters: denoise BEFORE sharpening, or you sharpen the noise. Scale
# down with lanczos before CAS so contrast-adaptive sharpening works at the
# delivery resolution rather than being thrown away by the resample.
#
# One shared grade across every shot so the warm exteriors and the pink
# interiors read as one film rather than a montage of different cameras.
T1_DENOISE="hqdn3d=2.5:2.0:7:6,nlmeans=s=1.2:p=5:r=9"
T1_SHARPEN="unsharp=5:5:0.9:5:5:0.0,cas=0.45"
T1_GRADE="eq=contrast=1.05:saturation=1.07"

die() { printf '\033[31merror:\033[0m %s\n' "$*" >&2; exit 1; }
say() { printf '\033[36m==>\033[0m %s\n' "$*"; }

have() { command -v "$1" >/dev/null 2>&1; }
has_filter() { ffmpeg -hide_banner -filters 2>/dev/null | awk '{print $2}' | grep -qx "$1"; }

# ---------------------------------------------------------------------------
# check — report the toolchain, never install anything
# ---------------------------------------------------------------------------
cmd_check() {
  local missing=0
  say "Binaries"
  for t in ffmpeg ffprobe cwebp; do
    if have "$t"; then printf '  ok       %s\n' "$t"
    else printf '  MISSING  %s\n' "$t"; missing=1; fi
  done

  say "ffmpeg filters (Tier 1)"
  for f in hqdn3d nlmeans unsharp cas eq scale xfade minterpolate; do
    if has_filter "$f"; then printf '  ok       %s\n' "$f"
    else printf '  MISSING  %s\n' "$f"; missing=1; fi
  done

  say "ffmpeg filters (optional)"
  for f in vidstabdetect vidstabtransform deshake drawtext; do
    if has_filter "$f"; then printf '  ok       %s\n' "$f"
    else printf '  absent   %s\n' "$f"; fi
  done

  say "Tier 2 (AI restoration) — optional"
  for t in realesrgan-ncnn-vulkan video2x; do
    if have "$t"; then printf '  ok       %s\n' "$t"
    else printf '  absent   %s\n' "$t"; fi
  done

  say "Source"
  if [[ -f "$SRC" ]]; then
    ffprobe -v error -select_streams v:0 \
      -show_entries stream=width,height,r_frame_rate \
      -show_entries format=duration,bit_rate \
      -of default=noprint_wrappers=1 "$SRC" | sed 's/^/  /'
  else
    printf '  MISSING  %s\n' "$SRC"; missing=1
  fi

  [[ $missing -eq 0 ]] || die "required tooling or source is missing (see above)"
  say "Tier 1 is runnable."
}

# ---------------------------------------------------------------------------
# contact — evidence for choosing shots
# ---------------------------------------------------------------------------
# Produces, in docs/hero-v2/contact/:
#   cuts.txt        scene-detected cut times
#   sec/s_NNN.jpg   one frame per second of source
#   shots/*.jpg     one frame from the middle of each detected segment
#   index.html      a browsable sheet with real timestamps
#
# drawtext is not compiled into Homebrew's ffmpeg, so timestamps are HTML text
# rather than burned into the pixels. That is better anyway: the labels stay
# selectable and the sheet re-renders without re-encoding.
cmd_contact() {
  [[ -f "$SRC" ]] || die "no source clip at $SRC"
  local cdir="$DOCS/contact"
  mkdir -p "$cdir/sec" "$cdir/shots"

  say "Detecting scene cuts"
  ffmpeg -hide_banner -nostats -i "$SRC" \
    -vf "select='gt(scene,0.30)',metadata=print:file=-" -an -f null - 2>/dev/null \
    | awk -F'pts_time:' '/pts_time/{printf "%.2f\n", $2}' | sort -n | uniq > "$cdir/cuts.txt"
  printf '  %s cuts\n' "$(wc -l < "$cdir/cuts.txt" | tr -d ' ')"

  say "Extracting one frame per second"
  rm -f "$cdir/sec"/*.jpg
  ffmpeg -hide_banner -loglevel error -i "$SRC" \
    -vf "fps=1,scale=400:-1:flags=lanczos" -q:v 4 "$cdir/sec/s_%03d.jpg" -y

  say "Extracting one frame per detected segment"
  rm -f "$cdir/shots"/*.jpg
  DUR="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")" \
  SRC="$SRC" CDIR="$cdir" python3 "$ROOT/scripts/contact_sheet.py" segments

  say "Building $cdir/index.html"
  DUR="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")" \
  SRC="$SRC" CDIR="$cdir" python3 "$ROOT/scripts/contact_sheet.py" html
  printf '  open %s\n' "$cdir/index.html"
}

cmd_intro()   { die "stage 'intro' runs after the shot list is signed off"; }
cmd_journey() { die "stage 'journey' runs after the shot list is signed off"; }
cmd_compare() { die "stage 'compare' runs after the shot list is signed off"; }

case "${1:-all}" in
  check)   cmd_check ;;
  contact) cmd_check >/dev/null && cmd_contact ;;
  intro)   cmd_intro ;;
  journey) cmd_journey ;;
  compare) cmd_compare ;;
  all)     cmd_check && cmd_contact && cmd_intro && cmd_journey ;;
  *)       die "unknown stage '$1' (check|contact|intro|journey|compare|all)" ;;
esac
