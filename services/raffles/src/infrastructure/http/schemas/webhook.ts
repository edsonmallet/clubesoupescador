import { Type } from '@sinclair/typebox'

export const WebhookReceivedResponseSchema = Type.Object({
  received: Type.Boolean(),
})

export const WebhookErrorResponseSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
})
