import {
  registerCors,
  registerErrorHandler,
  registerHealth,
  registerScalar,
} from '@clube/fastify-plugins'
import Fastify, { type FastifyInstance } from 'fastify'
import {
  createOrderUseCase,
  enqueueProcessPaymentWebhook,
  getProductUseCase,
  listProductsUseCase,
  orderRepository,
  productRepository,
  quoteShippingUseCase,
  requireAuth,
  requireOwner,
  requireSubscriber,
  storeAuthPreHandler,
} from './infrastructure/http/container'
import { registerAdminRoutes } from './infrastructure/http/routes/admin'
import { registerOrdersRoutes } from './infrastructure/http/routes/orders'
import { registerProductsRoutes } from './infrastructure/http/routes/products'
import { registerShippingRoutes } from './infrastructure/http/routes/shipping'
import { registerWebhookRoutes } from './infrastructure/http/routes/webhook'

export async function buildApp(
  opts: { logger?: boolean } = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true })

  await registerCors(app)
  await registerErrorHandler(app)
  await registerScalar(app, 'Clube Store')
  await registerHealth(app)
  await registerProductsRoutes(app, {
    storeAuthPreHandler,
    requireOwner,
    listProductsUseCase,
    getProductUseCase,
    productRepository,
  })
  await registerOrdersRoutes(app, {
    storeAuthPreHandler,
    requireAuth,
    requireSubscriber,
    createOrderUseCase,
    orderRepository,
  })
  await registerShippingRoutes(app, {
    storeAuthPreHandler,
    requireAuth,
    quoteShippingUseCase,
  })
  await registerWebhookRoutes(app, { enqueueProcessPaymentWebhook })
  await registerAdminRoutes(app, {
    storeAuthPreHandler,
    requireOwner,
    orderRepository,
    productRepository,
  })

  return app
}
