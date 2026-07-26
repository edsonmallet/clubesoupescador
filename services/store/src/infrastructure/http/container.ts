import { CreateOrderUseCase } from '../../application/orders/create-order.usecase'
import { ProcessPaymentWebhookUseCase } from '../../application/orders/process-payment-webhook.usecase'
import { GetProductUseCase } from '../../application/products/get-product.usecase'
import { ListProductsUseCase } from '../../application/products/list-products.usecase'
import { QuoteShippingUseCase } from '../../application/shipping/quote-shipping.usecase'
import { env } from '../../shared/env'
import { db } from '../db'
import { OrderRepository } from '../db/repositories/order.repository'
import { ProductRepository } from '../db/repositories/product.repository'
import { getAsaasClient } from '../external/asaas/client'
import { MelhorEnvioClient } from '../external/melhor-envio/client'
import { SubscriptionsClient } from '../external/subscriptions/client'
import {
  enqueueCashbackDebit,
  enqueueGrantCashback,
  enqueueGrantXp,
} from '../queue/cross-service.queue'
import { enqueueProcessPaymentWebhook } from '../queue/store.queue'
import {
  requireAuth,
  requireOwner,
  requireSubscriber,
  storeAuthPreHandler,
} from './proxy'

export const productRepository = new ProductRepository(db)
export const orderRepository = new OrderRepository(db)
export const subscriptionsClient = new SubscriptionsClient()
export const melhorEnvioClient = new MelhorEnvioClient(
  env.MELHOR_ENVIO_TOKEN,
  env.MELHOR_ENVIO_ENV,
)

export const listProductsUseCase = new ListProductsUseCase(productRepository)
export const getProductUseCase = new GetProductUseCase(productRepository)

export const createOrderUseCase = new CreateOrderUseCase(
  productRepository,
  orderRepository,
  subscriptionsClient,
  getAsaasClient(),
  enqueueCashbackDebit,
)

export const processPaymentWebhookUseCase = new ProcessPaymentWebhookUseCase(
  orderRepository,
  enqueueGrantXp,
  enqueueGrantCashback,
)

export const quoteShippingUseCase = new QuoteShippingUseCase(
  productRepository,
  melhorEnvioClient,
  env.STORE_ORIGIN_ZIP_CODE,
)

export {
  enqueueProcessPaymentWebhook,
  requireAuth,
  requireOwner,
  requireSubscriber,
  storeAuthPreHandler,
}
