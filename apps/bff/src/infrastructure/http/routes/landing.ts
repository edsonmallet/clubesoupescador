import type { Tenant } from '@clube/fastify-plugins'
import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { AddDomainUseCase } from '../../../application/tenants/add-domain.usecase'
import type { GetLandingConfigUseCase } from '../../../application/tenants/get-landing-config.usecase'
import type { ListDomainsUseCase } from '../../../application/tenants/list-domains.usecase'
import type { UpdateLandingConfigUseCase } from '../../../application/tenants/update-landing-config.usecase'
import type { VerifyDomainUseCase } from '../../../application/tenants/verify-domain.usecase'
import {
  CreateDomainBodySchema,
  DomainSchema,
  ErrorResponseSchema,
  LandingConfigSchema,
  ListDomainsResponseSchema,
  UpdateLandingConfigBodySchema,
} from '../schemas/landing'

export type LandingRouteDeps = {
  tenantAuthPreHandler: preHandlerHookHandler
  requireOwner: preHandlerHookHandler
  getLandingConfigUseCase: GetLandingConfigUseCase
  updateLandingConfigUseCase: UpdateLandingConfigUseCase
  listDomainsUseCase: ListDomainsUseCase
  addDomainUseCase: AddDomainUseCase
  verifyDomainUseCase: VerifyDomainUseCase
}

export async function registerLandingRoutes(
  app: FastifyInstance,
  deps: LandingRouteDeps,
): Promise<void> {
  app.get(
    '/v1/admin/landing-config',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: { 200: LandingConfigSchema } },
    },
    async (request, reply) => {
      const tenant = request.tenant as Tenant
      const config = await deps.getLandingConfigUseCase.execute(tenant.id)
      reply.status(200).send(config)
    },
  )

  app.patch(
    '/v1/admin/landing-config',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: {
        body: UpdateLandingConfigBodySchema,
        response: { 200: LandingConfigSchema },
      },
    },
    async (request, reply) => {
      const tenant = request.tenant as Tenant
      const config = await deps.updateLandingConfigUseCase.execute(
        tenant.id,
        request.body as Record<string, unknown>,
      )
      reply.status(200).send(config)
    },
  )

  app.get(
    '/v1/admin/domains',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: { 200: ListDomainsResponseSchema } },
    },
    async (request, reply) => {
      const tenant = request.tenant as Tenant
      const domains = await deps.listDomainsUseCase.execute(tenant.id)
      reply.status(200).send(domains)
    },
  )

  app.post(
    '/v1/admin/domains',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: {
        body: CreateDomainBodySchema,
        response: { 201: DomainSchema },
      },
    },
    async (request, reply) => {
      const tenant = request.tenant as Tenant
      const { domain } = request.body as { domain: string }
      const created = await deps.addDomainUseCase.execute(tenant.id, domain)
      reply.status(201).send(created)
    },
  )

  app.post(
    '/v1/admin/domains/:id/verify',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: {
        response: { 200: DomainSchema, 404: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const result = await deps.verifyDomainUseCase.execute(id)
      reply.status(200).send(result)
    },
  )
}
