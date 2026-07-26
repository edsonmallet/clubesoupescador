import { ProductNotFoundError } from '../../domain/errors'
import type { IProductRepository } from '../../domain/interfaces/IProductRepository'
import type {
  MelhorEnvioClient,
  ShippingOption,
} from '../../infrastructure/external/melhor-envio/client'

const DEFAULT_PARCEL = {
  weightKg: 0.3,
  widthCm: 15,
  heightCm: 10,
  lengthCm: 20,
}

export type QuoteShippingItemInput = {
  productId: string
  qty: number
}

export type QuoteShippingInput = {
  tenantId: string
  items: QuoteShippingItemInput[]
  destinationZipCode: string
}

export class QuoteShippingUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly melhorEnvioClient: MelhorEnvioClient,
    private readonly originZipCode: string,
  ) {}

  async execute(input: QuoteShippingInput): Promise<ShippingOption[]> {
    const products = await Promise.all(
      input.items.map(async (item) => {
        const product = await this.productRepository.findById(
          input.tenantId,
          item.productId,
        )
        if (!product) throw new ProductNotFoundError(item.productId)
        return { item, product }
      }),
    )

    return this.melhorEnvioClient.quote({
      fromZipCode: this.originZipCode,
      toZipCode: input.destinationZipCode,
      products: products.map(({ item, product }) => ({
        quantity: item.qty,
        insuranceValue: product.priceClubCents / 100,
        ...DEFAULT_PARCEL,
      })),
    })
  }
}
