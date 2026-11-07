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

export default function PageLoaderAnimation() {
  return (
    <Lottie
      src={loaderAnimation}
      loop
      autoplay
      speed={SPEED}
      className="size-24"
      aria-hidden="true"
    />
  )
}
