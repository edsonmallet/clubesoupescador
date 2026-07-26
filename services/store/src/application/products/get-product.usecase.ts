import { ProductNotFoundError } from '../../domain/errors'
import type { IProductRepository } from '../../domain/interfaces/IProductRepository'
import type { ProductListItem } from './list-products.usecase'

export type GetProductInput = {
  tenantId: string
  id: string
  isSubscriber: boolean
}

export class GetProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(input: GetProductInput): Promise<ProductListItem> {
    const product = await this.productRepository.findById(
      input.tenantId,
      input.id,
    )
    if (!product || !product.active) {
      throw new ProductNotFoundError(input.id)
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      priceFullCents: product.priceFullCents,
      priceClubCents: input.isSubscriber ? product.priceClubCents : 0,
      stock: product.stock,
      images: product.images,
    }
  }
}
