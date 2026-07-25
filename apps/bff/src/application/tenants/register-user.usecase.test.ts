import { beforeEach, describe, expect, it, vi } from 'vitest'

const { setRole } = vi.hoisted(() => ({ setRole: vi.fn() }))
vi.mock('@clube/firebase-utils', () => ({ setRole }))

import { User } from '../../domain/entities/user'
import { UserAlreadyRegisteredError } from '../../domain/errors/user-already-registered.error'
import type { IUserRepository } from '../../domain/interfaces/IUserRepository'
import { RegisterUserUseCase } from './register-user.usecase'

function fakeUser(): User {
  return User.create({
    id: 'user-1',
    tenantId: 'tenant-1',
    uid: 'firebase-uid-1',
    role: 'user',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  })
}

describe('RegisterUserUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('creates the user and sets the Firebase role', async () => {
    const repository: IUserRepository = {
      findByUid: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(fakeUser()),
    }
    const useCase = new RegisterUserUseCase(repository)

    const user = await useCase.execute({
      uid: 'firebase-uid-1',
      tenantId: 'tenant-1',
    })

    expect(user.uid).toBe('firebase-uid-1')
    expect(repository.create).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      uid: 'firebase-uid-1',
      role: 'user',
    })
    expect(setRole).toHaveBeenCalledWith('firebase-uid-1', 'user', 'tenant-1')
  })

  it('throws UserAlreadyRegisteredError when the uid is already registered for the tenant', async () => {
    const repository: IUserRepository = {
      findByUid: vi.fn().mockResolvedValue(fakeUser()),
      create: vi.fn(),
    }
    const useCase = new RegisterUserUseCase(repository)

    await expect(
      useCase.execute({ uid: 'firebase-uid-1', tenantId: 'tenant-1' }),
    ).rejects.toBeInstanceOf(UserAlreadyRegisteredError)
    expect(repository.create).not.toHaveBeenCalled()
    expect(setRole).not.toHaveBeenCalled()
  })
})
