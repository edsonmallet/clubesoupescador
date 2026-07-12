import { afterEach, describe, expect, it, vi } from 'vitest'
import { AsaasClient } from './index'

describe('AsaasClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves the sandbox base URL and sends the access_token header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = new AsaasClient('fake-key', 'sandbox')
    await client.request('/customers')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://sandbox.asaas.com/api/v3/customers',
      expect.objectContaining({
        headers: expect.objectContaining({ access_token: 'fake-key' }),
      }),
    )
  })

  it('throws when the response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = new AsaasClient('fake-key', 'production')
    await expect(client.request('/customers')).rejects.toThrow('Asaas API error: 401 Unauthorized')
  })
})
