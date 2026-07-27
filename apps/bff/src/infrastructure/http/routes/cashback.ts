import type { Tenant } from '@clube/fastify-plugins'
import { Type } from '@sinclair/typebox'
import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  preHandlerHookHandler,
} from 'fastify'

/**
 * These routes are pure passthroughs: the authoritative response shapes are
 * owned and validated by services/cashback. The proxy deliberately does not
 * re-validate them, so the schema stays permissive.
 */
const ProxyResponseSchema = {
  '2xx': Type.Unknown(),
  '4xx': Type.Unknown(),
  '5xx': Type.Unknown(),
}

export type CashbackProxyDeps = {
  cashbackServiceUrl: string
  tenantAuthPreHandler: preHandlerHookHandler
  requireAuth: preHandlerHookHandler
  requireOwner: preHandlerHookHandler
}

async function forward(
  request: FastifyRequest,
  reply: FastifyReply,
  deps: CashbackProxyDeps,
  path: string,
): Promise<void> {
  const tenant = request.tenant as Tenant
  const headers: Record<string, string> = { 'x-tenant-id': tenant.id }

  const authorization = request.headers.authorization
  if (authorization) headers.authorization = authorization

  const init: RequestInit = { method: request.method, headers }
  if (request.method !== 'GET' && request.body !== undefined) {
    headers['content-type'] = 'application/json'
    init.body = JSON.stringify(request.body)
  }

  const response = await fetch(`${deps.cashbackServiceUrl}${path}`, init)
  const body = await response.json()
  reply.status(response.status).send(body)
}

export async function registerCashbackProxyRoutes(
  app: FastifyInstance,
  deps: CashbackProxyDeps,
): Promise<void> {
  app.get(
    '/v1/cashback/balance',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireAuth],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/')
    },
  )

  app.get(
    '/v1/cashback/history',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireAuth],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const query = new URLSearchParams(
        request.query as Record<string, string>,
      ).toString()
      await forward(request, reply, deps, `/history${query ? `?${query}` : ''}`)
    },
  )

  app.get(
    '/v1/admin/cashback-config',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/config')
    },
  )

  app.patch(
    '/v1/admin/cashback-config',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/config')
    },
  )

  app.get(
    '/v1/admin/cashback-summary',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/summary')
    },
  )
}
