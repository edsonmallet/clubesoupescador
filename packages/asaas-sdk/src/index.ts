export type AsaasEnv = 'sandbox' | 'production'

const BASE_URLS: Record<AsaasEnv, string> = {
  sandbox: 'https://sandbox.asaas.com/api/v3',
  production: 'https://api.asaas.com/v3',
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
      throw new Error(`Asaas API error: ${response.status} ${response.statusText}`)
    }

    return response.json() as Promise<T>
  }
}
