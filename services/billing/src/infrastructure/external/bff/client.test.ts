import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../shared/env', () => ({
  env: {
    BFF_INTERNAL_URL: 'http://bff.local',
    INTERNAL_SERVICE_TOKEN: 'secret-token',
  },
}))

describe('updateTenantBilling', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('PATCHes the internal BFF route with the internal token header', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, statusText: 'OK' })
    vi.stubGlobal('fetch', fetchMock)

    const { updateTenantBilling } = await import('./client')
    await updateTenantBilling('tenant-1', {
      status: 'active',
      planId: 'plan-1',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://bff.local/internal/tenants/tenant-1/billing',
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          'x-internal-token': 'secret-token',
        },
        body: JSON.stringify({ status: 'active', planId: 'plan-1' }),
      },
    )
  })

  it('logs and does not throw when the BFF responds with a non-2xx status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Error',
    })
    vi.stubGlobal('fetch', fetchMock)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { updateTenantBilling } = await import('./client')
    await expect(
      updateTenantBilling('tenant-1', { status: 'suspended' }),
    ).resolves.toBeUndefined()

    expect(errorSpy).toHaveBeenCalled()
  })

  it('logs and does not throw when fetch itself rejects', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { updateTenantBilling } = await import('./client')
    await expect(
      updateTenantBilling('tenant-1', { status: 'suspended' }),
    ).resolves.toBeUndefined()

    expect(errorSpy).toHaveBeenCalled()
  })
})
