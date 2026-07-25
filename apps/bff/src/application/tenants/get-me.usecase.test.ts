import { describe, expect, it, vi } from 'vitest'
import { User } from '../../domain/entities/user'
import type { IUserRepository } from '../../domain/interfaces/IUserRepository'
import { GetMeUseCase } from './get-me.usecase'

describe('GetMeUseCase', () => {
  it('returns uid/role/tenantId plus the registration date when a user record exists', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z')
    const repository: IUserRepository = {
      findByUid: vi.fn().mockResolvedValue(
        User.create({
          id: 'user-1',
          tenantId: 'tenant-1',
          uid: 'firebase-uid-1',
          role: 'user',
          createdAt,
        }),
      ),
      create: vi.fn(),
    }
    const useCase = new GetMeUseCase(repository)

    const result = await useCase.execute({
      uid: 'firebase-uid-1',
      tenantId: 'tenant-1',
      role: 'user',
    })

    expect(result).toEqual({
      uid: 'firebase-uid-1',
      role: 'user',
      tenantId: 'tenant-1',
      registeredAt: createdAt,
    })
  })

  it('returns registeredAt null when no user record exists yet', async () => {
    const repository: IUserRepository = {
      findByUid: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
    }
    const useCase = new GetMeUseCase(repository)

    const result = await useCase.execute({
      uid: 'firebase-uid-2',
      tenantId: 'tenant-1',
      role: 'super_admin',
    })

    expect(result.registeredAt).toBeNull()
    expect(result.role).toBe('super_admin')
  })
})
