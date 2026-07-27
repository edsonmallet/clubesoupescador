import type { FastifyInstance } from 'fastify'
import type { UpdateTenantBillingUseCase } from '../../../application/tenants/update-tenant-billing.usecase'
import { env } from '../../../shared/env'
import {
  ErrorResponseSchema,
  UpdateTenantBillingBodySchema,
  UpdateTenantBillingResponseSchema,
} from '../schemas/internal'

export type InternalRouteDeps = {
  updateTenantBillingUseCase: UpdateTenantBillingUseCase
}

function serializeTenant(tenant: {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  planId: string | null
  status: string
  ownerUid: string
  createdAt: Date
}) {
  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    logoUrl: tenant.logoUrl,
    planId: tenant.planId,
    status: tenant.status,
    ownerUid: tenant.ownerUid,
    createdAt: tenant.createdAt.toISOString(),
  }
}

/**
 * Hit only by services/billing (webhook -> ProcessWebhookUseCase ->
 * updateTenantBilling client), protected by a shared secret instead of a
 * Firebase token — same pattern as services/community's
 * `POST /internal/topics` (see that file for the model this copies).
 */
export async function registerInternalRoutes(
  app: FastifyInstance,
  deps: InternalRouteDeps,
): Promise<void> {
  app.patch(
    '/internal/tenants/:id/billing',
    {
      schema: {
        body: UpdateTenantBillingBodySchema,
        response: {
          200: UpdateTenantBillingResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const token = request.headers['x-internal-token']
      if (token !== env.INTERNAL_SERVICE_TOKEN) {
        reply.status(401).send({
          error: {
            code: 'INVALID_INTERNAL_TOKEN',
            message: 'Invalid internal token',
          },
        })
        return
      }

      const { id } = request.params as { id: string }
      const body = request.body as { status: 'active' | 'suspended'; planId?: string }

      const tenant = await deps.updateTenantBillingUseCase.execute(id, body)

      reply.status(200).send(serializeTenant(tenant))
    },
  )
}
