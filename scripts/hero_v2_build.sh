#!/usr/bin/env bash
#
# ZUKIN HALL — hero v2 frame pipeline (addendum D, G, H, I, K, L)
#
#   ./scripts/hero_v2_build.sh exterior   # Tier 1, 1600px q72
#   ./scripts/hero_v2_build.sh interior   # Tier 2, 1920px q85  (SLOW: hours)
#   ./scripts/hero_v2_build.sh intro      # intro film + posters
#   ./scripts/hero_v2_build.sh manifest
#
# Per-shot, resumable, and intermediates are deleted as each shot finishes —
# disk is the binding constraint (~16 GB free, and a 4x PNG of 1080p is 33 MB).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLIP="$ROOT/assets-src/zukin_clip.mp4"
RWC="$ROOT/assets-src/runway/cleaned"
OUT="$ROOT/frontend/public/hero"
WORK="$ROOT/.hero-build"
ESRGAN="$ROOT/tools/realesrgan/realesrgan-ncnn-vulkan"
ESRMODELS="$ROOT/tools/realesrgan/models"

FPS=10
W_INT=1920; Q_INT=85        # interior: Tier 2
W_EXT=1600; Q_EXT=72        # exterior: Tier 1
W_MOB=960;  Q_MOB=66        # mobile, both

# --- Third-party wedding banner -------------------------------------------
# A real client's names and photographs appear on a banner by the doors.
#
# TWO defences, because the first version of this leaked. The mask was sized
# from two sampled frames; in a third frame the camera angle put the banner
# ~150px higher and a face sat ABOVE the box, sharp and identifiable — and
# Real-ESRGAN had sharpened it further. Sampling was not enough.
#
#   1. PRIMARY: the shot windows below avoid the banner entirely. Measured
#      entry/exit: clipC from ~2.70s, original clip until ~20.40s.
#   2. SAFETY NET: this mask, sized from the worst observed position with
#      margin. It is currently DISABLED on every shot (the mask column is 0)
#      because once the windows avoid the banner, the blur only destroys a
#      quarter of the frame for no benefit. Set the column to 1 on any shot
#      whose window is retimed back over the banner, and re-verify.
#
# Feathered blur, not a solid box: right and bottom coincide with the frame
# edge (feathering those would let it reappear at the border), left and top
# are feathered so it reads as edge falloff rather than a redaction.
BX=1000; BY=380; BW=920; BH=700; BF=120
banner_mask() {
  printf 'split[bmA][bmB];[bmB]crop=%d:%d:%d:%d,avgblur=30,avgblur=30,format=yuva420p,geq=r=%s:g=%s:b=%s:a=%s[bmC];[bmA][bmC]overlay=%d:%d' \
    "$BW" "$BH" "$BX" "$BY" "'r(X,Y)'" "'g(X,Y)'" "'b(X,Y)'" \
    "'255*min(1,X/$BF)*min(1,Y/$BF)'" "$BX" "$BY"
}

# --- Shot table, in scroll order (section L) -------------------------------
# name | tag | source | start | end | tier | mask(0/1)
SHOTS=(
  "front_view|EXTERIOR-IN|clip|17.40|18.00|2|0"
  "facade_doors|EXTERIOR-IN|rwC|1.70|2.65|1|0"
  "crossing|THRESHOLD|clip|20.42|20.82|2|0"
  "arch|INTERIOR|clip|20.82|23.60|2|0"
  "aisle_hall|INTERIOR|clip|23.60|27.24|2|0"
  "hall_wide|INTERIOR|clip|27.24|29.68|2|0"
  "tables|INTERIOR|clip|30.72|32.36|2|0"
  "ceiling|INTERIOR|clip|37.36|40.92|2|0"
  "stage|INTERIOR|clip|40.92|43.84|2|0"
  "aisle_decor|INTERIOR|clip|46.16|47.80|2|0"
  "parking|EXTERIOR-OUT|rwP|0.20|3.90|1|0"
  "finale|FINALE|rwC|1.60|2.20|1|0"
)

T1_DENOISE="hqdn3d=2.0:1.5:6:5"
T1_GRADE="eq=contrast=1.05:saturation=1.07"
T2_SHARPEN="cas=0.35"
T1_SHARPEN="unsharp=5:5:0.8:5:5:0.0,cas=0.45"

say() { printf '\033[36m==>\033[0m %s\n' "$*"; }
die() { printf '\033[31merror:\033[0m %s\n' "$*" >&2; exit 1; }

src_for() {
  case "$1" in
    clip) echo "$CLIP" ;;
    rwC)  echo "$RWC/exterior_C_sign_to_doors_cleaned.mp4" ;;
    rwB)  echo "$RWC/exterior_B_aerial_ground_cleaned.mp4" ;;
    rwP)  echo "$RWC/container_shot_cleaned_slowed3.2x.mov" ;;
    *) die "unknown source $1" ;;
  esac
}

# Render one shot's delivery frames.
# Tier 1: denoise -> lanczos down -> sharpen -> grade.
# Tier 2: denoise at source res -> Real-ESRGAN x4 -> lanczos down -> gentle
#         sharpen -> grade. Exactly two resamples, per D.2.
build_shot() {
  local name="$1" tag="$2" srckey="$3" start="$4" end="$5" tier="$6" mask="$7"
  local src; src="$(src_for "$srckey")"
  local w q
  if [[ "$tier" == "2" ]]; then w=$W_INT; q=$Q_INT; else w=$W_EXT; q=$Q_EXT; fi

  local dir="$WORK/$name"
  rm -rf "$dir"; mkdir -p "$dir/raw"
  local dur; dur="$(python3 -c "print(f'{float('$end')-float('$start'):.3f}')")"

  local pre="$T1_DENOISE"
  [[ "$mask" == "1" ]] && pre="$(banner_mask),$T1_DENOISE"

  if [[ "$tier" == "2" ]]; then
    ffmpeg -hide_banner -loglevel error -y -ss "$start" -t "$dur" -i "$src" \
      -vf "fps=$FPS,$pre" "$dir/raw/%04d.png"
    local n; n="$(ls "$dir/raw" | wc -l | tr -d ' ')"
    say "  $name: $n frames -> Real-ESRGAN x4"
    mkdir -p "$dir/up"
    local i=0
    for f in "$dir/raw"/*.png; do
      i=$((i+1))
      "$ESRGAN" -i "$f" -o "$dir/up/$(basename "$f")" -n realesrgan-x4plus \
        -m "$ESRMODELS" >/dev/null 2>&1
      rm -f "$f"                      # free 2 MB now, 33 MB shortly
      printf '\r    %d/%d' "$i" "$n"
    done; printf '\n'
    mkdir -p "$dir/final"
    for f in "$dir/up"/*.png; do
      ffmpeg -hide_banner -loglevel error -y -i "$f" \
        -vf "scale=$w:-2:flags=lanczos,$T2_SHARPEN,$T1_GRADE" \
        "$dir/final/$(basename "$f")"
      rm -f "$f"                      # 33 MB each; never let these pile up
    done
  else
    mkdir -p "$dir/final"
    ffmpeg -hide_banner -loglevel error -y -ss "$start" -t "$dur" -i "$src" \
      -vf "fps=$FPS,$pre,scale=$w:-2:flags=lanczos,$T1_SHARPEN,$T1_GRADE" \
      "$dir/final/%04d.png"
  fi

  # Stage under the shot's own name. Numbering happens in a separate pass so
  # that building exterior and interior in either order (or resuming a run)
  # cannot scramble the sequence.
  local stage="$WORK/stage/$name"
  rm -rf "$stage"; mkdir -p "$stage/d" "$stage/m"
  local i=0
  for f in "$dir/final"/*.png; do
    i=$((i+1))
    local o; o="$(printf '%04d.webp' "$i")"
    cwebp -quiet -q "$q" -m 6 -sharp_yuv "$f" -o "$stage/d/$o"
    cwebp -quiet -q "$Q_MOB" -m 6 -sharp_yuv -resize "$W_MOB" 0 "$f" -o "$stage/m/$o"
    rm -f "$f"
  done
  rm -rf "$dir"
  say "  $name staged: $i frames"
}

# Walk the shot table in scroll order and number the staged frames into one
# continuous sequence. Refuses to run on an incomplete set rather than
# emitting a sequence with a hole in it.
cmd_number() {
  local idx=0 missing=()
  mkdir -p "$OUT/journey/d" "$OUT/journey/m"
  rm -f "$OUT/journey/d"/*.webp "$OUT/journey/m"/*.webp 2>/dev/null || true
  : > "$WORK/.index"
  for row in "${SHOTS[@]}"; do
    IFS='|' read -r name tag _s _st _e _t _m <<<"$row"
    [[ -d "$WORK/stage/$name/d" ]] || { missing+=("$name"); continue; }
    local first=$((idx+1))
    for f in "$WORK/stage/$name/d"/*.webp; do
      idx=$((idx+1))
      local o; o="$(printf 'f_%04d.webp' "$idx")"
      cp "$f" "$OUT/journey/d/$o"
      cp "$WORK/stage/$name/m/$(basename "$f")" "$OUT/journey/m/$o"
    done
    printf '%s|%s|%d|%d\n' "$name" "$tag" "$first" "$idx" >> "$WORK/.index"
    say "  $name -> frames $first..$idx"
  done
  if [[ ${#missing[@]} -gt 0 ]]; then
    die "not numbered: these shots are not staged yet: ${missing[*]}"
  fi
  say "numbered $idx frames"
}

cmd_run() {
  local want="$1"
  mkdir -p "$WORK"
  for row in "${SHOTS[@]}"; do
    IFS='|' read -r name tag srckey start end tier mask <<<"$row"
    case "$want" in
      exterior) [[ "$tier" == "1" ]] || continue ;;
      interior) [[ "$tier" == "2" ]] || continue ;;
      all) ;;
    esac
    if [[ -d "$WORK/stage/$name/d" ]]; then
      say "$name already staged, skipping"
      continue
    fi
    say "$name ($tag, tier $tier)"
    build_shot "$name" "$tag" "$srckey" "$start" "$end" "$tier" "$mask"
  done
}

case "${1:-all}" in
  exterior|interior|all) cmd_run "$1" ;;
  number) cmd_number ;;
  reset) rm -rf "$WORK" "$OUT/journey"; say "reset" ;;
  *) die "usage: $0 {exterior|interior|all|number|reset}" ;;
esac
