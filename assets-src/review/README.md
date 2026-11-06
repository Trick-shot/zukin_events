# Hero `xl` (retina) frame set — review crops

For Erick. Everything here is a 100% crop of **new f_0014**, the front/sign
frame — the frame in the sequence with the finest detail to judge (sign
lettering, brick courses, stacked-stone facade).

## Before / after

| file | what it is |
| --- | --- |
| `f0014_before_d1920_at100.png` | the **current** `d` frame (1920px) blown up to 2560 the way a 2x browser does it — i.e. what a retina screen shows today |
| `f0014_after_xl2560_at100.png` | the **new** `xl` frame (2560px), native pixels, no resampling |
| `f0014_compare_before_after.png` | the two side by side, before on the left |

Both crops cover the identical region of the identical frame, so they can be
flipped between without re-aiming.

**What to look for:** letter edges on ZUKIN / HALL, the mortar lines in the
red brick pier, and the individual stones in the grey stacked-stone panel
behind the sign. The `xl` crop resolves all three more cleanly, because the
panel only has to stretch the image 1.5x instead of 2x.

## The honest caveat

The brief asked for **Real-ESRGAN 2x**. This set is **not** super-resolved —
it is lanczos from the original 1920 clip, plus a light unsharp. It is
genuinely sharper than what ships today (see the comparison), but it contains
**no detail that was not already in the 1920 frames**.

Real-ESRGAN is installed and the model is fine, but on this machine
(Apple M1 Pro / MoltenVK) it returns corrupted output *silently* — exit code
0, nothing on stderr:

| file | what it shows |
| --- | --- |
| `esrgan_failure_input_tile_for_reference.jpg` | the tile that was fed to ESRGAN — the whole "ZUKIN HALL" sign, correct |
| `esrgan_failure_f0014_sign_erased.jpg` | what came back: misaligned bands, and the sign now reads **"H L"** — letters erased and invented |

Depending on tile size the same frame came back reading "H L", "ZN" or
"I AI". That is generative invention, which the brief explicitly rules out, so
the lanczos fallback was taken as instructed.

Small single tiles (480x270, 960x540) come back clean and genuinely detailed,
so this is an ncnn/Vulkan tiling problem, not the weights. A hand-rolled
3x2 tiler with context margins did not fix it — tiles under the measured
memory ceiling still came back geometrically displaced.

**If true super-resolution is wanted**, the fix is to sidestep ncnn: install
the torch/MPS build of Real-ESRGAN and re-run `scripts/hero_xl_upscale.sh`.
The frame order, grade, downsample, unsharp and encode stages are unchanged —
only the upscale step swaps out. Full diagnosis is in the script header.
