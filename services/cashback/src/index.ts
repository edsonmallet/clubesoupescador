import { buildApp } from './app'
import {
  debitCashbackUseCase,
  expireCashbackUseCase,
  grantCashbackUseCase,
} from './infrastructure/http/container'
import { scheduleExpiryJob } from './infrastructure/queue/cashback.queue'
import { startCashbackWorker } from './infrastructure/queue/worker'
import { env } from './shared/env'

async function bootstrap() {
  const app = await buildApp()
  startCashbackWorker(
    grantCashbackUseCase,
    debitCashbackUseCase,
    expireCashbackUseCase,
  )
  await scheduleExpiryJob()
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

bootstrap()
