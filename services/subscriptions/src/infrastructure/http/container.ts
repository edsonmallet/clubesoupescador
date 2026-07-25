import { CreateCheckoutUseCase } from '../../application/subscriptions/create-checkout.usecase'
import { ListPlansUseCase } from '../../application/subscriptions/list-plans.usecase'
import { ProcessWebhookUseCase } from '../../application/subscriptions/process-webhook.usecase'
import { GrantXpUseCase } from '../../application/xp/grant-xp.usecase'
import { db } from '../db'
import { LevelRepository } from '../db/repositories/level.repository'
import { PlanRepository } from '../db/repositories/plan.repository'
import { SubscriptionRepository } from '../db/repositories/subscription.repository'
import { XpEventRepository } from '../db/repositories/xp-event.repository'
import { getAsaasClient } from '../external/asaas/client'
import { enqueueProcessWebhook } from '../queue/subscriptions.queue'
import { requireAuth, subscriptionsAuthPreHandler } from './proxy'

export const subscriptionRepository = new SubscriptionRepository(db)
export const planRepository = new PlanRepository(db)
export const levelRepository = new LevelRepository(db)
export const xpEventRepository = new XpEventRepository(db)

export const listPlansUseCase = new ListPlansUseCase(planRepository)
export const createCheckoutUseCase = new CreateCheckoutUseCase(
  subscriptionRepository,
  planRepository,
  getAsaasClient(),
)

export const grantXpUseCase = new GrantXpUseCase(
  subscriptionRepository,
  levelRepository,
  (event) => xpEventRepository.insert(event),
)
export const processWebhookUseCase = new ProcessWebhookUseCase(
  subscriptionRepository,
  grantXpUseCase,
)

export { subscriptionsAuthPreHandler, requireAuth, enqueueProcessWebhook }
