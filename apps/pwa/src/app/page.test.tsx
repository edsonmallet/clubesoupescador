import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Home from './page'

describe('PWA home page', () => {
  it('renders the placeholder heading', () => {
    render(<Home />)
    expect(screen.getByText('Em construção.')).toBeInTheDocument()
  })
})
