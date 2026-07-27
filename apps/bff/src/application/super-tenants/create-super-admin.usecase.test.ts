import { beforeEach, describe, expect, it, vi } from 'vitest'

const { setRole } = vi.hoisted(() => ({ setRole: vi.fn() }))
vi.mock('@clube/firebase-utils', () => ({ setRole }))

import { CreateSuperAdminUseCase } from './create-super-admin.usecase'

describe('CreateSuperAdminUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets the super_admin role on the given uid', async () => {
    const useCase = new CreateSuperAdminUseCase()

    await useCase.execute('firebase-uid-1')

    expect(setRole).toHaveBeenCalledWith('firebase-uid-1', 'super_admin')
  })
})
