import { describe, expect, it, vi } from 'vitest'
import Home from './page'

const redirectMock = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

describe('PWA home page', () => {
  it('redirects to the member club route', () => {
    Home()
    expect(redirectMock).toHaveBeenCalledWith('/clube')
  })
})
