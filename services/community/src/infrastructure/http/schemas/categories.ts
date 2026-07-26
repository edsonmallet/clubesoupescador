import { Type } from '@sinclair/typebox'

export const CategorySchema = Type.Object({
  id: Type.String(),
  slug: Type.String(),
  name: Type.String(),
  description: Type.String(),
})

export const ListCategoriesResponseSchema = Type.Array(CategorySchema)

export const CreateCategoryBodySchema = Type.Object({
  slug: Type.String({ minLength: 1 }),
  name: Type.String({ minLength: 1 }),
  description: Type.String(),
})

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
})
