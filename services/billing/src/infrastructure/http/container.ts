import { CreateCheckoutUseCase } from '../../application/billing/create-checkout.usecase'
import { GetBillingOverviewUseCase } from '../../application/billing/get-billing-overview.usecase'
import { ProcessWebhookUseCase } from '../../application/billing/process-webhook.usecase'
import { CreatePlanUseCase } from '../../application/plans/create-plan.usecase'
import { ListPlansUseCase } from '../../application/plans/list-plans.usecase'
import { UpdatePlanUseCase } from '../../application/plans/update-plan.usecase'
import { db } from '../db'
import { SaasPlanRepository } from '../db/repositories/saas-plan.repository'
import { TenantBillingRepository } from '../db/repositories/tenant-billing.repository'
import { getAsaasClient } from '../external/asaas/client'
import { updateTenantBilling } from '../external/bff/client'
import { enqueueProcessWebhook } from '../queue/billing.queue'
import { billingAuthPreHandler, requireOwner, requireSuperAdmin } from './proxy'

export const saasPlanRepository = new SaasPlanRepository(db)
export const tenantBillingRepository = new TenantBillingRepository(db)

export const listPlansUseCase = new ListPlansUseCase(saasPlanRepository)
export const createPlanUseCase = new CreatePlanUseCase(saasPlanRepository)
export const updatePlanUseCase = new UpdatePlanUseCase(saasPlanRepository)

export const createCheckoutUseCase = new CreateCheckoutUseCase(
  tenantBillingRepository,
  saasPlanRepository,
  getAsaasClient(),
)

export const getBillingOverviewUseCase = new GetBillingOverviewUseCase(
  tenantBillingRepository,
  saasPlanRepository,
)

export const processWebhookUseCase = new ProcessWebhookUseCase(
  tenantBillingRepository,
  { updateTenantBilling },
)

export {
  billingAuthPreHandler,
  requireOwner,
  requireSuperAdmin,
  enqueueProcessWebhook,
}
