import { Type } from '@sinclair/typebox'
import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  preHandlerHookHandler,
} from 'fastify'

/**
 * These routes are pure passthroughs: the authoritative response shapes are
 * owned and validated by services/billing. The proxy deliberately does not
 * re-validate them, so the schema stays permissive.
 *
 * Unlike the other service proxies (subscriptions, store, community, ...),
 * this one does NOT use `tenantAuthPreHandler`. Those services are reached
 * from the tenant's own PWA host ([slug].clube.com.br) and need the
 * host-resolved `x-tenant-id` header. services/billing is reached from
 * apps/super-admin (superadmin.clube.com.br — not a tenant subdomain, so
 * host-based tenant resolution would 404) and apps/admin, and it already
 * derives the caller's tenant from the Firebase JWT's `tenant_id` claim
 * (verified independently by its own `billingAuthPreHandler`, see
 * services/billing/src/infrastructure/http/routes/billing.ts). Forwarding
 * `tenantAuthPreHandler` here would also lock out a tenant whose billing
 * just went `suspended` from ever reaching /checkout again to pay and
 * reactivate, since `resolveTenant` only accepts `active` tenants.
 */
const ProxyResponseSchema = {
  '2xx': Type.Unknown(),
  '4xx': Type.Unknown(),
  '5xx': Type.Unknown(),
}

export type BillingProxyDeps = {
  billingServiceUrl: string
  superAuthPreHandler: preHandlerHookHandler
  requireOwner: preHandlerHookHandler
  requireSuperAdmin: preHandlerHookHandler
}

async function forward(
  request: FastifyRequest,
  reply: FastifyReply,
  deps: BillingProxyDeps,
  path: string,
): Promise<void> {
  const headers: Record<string, string> = {}

  const authorization = request.headers.authorization
  if (authorization) headers.authorization = authorization

  const init: RequestInit = { method: request.method, headers }
  if (request.method !== 'GET' && request.body !== undefined) {
    headers['content-type'] = 'application/json'
    init.body = JSON.stringify(request.body)
  }

  const response = await fetch(`${deps.billingServiceUrl}${path}`, init)
  const body = await response.json()
  reply.status(response.status).send(body)
}

export async function registerBillingProxyRoutes(
  app: FastifyInstance,
  deps: BillingProxyDeps,
): Promise<void> {
  app.get(
    '/v1/billing/plans',
    {
      preHandler: [deps.superAuthPreHandler],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/plans')
    },
  )

  app.get(
    '/v1/billing/plans/all',
    {
      preHandler: [deps.superAuthPreHandler, deps.requireSuperAdmin],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/plans/all')
    },
  )

  app.post(
    '/v1/billing/plans',
    {
      preHandler: [deps.superAuthPreHandler, deps.requireSuperAdmin],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/plans')
    },
  )

  app.patch(
    '/v1/billing/plans/:id',
    {
      preHandler: [deps.superAuthPreHandler, deps.requireSuperAdmin],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/plans/${id}`)
    },
  )

  app.post(
    '/v1/billing/checkout',
    {
      preHandler: [deps.superAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/checkout')
    },
  )

  app.get(
    '/v1/billing/me',
    {
      preHandler: [deps.superAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/me')
    },
  )

  app.get(
    '/v1/billing/tenants',
    {
      preHandler: [deps.superAuthPreHandler, deps.requireSuperAdmin],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/tenants')
    },
  )
}
