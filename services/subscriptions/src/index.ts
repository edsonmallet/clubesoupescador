import { buildApp } from './app'
import {
  grantXpByUidUseCase,
  processWebhookUseCase,
} from './infrastructure/http/container'
import { startSubscriptionsWorker } from './infrastructure/queue/worker'
import { env } from './shared/env'

async function bootstrap() {
  const app = await buildApp()
  startSubscriptionsWorker(processWebhookUseCase, grantXpByUidUseCase)
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

bootstrap()
