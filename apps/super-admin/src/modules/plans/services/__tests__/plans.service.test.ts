import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/services/api-client'
import { plansService } from '../plans.service'

vi.mock('@/shared/services/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

describe('plansService', () => {
  it('lists plans via the super-admin management endpoint (includes inactive plans)', () => {
    plansService.list()

    // Must hit /plans/all — NOT the public /plans endpoint, which only
    // returns active plans and would make deactivated plans permanently
    // invisible in the super-admin CRUD.
    expect(apiClient.get).toHaveBeenCalledWith('/v1/billing/plans/all')
  })
})
