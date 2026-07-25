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
    await expect(client.request('/customers')).rejects.toThrow(
      'Asaas API error: 401 Unauthorized',
    )
  })

  it('finds a customer by externalReference', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 'cus_1', externalReference: 'uid-1' }],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = new AsaasClient('fake-key', 'sandbox')
    const customer = await client.findCustomerByExternalReference('uid-1')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://sandbox.asaas.com/api/v3/customers?externalReference=uid-1',
      expect.anything(),
    )
    expect(customer).toEqual({ id: 'cus_1', externalReference: 'uid-1' })
  })

  it('returns null when no customer matches the externalReference', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = new AsaasClient('fake-key', 'sandbox')
    const customer = await client.findCustomerByExternalReference('uid-1')

    expect(customer).toBeNull()
  })

  it('creates a customer', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'cus_1', externalReference: 'uid-1' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = new AsaasClient('fake-key', 'sandbox')
    const customer = await client.createCustomer({
      name: 'Jane Doe',
      cpfCnpj: '12345678900',
      externalReference: 'uid-1',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://sandbox.asaas.com/api/v3/customers',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(customer).toEqual({ id: 'cus_1', externalReference: 'uid-1' })
  })

  it('creates a subscription', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'sub_1', status: 'ACTIVE' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = new AsaasClient('fake-key', 'sandbox')
    const subscription = await client.createSubscription({
      customer: 'cus_1',
      billingType: 'UNDEFINED',
      value: 19.9,
      cycle: 'MONTHLY',
      nextDueDate: '2026-08-01',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://sandbox.asaas.com/api/v3/subscriptions',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(subscription).toEqual({ id: 'sub_1', status: 'ACTIVE' })
  })
})
