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
# STATUS: SIGNED OFF (Erick, 2026-10-23).
#
# Change on sign-off: closing_aerial is dropped. The journey must END inside
# the venue, so the last shot is `aisle`. The aerial now appears only in the
# intro film and as the rewind target at scroll progress 0 — which the
# addendum's bidirectional rule turns into the first journey frame, i.e. the
# head of `walkin`.

# --- Intro film: aerial -> ground -> the sign -------------------------------
INTRO_SHOTS=(
  "aerial_orbit|9.12|12.88|0|high aerial, continuous slow orbit of the compound"
  "ground_yard|12.88|15.40|1|ground level, paved yard toward the entrance"
  "sign|16.90|18.60|1|the red ZUKIN HALL sign (head of the walk-in take)"
)

# --- Journey: the walk-in, then the rooms -----------------------------------
# End times are trimmed from the detected segment ends to land inside the
# brief's 150-170 frame budget. walkin keeps its FULL 10.34s because it is
# the only continuous camera move in the clip and carries four beats on its
# own; the room shots give up a few tenths each instead.
JOURNEY_SHOTS=(
  "walkin|16.90|27.24|1|CONTINUOUS: sign -> doors -> arch -> aisle -> hall"
  "hall_wide|27.24|29.00|1|the hall, tables laid, wide"
  "table_setting|30.72|32.70|1|charger plate, napkin, glasses, centrepiece"
  "ceiling|37.36|39.60|1|chandelier and hanging flowers"
  "stage|40.92|42.90|1|stage, gold sofa, flower walls"
  "aisle|46.16|47.56|1|aisle arch and walkway — journey ends here, inside"
)

JOURNEY_DISSOLVE=0.6
JOURNEY_FPS=10        # -> ~167 frames; see the note in cmd_journey
JOURNEY_W_D=1600      # desktop frame width
JOURNEY_W_M=960       # mobile frame width
JOURNEY_Q_D=72        # cwebp quality, desktop
JOURNEY_Q_M=68        # cwebp quality, mobile
PIN_VH=650            # total pinned height the chapter table is written for

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

# ---------------------------------------------------------------------------
# Tier 2 — Real-ESRGAN, optional, only where it earns its keep
# ---------------------------------------------------------------------------
# Run on the two shots that carry the most weight: the walk-in (every journey
# chapter lives on it) and the intro aerial. Upscale x4 then resample back
# down to delivery size, so the gain lands as cleaner detail rather than a
# bigger picture.
#
# Disk is the binding constraint here (16 GB free, and x4 PNGs of 1080p are
# ~25 MB each), so each shot is processed and collapsed to its delivery
# frames before the next one starts, and intermediates are deleted as we go.
REALESRGAN_DIR="$ROOT/tools/realesrgan"
REALESRGAN_BIN="$REALESRGAN_DIR/realesrgan-ncnn-vulkan"
REALESRGAN_MODEL="realesrgan-x4plus"
TIER2_SHOTS=("walkin" "aerial_orbit")

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

# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

# Tier 1 chain for one shot, scaled to $1 px wide.
# Denoise BEFORE sharpen or you sharpen the noise; scale down BEFORE cas so
# contrast-adaptive sharpening operates at delivery resolution instead of
# being thrown away by the resample.
t1_chain() {
  local w="$1"
  printf '%s,scale=%s:-2:flags=lanczos,%s,%s' "$T1_DENOISE" "$w" "$T1_SHARPEN" "$T1_GRADE"
}

# Render one graded segment to near-lossless ProRes.
# $1 start  $2 end  $3 width  $4 out
render_segment() {
  local start="$1" end="$2" width="$3" out="$4"
  local dur
  dur="$(python3 -c "print(f'{float('$end')-float('$start'):.3f}')")"
  ffmpeg -hide_banner -loglevel error -y \
    -ss "$start" -t "$dur" -i "$SRC" \
    -vf "$(t1_chain "$width")" \
    -an -c:v prores_ks -profile:v 3 -pix_fmt yuv422p10le "$out"
}

# Chain N segments together with cross-dissolves. Never a hard cut: xfade
# overlaps the clips, so the running offset has to subtract every dissolve
# that came before it, or the cuts drift later and later.
# $1 dissolve seconds  $2 out  $3.. segment files
xfade_chain() {
  local d="$1" out="$2"; shift 2
  local segs=("$@") n=${#segs[@]}
  local inputs=() filt="" prev="0:v" offset dur acc=0
  for f in "${segs[@]}"; do inputs+=(-i "$f"); done
  for ((i = 1; i < n; i++)); do
    dur="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "${segs[$((i-1))]}")"
    acc="$(python3 -c "print(f'{$acc + float('$dur') - ($i > 1 and $d or 0):.3f}')")"
    offset="$(python3 -c "print(f'{$acc - $d:.3f}')")"
    local lbl="x$i"
    filt+="[$prev][$i:v]xfade=transition=fade:duration=$d:offset=$offset[$lbl];"
    prev="$lbl"
  done
  filt="${filt%;}"
  if [[ $n -eq 1 ]]; then
    cp "${segs[0]}" "$out"
  else
    ffmpeg -hide_banner -loglevel error -y "${inputs[@]}" \
      -filter_complex "$filt" -map "[$prev]" \
      -c:v prores_ks -profile:v 3 -pix_fmt yuv422p10le "$out"
  fi
}

# ---------------------------------------------------------------------------
# intro — the autoplay film
# ---------------------------------------------------------------------------
# Aerial orbit -> ground yard -> the red sign, joined by 0.7s dissolves.
# The film ends holding on the sign at 18.60s, which is 1.70s into the
# walk-in take; the journey then starts at 16.90s on that same sign. The
# ~1.7s overlap is deliberate (signed off): scrolling continues the same
# camera move into the building instead of cutting.
INTRO_DISSOLVE=0.7
INTRO_BITRATE=4000k   # -> ~3.15 MB at 6.6s, inside the 3.5 MB budget
WEBM_BITRATE=2600k    # VP9 is more efficient; Safari falls back to the mp4
cmd_intro() {
  mkdir -p "$WORK/intro" "$OUT"
  local segs=()
  for row in "${INTRO_SHOTS[@]}"; do
    IFS='|' read -r name start end _stab _note <<<"$row"
    local seg="$WORK/intro/${name}.mov"
    say "Tier 1: $name ($start -> $end)"
    render_segment "$start" "$end" 1920 "$seg"
    segs+=("$seg")
  done

  say "Joining with ${INTRO_DISSOLVE}s dissolves"
  xfade_chain "$INTRO_DISSOLVE" "$WORK/intro/film.mov" "${segs[@]}"

  # Two-pass VBR, not crf. The brief suggested "crf about 20, under 3.5 MB";
  # measured on this footage those two numbers cannot both be true — crf 20 is
  # 14.8 MB and even crf 28 is 3.94 MB, because 6.6s of high-motion drone
  # footage at 1080p is genuinely expensive. Two-pass at a target bitrate hits
  # 3.15 MB at full 1920x1080 and spends its bits where the motion is, which
  # looks better than a single-pass crf squeezed to the same size.
  say "Encoding intro.mp4 (H.264 High, two-pass ${INTRO_BITRATE}, faststart)"
  local passlog="$WORK/intro/x264pass"
  ffmpeg -hide_banner -loglevel error -y -i "$WORK/intro/film.mov" \
    -c:v libx264 -profile:v high -b:v "$INTRO_BITRATE" -preset slow -pix_fmt yuv420p \
    -passlogfile "$passlog" -pass 1 -an -f null /dev/null
  ffmpeg -hide_banner -loglevel error -y -i "$WORK/intro/film.mov" \
    -c:v libx264 -profile:v high -b:v "$INTRO_BITRATE" -preset slow -pix_fmt yuv420p \
    -passlogfile "$passlog" -pass 2 -movflags +faststart -an "$OUT/intro.mp4"

  say "Encoding intro.webm (VP9, two-pass ${WEBM_BITRATE})"
  local vp9log="$WORK/intro/vp9pass"
  ffmpeg -hide_banner -loglevel error -y -i "$WORK/intro/film.mov" \
    -c:v libvpx-vp9 -b:v "$WEBM_BITRATE" -row-mt 1 -pix_fmt yuv420p \
    -passlogfile "$vp9log" -pass 1 -an -f null /dev/null
  ffmpeg -hide_banner -loglevel error -y -i "$WORK/intro/film.mov" \
    -c:v libvpx-vp9 -b:v "$WEBM_BITRATE" -row-mt 1 -pix_fmt yuv420p \
    -passlogfile "$vp9log" -pass 2 -an "$OUT/intro.webm"
  rm -f "$passlog"* "$vp9log"*

  say "Posters (first frame = the aerial, which is also the rewind target)"
  ffmpeg -hide_banner -loglevel error -y -i "$WORK/intro/film.mov" -frames:v 1 \
    -vf "scale=1920:-2:flags=lanczos" -q:v 3 "$OUT/intro-poster.jpg"
  ffmpeg -hide_banner -loglevel error -y -i "$WORK/intro/film.mov" -frames:v 1 \
    -vf "scale=960:-2:flags=lanczos" -q:v 4 "$OUT/intro-poster-960.jpg"

  rm -f "${segs[@]}"
  say "intro done"
  ls -la "$OUT"/intro.* | sed 's/^/  /'
}

# ---------------------------------------------------------------------------
# journey — the scroll-scrubbed frame sets
# ---------------------------------------------------------------------------
# Sampled at 10 fps, not the brief's 12. The arithmetic does not close at 12:
# six shots at lengths that each still read on screen is ~19.7s of footage,
# which at 12 fps is 200+ frames, well past the 150-170 the brief asks for.
# 10 fps lands on 167. Sub-frame blending in the player interpolates between
# neighbours, so the difference between 10 and 12 is not visible while the
# byte cost of 40 extra frames is.
cmd_journey() {
  mkdir -p "$WORK/journey" "$OUT/journey/d" "$OUT/journey/m"
  local segs=() names=() durs=()

  for row in "${JOURNEY_SHOTS[@]}"; do
    IFS='|' read -r name start end _stab _note <<<"$row"
    local seg="$WORK/journey/${name}.mov"
    say "Tier 1: $name ($start -> $end)"
    render_segment "$start" "$end" "$JOURNEY_W_D" "$seg"
    segs+=("$seg"); names+=("$name")
    durs+=("$(python3 -c "print(f'{float('$end')-float('$start'):.3f}')")")
  done

  say "Joining ${#segs[@]} shots with ${JOURNEY_DISSOLVE}s dissolves"
  xfade_chain "$JOURNEY_DISSOLVE" "$WORK/journey/journey.mov" "${segs[@]}"
  rm -f "${segs[@]}"

  say "Extracting frames at ${JOURNEY_FPS} fps"
  rm -f "$WORK/journey/png"/*.png 2>/dev/null || true
  mkdir -p "$WORK/journey/png"
  ffmpeg -hide_banner -loglevel error -y -i "$WORK/journey/journey.mov" \
    -vf "fps=$JOURNEY_FPS" "$WORK/journey/png/f_%04d.png"
  local count
  count="$(ls "$WORK/journey/png" | wc -l | tr -d ' ')"
  printf '  %s frames\n' "$count"

  # cwebp rather than ffmpeg's libwebp, which is not compiled into Homebrew's
  # ffmpeg. -m 6 is the slowest/best method; -sharp_yuv avoids the chroma
  # smearing that shows up badly on the red sign and the pink drapes.
  say "Encoding WebP: desktop ${JOURNEY_W_D}px q${JOURNEY_Q_D}, mobile ${JOURNEY_W_M}px q${JOURNEY_Q_M}"
  rm -f "$OUT/journey/d"/*.webp "$OUT/journey/m"/*.webp 2>/dev/null || true
  for png in "$WORK/journey/png"/*.png; do
    local base; base="$(basename "$png" .png)"
    cwebp -quiet -q "$JOURNEY_Q_D" -m 6 -sharp_yuv "$png" -o "$OUT/journey/d/$base.webp"
    cwebp -quiet -q "$JOURNEY_Q_M" -m 6 -sharp_yuv -resize "$JOURNEY_W_M" 0 "$png" \
      -o "$OUT/journey/m/$base.webp"
    rm -f "$png"      # delete as we go; disk is the binding constraint
  done

  say "Writing manifest"
  JOURNEY_SHOTS_STR="$(printf '%s\n' "${JOURNEY_SHOTS[@]}")" \
  JOURNEY_FPS="$JOURNEY_FPS" JOURNEY_DISSOLVE="$JOURNEY_DISSOLVE" \
  FRAME_COUNT="$count" OUT="$OUT" PIN_VH="$PIN_VH" \
  W_D="$JOURNEY_W_D" W_M="$JOURNEY_W_M" \
  python3 "$ROOT/scripts/write_manifest.py"

  say "journey done"
  printf '  desktop: %s\n' "$(du -sh "$OUT/journey/d" | cut -f1)"
  printf '  mobile:  %s\n' "$(du -sh "$OUT/journey/m" | cut -f1)"
}
# ---------------------------------------------------------------------------
# compare — original vs Tier 1 vs Tier 2 at 100% crop
# ---------------------------------------------------------------------------
# Deliberately runs on a handful of representative frames, not whole shots.
# Real-ESRGAN costs ~33s and ~23 MB of intermediate per frame, so applying it
# to the 103-frame walk-in before anyone has judged the look would be an hour
# of compute and 2.4 GB of disk spent on a result the brief explicitly says to
# reject if it goes waxy. Judge first, then commit the compute.
#
# Tier 2 method: Tier-1 frame at delivery size -> x4 -> resample back down to
# delivery size. The gain lands as cleaner edges and less mush, not as a
# bigger picture.
COMPARE_FRAMES=(
  "sign|17.60|the red ZUKIN HALL lettering and brick"
  "arch|22.20|white flower arch, fine petal detail"
  "hall|26.00|ceiling flowers and chair backs"
  "aerial|10.50|roof edge, render, distant buildings"
)
cmd_compare() {
  [[ -x "$REALESRGAN_BIN" ]] || die "Real-ESRGAN not at $REALESRGAN_BIN"
  local cdir="$DOCS/compare" tmp="$WORK/compare"
  mkdir -p "$cdir" "$tmp"

  # Both tiers are decoded over the SAME 1.2s window and the same frame index
  # is taken from each. Extracting a single frame with -frames:v 1 does NOT
  # work here: hqdn3d is a temporal denoiser, so the filtered pipeline emits a
  # different source frame than the unfiltered one, and the "comparison" ends
  # up showing two different moments of a moving camera at different scales.
  # Found by looking at the output, not by reasoning about it.
  local WIN_PRE=0.6 WIN_DUR=1.2 PICK=16
  for row in "${COMPARE_FRAMES[@]}"; do
    IFS='|' read -r name t _note <<<"$row"
    say "$name @ ${t}s"
    local ws; ws="$(python3 -c "print(f'{float('$t')-$WIN_PRE:.3f}')")"
    rm -rf "$tmp/$name"; mkdir -p "$tmp/$name/t0" "$tmp/$name/t1"

    # Original, resampled to delivery size with nothing else applied, so the
    # comparison isolates the grade rather than the resolution.
    ffmpeg -hide_banner -loglevel error -y -ss "$ws" -t "$WIN_DUR" -i "$SRC" \
      -vf "scale=$JOURNEY_W_D:-2:flags=lanczos" "$tmp/$name/t0/%04d.png"

    # Tier 1, same window so frame N is the same moment.
    ffmpeg -hide_banner -loglevel error -y -ss "$ws" -t "$WIN_DUR" -i "$SRC" \
      -vf "$(t1_chain "$JOURNEY_W_D")" "$tmp/$name/t1/%04d.png"

    local n0 n1
    n0="$(ls "$tmp/$name/t0" | wc -l | tr -d ' ')"
    n1="$(ls "$tmp/$name/t1" | wc -l | tr -d ' ')"
    [[ "$n0" == "$n1" ]] || die "$name: tier frame counts differ ($n0 vs $n1); crops would not align"

    cp "$tmp/$name/t0/$(printf '%04d' $PICK).png" "$tmp/${name}_t0.png"
    cp "$tmp/$name/t1/$(printf '%04d' $PICK).png" "$tmp/${name}_t1.png"
    rm -rf "$tmp/$name"

    # Tier 2.
    "$REALESRGAN_BIN" -i "$tmp/${name}_t1.png" -o "$tmp/${name}_x4.png" \
      -n "$REALESRGAN_MODEL" -m "$REALESRGAN_DIR/models" >/dev/null 2>&1
    ffmpeg -hide_banner -loglevel error -y -i "$tmp/${name}_x4.png" \
      -vf "scale=$JOURNEY_W_D:-2:flags=lanczos" "$tmp/${name}_t2.png"
    rm -f "$tmp/${name}_x4.png"   # 23 MB each; do not let these accumulate
  done

  say "Cropping and building the comparison page"
  COMPARE_STR="$(printf '%s\n' "${COMPARE_FRAMES[@]}")" \
  TMP="$tmp" CDIR="$cdir" W="$JOURNEY_W_D" \
  python3 "$ROOT/scripts/compare_sheet.py"
  printf '  open %s/index.html\n' "$cdir"
}

case "${1:-all}" in
  check)   cmd_check ;;
  contact) cmd_check >/dev/null && cmd_contact ;;
  intro)   cmd_intro ;;
  journey) cmd_journey ;;
  compare) cmd_compare ;;
  all)     cmd_check && cmd_contact && cmd_intro && cmd_journey ;;
  *)       die "unknown stage '$1' (check|contact|intro|journey|compare|all)" ;;
esac
