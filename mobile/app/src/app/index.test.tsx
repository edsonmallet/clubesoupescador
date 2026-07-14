import { render, screen } from '@testing-library/react-native'

import Index from './index'

describe('Index route', () => {
  it('renders the placeholder text', () => {
    render(<Index />)
    expect(screen.getByText('Em construção.')).toBeTruthy()
  })
})
