export type MelhorEnvioEnv = 'sandbox' | 'production'

const BASE_URLS: Record<MelhorEnvioEnv, string> = {
  sandbox: 'https://sandbox.melhorenvio.com.br/api/v2',
  production: 'https://melhorenvio.com.br/api/v2',
}

export type ShipmentQuoteRequest = {
  fromZipCode: string
  toZipCode: string
  products: Array<{
    quantity: number
    // Melhor Envio requires physical dimensions/weight per product; the
    // catalog does not model those yet, so a conservative default parcel
    // is used for every item. Real dimensions should replace this once
    // services/store tracks them.
    weightKg: number
    widthCm: number
    heightCm: number
    lengthCm: number
    insuranceValue: number
  }>
}

export type ShippingOption = {
  id: number
  name: string
  price: number
  deliveryTimeDays: number
}

export class MelhorEnvioClient {
  private readonly baseUrl: string
  private readonly token: string

  constructor(token: string, env: MelhorEnvioEnv) {
    this.token = token
    this.baseUrl = BASE_URLS[env]
  }

  async quote(request: ShipmentQuoteRequest): Promise<ShippingOption[]> {
    const response = await fetch(`${this.baseUrl}/me/shipment/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
        'User-Agent': 'Clube Store (contato@clube.com.br)',
      },
      body: JSON.stringify({
        from: { postal_code: request.fromZipCode },
        to: { postal_code: request.toZipCode },
        products: request.products.map((product) => ({
          id: 'store-item',
          width: product.widthCm,
          height: product.heightCm,
          length: product.lengthCm,
          weight: product.weightKg,
          insurance_value: product.insuranceValue,
          quantity: product.quantity,
        })),
      }),
    })

    if (!response.ok) {
      throw new Error(
        `Melhor Envio API error: ${response.status} ${response.statusText}`,
      )
    }

    const body = (await response.json()) as Array<{
      id: number
      name: string
      price: string
      delivery_time: number
      error?: string
    }>

    return body
      .filter((option) => !option.error)
      .map((option) => ({
        id: option.id,
        name: option.name,
        price: Number(option.price),
        deliveryTimeDays: option.delivery_time,
      }))
  }
}
