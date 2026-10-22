import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Photo } from '@/components/ui/Photo'

describe('Photo', () => {
  it('renders a lazy image with intrinsic dimensions by default', () => {
    render(<Photo src="space-main.jpg" alt="Main hall" width={624} height={440} />)

    const img = screen.getByAltText('Main hall')
    expect(img).toHaveAttribute('src', '/images/space-main.jpg')
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('width', '624')
    expect(img).toHaveAttribute('height', '440')
  })

  it('loads eagerly when marked as priority', () => {
    render(<Photo src="hero-1.jpg" alt="" width={1440} height={900} priority />)

    expect(document.querySelector('img')).toHaveAttribute('loading', 'eager')
  })

  it('falls back to the gradient placeholder when the file is missing', () => {
    // 13 of the 24 photos in the brief do not exist yet, so this path is the
    // normal case today, not an edge case.
    render(
      <Photo
        src="space-second.jpg"
        alt="Second space"
        width={624}
        height={440}
        placeholderLabel="[ Photo: Second space ]"
      />,
    )

    fireEvent.error(screen.getByAltText('Second space'))

    expect(screen.queryByAltText('Second space')).not.toBeInTheDocument()
    const placeholder = screen.getByRole('img', { name: 'Second space' })
    expect(placeholder).toHaveTextContent('[ Photo: Second space ]')
  })

  it('hides the placeholder from assistive tech when the photo is decorative', () => {
    const { container } = render(
      <Photo src="missing.jpg" alt="" width={100} height={100} />,
    )

    fireEvent.error(container.querySelector('img')!)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
