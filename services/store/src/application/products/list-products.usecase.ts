import type { Product } from '../../domain/entities/Product'
import type {
  IProductRepository,
  PaginatedResult,
} from '../../domain/interfaces/IProductRepository'

export type ListProductsInput = {
  tenantId: string
  isSubscriber: boolean
  page: number
  perPage: number
}

export type ProductListItem = {
  id: string
  name: string
  description: string
  priceFullCents: number
  priceClubCents: number
  stock: number
  images: string[]
}

export class ListProductsUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(
    input: ListProductsInput,
  ): Promise<PaginatedResult<ProductListItem>> {
    const result = await this.productRepository.findMany(
      input.tenantId,
      input.page,
      input.perPage,
      true,
    )

    return {
      items: result.items.map((product) =>
        toListItem(product, input.isSubscriber),
      ),
      total: result.total,
    }
  }
}

function toListItem(product: Product, isSubscriber: boolean): ProductListItem {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    priceFullCents: product.priceFullCents,
    // Non-subscribers only see the club price is locked behind membership —
    // 0 is the UI's cue to render the padlock, not a real price.
    priceClubCents: isSubscriber ? product.priceClubCents : 0,
    stock: product.stock,
    images: product.images,
  }
}
