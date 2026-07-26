import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { ICashbackConfigRepository } from '../../../domain/interfaces/ICashbackConfigRepository'
import {
  ConfigItemSchema,
  ConfigListResponseSchema,
  ErrorResponseSchema,
  UpdateConfigBodySchema,
} from '../schemas/cashback'

export type AdminRouteDeps = {
  cashbackAuthPreHandler: preHandlerHookHandler
  requireOwner: preHandlerHookHandler
  configRepository: ICashbackConfigRepository
}

function requireTenantId(headers: Record<string, unknown>): string | null {
  const tenantId = headers['x-tenant-id']
  return typeof tenantId === 'string' ? tenantId : null
}

export async function registerAdminRoutes(
  app: FastifyInstance,
  deps: AdminRouteDeps,
): Promise<void> {
  app.get(
    '/config',
    {
      preHandler: [deps.cashbackAuthPreHandler, deps.requireOwner],
      schema: {
        response: { 200: ConfigListResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenantId(request.headers)
      if (!tenantId) {
        reply.status(400).send({
          error: {
            code: 'MISSING_TENANT',
            message: 'x-tenant-id header is required',
          },
        })
        return
      }

      const configs = await deps.configRepository.findAll(tenantId)
      reply.status(200).send(
        configs.map((c) => ({
          source: c.source,
          pct: c.pct,
          expiryMonths: c.expiryMonths,
        })),
      )
    },
  )

  app.patch(
    '/config',
    {
      preHandler: [deps.cashbackAuthPreHandler, deps.requireOwner],
      schema: {
        body: UpdateConfigBodySchema,
        response: {
          200: ConfigItemSchema,
          400: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenantId(request.headers)
      if (!tenantId) {
        reply.status(400).send({
          error: {
            code: 'MISSING_TENANT',
            message: 'x-tenant-id header is required',
          },
        })
        return
      }

      const body = request.body as {
        source: string
        pct: number
        expiryMonths: number
      }

      const updated = await deps.configRepository.upsert({
        tenantId,
        source: body.source,
        pct: body.pct,
        expiryMonths: body.expiryMonths,
      })

      reply.status(200).send({
        source: updated.source,
        pct: updated.pct,
        expiryMonths: updated.expiryMonths,
      })
    },
  )
}
