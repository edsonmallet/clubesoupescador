import { buildApp } from './app'
import { processPaymentWebhookUseCase } from './infrastructure/http/container'
import { startStoreWorker } from './infrastructure/queue/worker'
import { env } from './shared/env'

async function bootstrap() {
  const app = await buildApp()
  startStoreWorker(processPaymentWebhookUseCase)
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

bootstrap()
