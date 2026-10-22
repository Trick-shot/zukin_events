import '@testing-library/jest-dom/vitest'

/**
 * jsdom has no canvas implementation and logs a loud "Not implemented" for
 * every getContext call. HeroCanvas already handles a null context by bailing
 * out, which is the behaviour under test, so stub it to null to keep real
 * failures visible in the output.
 */
HTMLCanvasElement.prototype.getContext = (() =>
  null) as unknown as HTMLCanvasElement['getContext']
