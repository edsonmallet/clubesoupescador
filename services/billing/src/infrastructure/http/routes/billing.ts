import type { AuthenticatedUser } from '@clube/fastify-plugins'
import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { CreateCheckoutUseCase } from '../../../application/billing/create-checkout.usecase'
import type { GetBillingOverviewUseCase } from '../../../application/billing/get-billing-overview.usecase'
import type { ITenantBillingRepository } from '../../../domain/interfaces/ITenantBillingRepository'
import {
  BillingOverviewResponseSchema,
  CheckoutBodySchema,
  CheckoutResponseSchema,
  TenantBillingSchema,
} from '../schemas/billing'
import { ErrorResponseSchema } from '../schemas/plans'

export type BillingRouteDeps = {
  billingAuthPreHandler: preHandlerHookHandler
  requireOwner: preHandlerHookHandler
  requireSuperAdmin: preHandlerHookHandler
  createCheckoutUseCase: CreateCheckoutUseCase
  tenantBillingRepository: ITenantBillingRepository
  getBillingOverviewUseCase: GetBillingOverviewUseCase
}

export async function registerBillingRoutes(
  app: FastifyInstance,
  deps: BillingRouteDeps,
): Promise<void> {
  app.post(
    '/checkout',
    {
      preHandler: [deps.billingAuthPreHandler, deps.requireOwner],
      schema: {
        body: CheckoutBodySchema,
        response: {
          200: CheckoutResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = request.user as AuthenticatedUser
      // Never accept tenantId from the request body — it always comes from
      // the authenticated caller's own claim.
      const tenantId = user.tenant_id as string
      const { planId, name, cpfCnpj } = request.body as {
        planId: string
        name: string
        cpfCnpj: string
      }

      const { id, status, paymentUrl } =
        await deps.createCheckoutUseCase.execute({
          tenantId,
          planId,
          name,
          cpfCnpj,
        })

      reply.status(200).send({ id, status, paymentUrl })
    },
  )

  app.get(
    '/me',
    {
      preHandler: [deps.billingAuthPreHandler, deps.requireOwner],
      schema: {
        response: { 200: TenantBillingSchema, 404: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const user = request.user as AuthenticatedUser
      const tenantId = user.tenant_id as string

      const tenantBilling =
        await deps.tenantBillingRepository.findByTenantId(tenantId)

      if (!tenantBilling) {
        reply.status(404).send({
          error: {
            code: 'TENANT_BILLING_NOT_FOUND',
            message: 'Tenant never subscribed to a billing plan',
          },
        })
        return
      }

      reply.status(200).send({
        id: tenantBilling.id,
        tenantId: tenantBilling.tenantId,
        planId: tenantBilling.planId,
        asaasCustomerId: tenantBilling.asaasCustomerId,
        asaasSubscriptionId: tenantBilling.asaasSubscriptionId,
        status: tenantBilling.status,
        createdAt: tenantBilling.createdAt.toISOString(),
        updatedAt: tenantBilling.updatedAt.toISOString(),
      })
    },
  )

  app.get(
    '/tenants',
    {
      preHandler: [deps.billingAuthPreHandler, deps.requireSuperAdmin],
      schema: { response: { 200: BillingOverviewResponseSchema } },
    },
    async (_request, reply) => {
      const { items, summary } = await deps.getBillingOverviewUseCase.execute()

      reply.status(200).send({
        items,
        mrrCents: summary.mrrCents,
        overdueCount: summary.overdueCount,
      })
    },
  )
}
