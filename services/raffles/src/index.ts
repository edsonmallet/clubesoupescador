import { buildApp } from './app'
import {
  drawRaffleUseCase,
  ticketRepository,
} from './infrastructure/http/container'
import { startRafflesWorker } from './infrastructure/queue/worker'
import { env } from './shared/env'

async function bootstrap() {
  const app = await buildApp()
  startRafflesWorker(drawRaffleUseCase, ticketRepository)
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

bootstrap()
