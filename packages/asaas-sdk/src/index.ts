export type AsaasEnv = 'sandbox' | 'production'

const BASE_URLS: Record<AsaasEnv, string> = {
  sandbox: 'https://sandbox.asaas.com/api/v3',
  production: 'https://api.asaas.com/v3',
}

export type AsaasCustomer = {
  id: string
  externalReference?: string
  name?: string
  cpfCnpj?: string
}

export type CreateAsaasCustomerDto = {
  name: string
  cpfCnpj: string
  externalReference: string
}

export type AsaasSubscription = {
  id: string
  status: string
  paymentLink?: string
}

export type CreateAsaasSubscriptionDto = {
  customer: string
  billingType: 'UNDEFINED' | 'BOLETO' | 'CREDIT_CARD' | 'PIX'
  value: number
  cycle: 'MONTHLY'
  nextDueDate: string
}

export class AsaasClient {
  private readonly baseUrl: string
  private readonly apiKey: string

  constructor(apiKey: string, env: AsaasEnv) {
    this.apiKey = apiKey
    this.baseUrl = BASE_URLS[env]
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        access_token: this.apiKey,
        ...init.headers,
      },
    })

    if (!response.ok) {
      throw new Error(
        `Asaas API error: ${response.status} ${response.statusText}`,
      )
    }

    return response.json() as Promise<T>
  }

  async findCustomerByExternalReference(
    externalReference: string,
  ): Promise<AsaasCustomer | null> {
    const result = await this.request<{ data: AsaasCustomer[] }>(
      `/customers?externalReference=${encodeURIComponent(externalReference)}`,
    )
    return result.data[0] ?? null
  }

  async createCustomer(data: CreateAsaasCustomerDto): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async createSubscription(
    data: CreateAsaasSubscriptionDto,
  ): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}
