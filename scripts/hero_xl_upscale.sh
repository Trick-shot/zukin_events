#!/usr/bin/env bash
#
# ZUKIN HALL — hero "xl" (retina) frame set
# =========================================
#
# Builds frontend/public/hero-sequence/xl/f_%04d.webp at 2560px from the
# ORIGINAL clip, never from the committed webp frames.
#
#   assets-src/zukin_clip.mp4
#     -> ffmpeg fps=3            165 source PNGs (PNG n = source time (n-1)/3 s)
#     -> keep + renumber         104 frames, client-approved order (manifest.json)
#     -> grade                   eq=contrast=1.05:saturation=1.08:brightness=-0.01
#                                (identical to the d/m sets)
#     -> scale 2560 lanczos
#     -> unsharp=5:5:0.25
#     -> cwebp q78               -> xl/f_%04d.webp
#
# WHY NOT REAL-ESRGAN
# -------------------
# The brief asked for Real-ESRGAN 2x. It is installed (tools/realesrgan,
# realesrgan-ncnn-vulkan) and it runs, but on this machine (Apple M1 Pro,
# MoltenVK) it returns GEOMETRICALLY CORRUPTED output, silently — exit code 0,
# nothing on stderr:
#
#   * default tiling, and -t 128 / 256 / 512, and -j 1:1:1: the frame comes
#     back as misaligned and blank tiles. On the sign frame (f_0014) the model
#     erased letters: the sign read "H L", then "ZN", then "I AI" depending on
#     tile size. That is invented content, which the brief forbids.
#   * a whole 1920x1080 frame as ONE tile (-t 2048) dies with
#     VK_ERROR_DEVICE_LOST / kIOGPUCommandBufferCallbackErrorOutOfMemory.
#   * measured ceiling: 960x540 single-tile is clean, 1280x720 OOMs.
#   * a hand-rolled 3x2 tiler with 64px context margins (each tile 768x668,
#     513 kpx, under the measured ceiling, no error reported) STILL came back
#     displaced: the input tile holds the whole "ZUKIN HALL" sign, its 2x
#     output has the sign shifted off the bottom edge.
#
# Small single tiles (480x270, 960x540) ARE clean and the detail is genuinely
# good, so the model and weights are fine — the ncnn/Vulkan tile path on this
# box is not. Per the brief's instruction ("fall back to lanczos+unsharp for
# that frame set and tell me") this script ships the lanczos path.
#
# CAVEAT, STATED PLAINLY: lanczos from a 1920 source adds NO detail that is
# not already in the 1920 frames. The xl set is sharper than letting the
# browser upscale 1920 (better resampler, and the panel only has to stretch
# 1.5x instead of 2x) but it is not true super-resolution. If real SR matters,
# fix the ESRGAN install (a torch/MPS build of Real-ESRGAN sidesteps ncnn
# entirely) and re-run with UPSCALER=esrgan.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/assets-src/zukin_clip.mp4"
OUT="$ROOT/frontend/public/hero-sequence/xl"
WORK="${WORK:-$ROOT/.hero-xl-build}"

GRADE="eq=contrast=1.05:saturation=1.08:brightness=-0.01"
WIDTH="${WIDTH:-2560}"
QUALITY="${QUALITY:-78}"
# Per the brief: if a frame lands over ~500KB, the whole set drops to q74.
MAX_FRAME_KB="${MAX_FRAME_KB:-500}"
FALLBACK_QUALITY="${FALLBACK_QUALITY:-74}"

die() { printf '\033[31merror:\033[0m %s\n' "$*" >&2; exit 1; }
say() { printf '\033[36m==>\033[0m %s\n' "$*"; }

# The approved 104-frame order as SOURCE frame numbers. Ranges are the ones
# recorded in hero-sequence/manifest.json. Do not reorder.
source_frames() {
  python3 - <<'PY'
for a, b in [(27,39),(51,62),(63,80),(81,107),(108,135),(136,141)]:
    for n in range(a, b+1):
        print(n)
PY
}

extract_sources() {
  mkdir -p "$WORK/png"
  if [[ ! -f "$WORK/png/f_0165.png" ]]; then
    say "Extracting source frames at 3 fps"
    ffmpeg -nostdin -loglevel error -y -i "$SRC" -vf fps=3 "$WORK/png/f_%04d.png"
  fi
  local have; have="$(ls "$WORK/png" | wc -l | tr -d ' ')"
  [[ "$have" == "165" ]] || die "expected 165 source frames, found $have"
}

# build_set <quality> — writes the whole xl set at the given webp quality and
# echoes the largest frame size in KB.
build_set() {
  local q="$1" new=0 src biggest=0 kb
  rm -f "$OUT"/*.webp
  while read -r src; do
    new=$(( new + 1 ))
    local N S
    N="$(printf '%04d' "$new")"; S="$(printf '%04d' "$src")"

    ffmpeg -nostdin -loglevel error -y -i "$WORK/png/f_$S.png" \
      -vf "${GRADE},scale=${WIDTH}:-2:flags=lanczos,unsharp=5:5:0.25" \
      "$WORK/post.png"
    cwebp -quiet -q "$q" "$WORK/post.png" -o "$OUT/f_$N.webp"

    kb=$(( $(stat -f%z "$OUT/f_$N.webp") / 1024 ))
    (( kb > biggest )) && biggest=$kb
  done < <(source_frames)
  rm -f "$WORK/post.png"
  echo "$biggest"
}

cmd_frames() {
  [[ -f "$SRC" ]] || die "no source clip at $SRC"
  command -v cwebp >/dev/null || die "cwebp not found"
  mkdir -p "$OUT"
  extract_sources

  say "Building xl set at q$QUALITY"
  local biggest; biggest="$(build_set "$QUALITY")"
  printf '  largest frame: %s KB\n' "$biggest"

  if (( biggest > MAX_FRAME_KB )); then
    say "Over ${MAX_FRAME_KB}KB — rebuilding the set at q$FALLBACK_QUALITY"
    biggest="$(build_set "$FALLBACK_QUALITY")"
    printf '  largest frame: %s KB\n' "$biggest"
  fi

  local n; n="$(ls "$OUT" | wc -l | tr -d ' ')"
  [[ "$n" == "104" ]] || die "expected 104 frames, wrote $n"
  say "Done: $n frames, $(du -sh "$OUT" | cut -f1)"
}

case "${1:-frames}" in
  frames) cmd_frames ;;
  *)      die "unknown stage '$1' (frames)" ;;
esac
