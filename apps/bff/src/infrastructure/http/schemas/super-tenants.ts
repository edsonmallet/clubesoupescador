import { Type } from '@sinclair/typebox'

export const TenantSchema = Type.Object({
  id: Type.String(),
  slug: Type.String(),
  name: Type.String(),
  logoUrl: Type.Union([Type.String(), Type.Null()]),
  planId: Type.Union([Type.String(), Type.Null()]),
  status: Type.Union([
    Type.Literal('active'),
    Type.Literal('suspended'),
    Type.Literal('canceled'),
  ]),
  ownerUid: Type.String(),
  createdAt: Type.String(),
})

export const TenantWithMemberCountSchema = Type.Object({
  tenant: TenantSchema,
  memberCount: Type.Number(),
})

export const ListTenantsResponseSchema = Type.Array(TenantWithMemberCountSchema)

export const CreateTenantBodySchema = Type.Object({
  slug: Type.String({ minLength: 1 }),
  name: Type.String({ minLength: 1 }),
  ownerUid: Type.String({ minLength: 1 }),
  logoUrl: Type.Optional(Type.Union([Type.String(), Type.Null()])),
})

export const UpdateTenantStatusBodySchema = Type.Object({
  status: Type.Union([Type.Literal('active'), Type.Literal('suspended')]),
})

export const ImpersonateResponseSchema = Type.Object({
  token: Type.String(),
  ownerUid: Type.String(),
  slug: Type.String(),
})

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({
    code: Type.String(),
    message: Type.String(),
  }),
})
