import { beforeEach, describe, expect, it } from 'vitest'

describe('firebase-utils bootstrap', () => {
  beforeEach(() => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT
  })

  it('throws when FIREBASE_SERVICE_ACCOUNT is missing', async () => {
    const { setRole } = await import('./index')
    await expect(setRole('uid123', 'user')).rejects.toThrow(
      'FIREBASE_SERVICE_ACCOUNT env var is required',
    )
  })
})
