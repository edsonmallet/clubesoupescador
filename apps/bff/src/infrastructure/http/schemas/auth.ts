import { Type } from '@sinclair/typebox'

export const RegisterUserResponseSchema = Type.Object({
  id: Type.String(),
  tenantId: Type.String(),
  uid: Type.String(),
  role: Type.String(),
  createdAt: Type.String(),
})

export const MeResponseSchema = Type.Object({
  uid: Type.String(),
  role: Type.String(),
  tenantId: Type.String(),
  registeredAt: Type.Union([Type.String(), Type.Null()]),
})
