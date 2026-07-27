import { Type } from '@sinclair/typebox'
import { ErrorResponseSchema, TenantSchema } from './super-tenants'

export { ErrorResponseSchema }

export const UpdateTenantBillingBodySchema = Type.Object({
  status: Type.Union([Type.Literal('active'), Type.Literal('suspended')]),
  planId: Type.Optional(Type.String({ minLength: 1 })),
})

export const UpdateTenantBillingResponseSchema = TenantSchema
