import { Type } from '@sinclair/typebox'

export const ProductListItemSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.String(),
  priceFullCents: Type.Number(),
  priceClubCents: Type.Number(),
  stock: Type.Number(),
  images: Type.Array(Type.String()),
})

export const ListProductsResponseSchema = Type.Object({
  items: Type.Array(ProductListItemSchema),
  total: Type.Number(),
})

export const AdminProductListItemSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.String(),
  priceFullCents: Type.Number(),
  priceClubCents: Type.Number(),
  stock: Type.Number(),
  sku: Type.String(),
  images: Type.Array(Type.String()),
  active: Type.Boolean(),
})

export const AdminListProductsResponseSchema = Type.Object({
  items: Type.Array(AdminProductListItemSchema),
  total: Type.Number(),
})

export const CreateProductBodySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  description: Type.String(),
  priceFullCents: Type.Number({ minimum: 0 }),
  priceClubCents: Type.Number({ minimum: 0 }),
  stock: Type.Number({ minimum: 0 }),
  sku: Type.String({ minLength: 1 }),
  images: Type.Array(Type.String()),
  active: Type.Optional(Type.Boolean()),
})

export const ProductSchema = Type.Object({
  id: Type.String(),
  tenantId: Type.String(),
  name: Type.String(),
  description: Type.String(),
  priceFullCents: Type.Number(),
  priceClubCents: Type.Number(),
  stock: Type.Number(),
  sku: Type.String(),
  images: Type.Array(Type.String()),
  active: Type.Boolean(),
})

export const UpdateProductBodySchema = Type.Partial(CreateProductBodySchema)

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
})
