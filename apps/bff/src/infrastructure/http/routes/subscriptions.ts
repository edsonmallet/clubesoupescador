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
 * owned and validated by services/subscriptions. The proxy deliberately does
 * not re-validate them, so the schema stays permissive.
 */
const ProxyResponseSchema = {
  '2xx': Type.Unknown(),
  '4xx': Type.Unknown(),
  '5xx': Type.Unknown(),
}

export type SubscriptionsProxyDeps = {
  subscriptionsServiceUrl: string
  tenantAuthPreHandler: preHandlerHookHandler
  requireAuth: preHandlerHookHandler
  requireOwner: preHandlerHookHandler
}

async function forward(
  request: FastifyRequest,
  reply: FastifyReply,
  deps: SubscriptionsProxyDeps,
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

  const response = await fetch(`${deps.subscriptionsServiceUrl}${path}`, init)
  const body = await response.json()
  reply.status(response.status).send(body)
}

export async function registerSubscriptionsProxyRoutes(
  app: FastifyInstance,
  deps: SubscriptionsProxyDeps,
): Promise<void> {
  app.get(
    '/v1/subscriptions/plans',
    {
      preHandler: [deps.tenantAuthPreHandler],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/plans')
    },
  )

  app.post(
    '/v1/subscriptions/checkout',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireAuth],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/subscriptions/checkout')
    },
  )

  app.get(
    '/v1/subscriptions/me',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireAuth],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/subscriptions/me')
    },
  )

  app.get(
    '/v1/subscriptions/me/xp',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireAuth],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/subscriptions/me')
    },
  )

  app.post(
    '/v1/subscriptions/webhook',
    { schema: { response: ProxyResponseSchema } },
    async (request, reply) => {
      const headers: Record<string, string> = {
        'content-type': 'application/json',
      }
      const token = request.headers['asaas-access-token']
      if (typeof token === 'string') headers['asaas-access-token'] = token

      const response = await fetch(`${deps.subscriptionsServiceUrl}/webhook`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request.body),
      })
      const body = await response.json()
      reply.status(response.status).send(body)
    },
  )

  app.get(
    '/v1/admin/members',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const query = new URLSearchParams(request.query as Record<string, string>).toString()
      await forward(request, reply, deps, `/admin/subscribers${query ? `?${query}` : ''}`)
    },
  )

  app.patch(
    '/v1/admin/members/:uid/role',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { uid } = request.params as { uid: string }
      await forward(request, reply, deps, `/admin/subscribers/${uid}/role`)
    },
  )

  app.get(
    '/v1/admin/levels',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/admin/levels')
    },
  )

  app.patch(
    '/v1/admin/levels/:id',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/admin/levels/${id}`)
    },
  )

  app.get(
    '/v1/admin/xp-config',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/admin/xp-config')
    },
  )

  app.patch(
    '/v1/admin/xp-config',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/admin/xp-config')
    },
  )

  app.get(
    '/v1/admin/subscriptions-summary',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/admin/summary')
    },
  )
}
