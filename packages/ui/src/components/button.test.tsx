import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Assinar</Button>)
    expect(screen.getByRole('button', { name: 'Assinar' })).toBeInTheDocument()
  })

  it('applies the outline variant class', () => {
    render(<Button variant="outline">Cancelar</Button>)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveClass(
      'border',
    )
  })
})
