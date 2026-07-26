import type { Product } from '../entities/Product'

export type CreateProductDto = {
  tenantId: string
  name: string
  description: string
  priceFullCents: number
  priceClubCents: number
  stock: number
  sku: string
  images: string[]
  active: boolean
}

export type UpdateProductDto = Partial<Omit<CreateProductDto, 'tenantId'>>

export type PaginatedResult<T> = {
  items: T[]
  total: number
}

export interface IProductRepository {
  findMany(
    tenantId: string,
    page: number,
    perPage: number,
    active?: boolean,
  ): Promise<PaginatedResult<Product>>
  findById(tenantId: string, id: string): Promise<Product | null>
  updateStock(id: string, qty: number): Promise<void>
  create(data: CreateProductDto): Promise<Product>
  update(id: string, data: UpdateProductDto): Promise<Product>
}
