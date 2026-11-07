import { Lottie } from 'lottie-react'

import loaderAnimation from '@/assets/lottie/zukin-loader-rose.json'

/**
 * The Lottie half of PageLoader and BootVeil, in its own file so the lottie
 * player (~250kB) loads as a lazy chunk instead of riding in the main bundle.
 * While this chunk itself is still arriving, both callers show the static
 * bronze ring the index.html splash uses, so the states are continuous.
 *
 * SPEED. The source art is a 360-frame, 30fps flower: twelve seconds for one
 * bloom. Every place it is used is a short wait, the boot veil is about a
 * second and PageLoader only appears after a 300ms delay, so at native speed
 * a visitor sees the first six per cent of the animation and the loader reads
 * as a stuck shape rather than something alive. At 6x the bloom completes in
 * two seconds, which is a normal loop for a loader and actually looks like
 * motion in the time it is on screen.
 */
const SPEED = 6

/**
 * `still` holds the flower on its first frame for prefers-reduced-motion.
 * Both layers start at full opacity and full scale, so a paused flower is a
 * whole flower, not an empty canvas waiting to bloom. That is what lets the
 * ring fallback go: reduced motion still gets the mark, just not the motion.
 */
export default function PageLoaderAnimation({ still = false }: { still?: boolean }) {
  return (
    <Lottie
      src={loaderAnimation}
      loop={!still}
      autoplay={!still}
      speed={SPEED}
      className="size-40 sm:size-48"
      aria-hidden="true"
    />
  )
}
