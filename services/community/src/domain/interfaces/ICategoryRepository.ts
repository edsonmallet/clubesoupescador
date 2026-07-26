import type { Category } from '../entities/Category'

export type CreateCategoryDto = {
  tenantId: string
  slug: string
  name: string
  description: string
}

export interface ICategoryRepository {
  findAll(tenantId: string): Promise<Category[]>
  findBySlug(tenantId: string, slug: string): Promise<Category | null>
  findById(tenantId: string, id: string): Promise<Category | null>
  create(data: CreateCategoryDto): Promise<Category>
}
