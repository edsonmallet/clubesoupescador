import { describe, expect, it, vi } from 'vitest'

const { getFirebaseApp } = vi.hoisted(() => ({
  getFirebaseApp: vi.fn(),
}))

vi.mock('@clube/firebase-utils', () => ({ getFirebaseApp }))

describe('getFirebaseAdmin', () => {
  it('delegates to @clube/firebase-utils getFirebaseApp', async () => {
    const fakeApp = { name: '[DEFAULT]' }
    getFirebaseApp.mockReturnValue(fakeApp)

    const { getFirebaseAdmin } = await import('./admin.js')
    const app = getFirebaseAdmin()

    expect(app).toBe(fakeApp)
    expect(getFirebaseApp).toHaveBeenCalledTimes(1)
  })
})
