import { buildApp } from './app'
import { processWebhookUseCase } from './infrastructure/http/container'
import { startBillingWorker } from './infrastructure/queue/worker'
import { env } from './shared/env'

async function bootstrap() {
  const app = await buildApp()
  startBillingWorker(processWebhookUseCase)
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

bootstrap()
