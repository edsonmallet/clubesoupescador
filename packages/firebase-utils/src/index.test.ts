import { describe, expect, it, vi } from 'vitest'

const { getApps, initializeApp, cert } = vi.hoisted(() => ({
  getApps: vi.fn(),
  initializeApp: vi.fn(),
  cert: vi.fn((serviceAccount: unknown) => serviceAccount),
}))

vi.mock('firebase-admin/app', () => ({ getApps, initializeApp, cert }))
vi.mock('firebase-admin/auth', () => ({ getAuth: vi.fn() }))

describe('getFirebaseApp', () => {
  it('throws when FIREBASE_SERVICE_ACCOUNT is not set', async () => {
    const original = process.env.FIREBASE_SERVICE_ACCOUNT
    process.env.FIREBASE_SERVICE_ACCOUNT = ''
    getApps.mockReturnValue([])

    const { getFirebaseApp } = await import('./index')

    expect(() => getFirebaseApp()).toThrow(
      'FIREBASE_SERVICE_ACCOUNT env var is required',
    )

    process.env.FIREBASE_SERVICE_ACCOUNT = original
  })

  it('reuses the existing app instead of initializing twice', async () => {
    const existingApp = { name: '[DEFAULT]' }
    getApps.mockReturnValue([existingApp])

    const { getFirebaseApp } = await import('./index')
    const app = getFirebaseApp()

    expect(app).toBe(existingApp)
    expect(initializeApp).not.toHaveBeenCalled()
  })
})
