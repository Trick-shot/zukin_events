import { Lottie } from 'lottie-react'

import loaderAnimation from '@/assets/lottie/zukin-loader-rose.json'

/**
 * The Lottie half of PageLoader, in its own file so the lottie player
 * (~250kB) loads as a lazy chunk instead of riding in the main bundle.
 * While this chunk itself is still arriving, PageLoader shows the same
 * static bronze ring the index.html splash uses — the two states are
 * visually continuous.
 */
export default function PageLoaderAnimation() {
  return <Lottie src={loaderAnimation} loop autoplay className="size-24" aria-hidden="true" />
}
