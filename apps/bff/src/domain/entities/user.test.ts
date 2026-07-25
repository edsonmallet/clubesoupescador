import { describe, expect, it } from 'vitest'
import { User } from './user'

describe('User', () => {
  it('exposes all props through getters', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z')
    const user = User.create({
      id: 'user-1',
      tenantId: 'tenant-1',
      uid: 'firebase-uid-1',
      role: 'user',
      createdAt,
    })

    expect(user.id).toBe('user-1')
    expect(user.tenantId).toBe('tenant-1')
    expect(user.uid).toBe('firebase-uid-1')
    expect(user.role).toBe('user')
    expect(user.createdAt).toBe(createdAt)
  })
})
