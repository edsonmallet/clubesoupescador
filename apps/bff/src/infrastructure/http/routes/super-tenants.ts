import type { AuthenticatedUser } from '@clube/fastify-plugins'
import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { CreateTenantUseCase } from '../../../application/super-tenants/create-tenant.usecase'
import type { GetTenantUseCase } from '../../../application/super-tenants/get-tenant.usecase'
import type { ImpersonateTenantUseCase } from '../../../application/super-tenants/impersonate-tenant.usecase'
import type { ListTenantsUseCase } from '../../../application/super-tenants/list-tenants.usecase'
import type { UpdateTenantStatusUseCase } from '../../../application/super-tenants/update-tenant-status.usecase'
import {
  CreateTenantBodySchema,
  ErrorResponseSchema,
  ImpersonateResponseSchema,
  ListTenantsResponseSchema,
  TenantSchema,
  TenantWithMemberCountSchema,
  UpdateTenantStatusBodySchema,
} from '../schemas/super-tenants'

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

export type SuperTenantsRouteDeps = {
  superAuthPreHandler: preHandlerHookHandler
  requireSuperAdmin: preHandlerHookHandler
  listTenantsUseCase: ListTenantsUseCase
  getTenantUseCase: GetTenantUseCase
  createTenantUseCase: CreateTenantUseCase
  updateTenantStatusUseCase: UpdateTenantStatusUseCase
  impersonateTenantUseCase: ImpersonateTenantUseCase
}

export async function registerSuperTenantsRoutes(
  app: FastifyInstance,
  deps: SuperTenantsRouteDeps,
): Promise<void> {
  const preHandler = [deps.superAuthPreHandler, deps.requireSuperAdmin]

  app.get(
    '/v1/super/tenants',
    { preHandler, schema: { response: { 200: ListTenantsResponseSchema } } },
    async (_request, reply) => {
      const results = await deps.listTenantsUseCase.execute()
      reply.status(200).send(
        results.map(({ tenant, memberCount }) => ({
          tenant: serializeTenant(tenant),
          memberCount,
        })),
      )
    },
  )

  app.post(
    '/v1/super/tenants',
    {
      preHandler,
      schema: { body: CreateTenantBodySchema, response: { 201: TenantSchema } },
    },
    async (request, reply) => {
      const body = request.body as {
        slug: string
        name: string
        ownerUid: string
        logoUrl?: string | null
      }
      const tenant = await deps.createTenantUseCase.execute(body)
      reply.status(201).send(serializeTenant(tenant))
    },
  )

  app.get(
    '/v1/super/tenants/:id',
    {
      preHandler,
      schema: { response: { 200: TenantWithMemberCountSchema, 404: ErrorResponseSchema } },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { tenant, memberCount } = await deps.getTenantUseCase.execute(id)
      reply.status(200).send({ tenant: serializeTenant(tenant), memberCount })
    },
  )

  app.patch(
    '/v1/super/tenants/:id/status',
    {
      preHandler,
      schema: {
        body: UpdateTenantStatusBodySchema,
        response: { 200: TenantSchema, 404: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { status } = request.body as { status: 'active' | 'suspended' }
      const tenant = await deps.updateTenantStatusUseCase.execute(id, status)
      reply.status(200).send(serializeTenant(tenant))
    },
  )

  app.post(
    '/v1/super/tenants/:id/impersonate',
    {
      preHandler,
      schema: { response: { 200: ImpersonateResponseSchema, 404: ErrorResponseSchema } },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const user = request.user as AuthenticatedUser
      const result = await deps.impersonateTenantUseCase.execute(id, user.uid)
      request.log.info(
        { superAdminUid: user.uid, tenantId: id, ownerUid: result.ownerUid },
        'tenant impersonation issued',
      )
      reply.status(200).send(result)
    },
  )
}
