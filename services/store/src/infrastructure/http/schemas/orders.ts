import { Type } from '@sinclair/typebox'

export const OrderAddressSchema = Type.Object({
  zipCode: Type.String({ minLength: 1 }),
  street: Type.String({ minLength: 1 }),
  number: Type.String({ minLength: 1 }),
  complement: Type.Union([Type.String(), Type.Null()]),
  neighborhood: Type.String({ minLength: 1 }),
  city: Type.String({ minLength: 1 }),
  state: Type.String({ minLength: 2, maxLength: 2 }),
})

export const CreateOrderItemSchema = Type.Object({
  productId: Type.String(),
  qty: Type.Number({ minimum: 1 }),
})

export const CreateOrderBodySchema = Type.Object({
  items: Type.Array(CreateOrderItemSchema, { minItems: 1 }),
  cashbackUseCents: Type.Number({ minimum: 0 }),
  address: OrderAddressSchema,
})

export const CreateOrderResponseSchema = Type.Object({
  orderId: Type.String(),
  totalCents: Type.Number(),
  paymentUrl: Type.Union([Type.String(), Type.Null()]),
  cashbackAppliedCents: Type.Number(),
})

export const OrderItemSchema = Type.Object({
  id: Type.String(),
  productId: Type.String(),
  qty: Type.Number(),
  unitPriceCents: Type.Number(),
  discountPct: Type.Number(),
})

export const OrderSchema = Type.Object({
  id: Type.String(),
  status: Type.String(),
  items: Type.Array(OrderItemSchema),
  subtotalCents: Type.Number(),
  levelDiscountAmtCents: Type.Number(),
  cashbackUsedAmtCents: Type.Number(),
  shippingAmtCents: Type.Number(),
  totalCents: Type.Number(),
  trackingCode: Type.Union([Type.String(), Type.Null()]),
  shippingLabelUrl: Type.Union([Type.String(), Type.Null()]),
  address: OrderAddressSchema,
  createdAt: Type.String(),
})

export const ListOrdersResponseSchema = Type.Object({
  items: Type.Array(OrderSchema),
  total: Type.Number(),
})

export const AdminUpdateOrderBodySchema = Type.Object({
  status: Type.Optional(Type.String()),
  trackingCode: Type.Optional(Type.String()),
  shippingLabelUrl: Type.Optional(Type.String()),
})

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
})
