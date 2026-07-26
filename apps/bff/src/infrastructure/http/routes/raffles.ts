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
 * owned and validated by services/raffles. The proxy deliberately does not
 * re-validate them, so the schema stays permissive.
 */
const ProxyResponseSchema = {
  '2xx': Type.Unknown(),
  '4xx': Type.Unknown(),
  '5xx': Type.Unknown(),
}

export type RafflesProxyDeps = {
  rafflesServiceUrl: string
  tenantAuthPreHandler: preHandlerHookHandler
  requireSubscriber: preHandlerHookHandler
  requireOwner: preHandlerHookHandler
}

async function forward(
  request: FastifyRequest,
  reply: FastifyReply,
  deps: RafflesProxyDeps,
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

  const response = await fetch(`${deps.rafflesServiceUrl}${path}`, init)
  const body = await response.json()
  reply.status(response.status).send(body)
}

export async function registerRafflesProxyRoutes(
  app: FastifyInstance,
  deps: RafflesProxyDeps,
): Promise<void> {
  app.get(
    '/v1/raffles',
    {
      preHandler: [deps.tenantAuthPreHandler],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const query = new URLSearchParams(
        request.query as Record<string, string>,
      ).toString()
      await forward(request, reply, deps, `/raffles${query ? `?${query}` : ''}`)
    },
  )

  app.get(
    '/v1/raffles/:id',
    {
      preHandler: [deps.tenantAuthPreHandler],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/raffles/${id}`)
    },
  )

  app.get(
    '/v1/raffles/:id/result',
    {
      preHandler: [deps.tenantAuthPreHandler],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/raffles/${id}/result`)
    },
  )

  app.post(
    '/v1/raffles/:id/join',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireSubscriber],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/raffles/${id}/join`)
    },
  )

  app.post(
    '/v1/raffles/:id/buy',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireSubscriber],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/raffles/${id}/buy`)
    },
  )

  app.get(
    '/v1/raffles/:id/my-tickets',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireSubscriber],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/raffles/${id}/my-tickets`)
    },
  )

  app.post(
    '/v1/raffles/webhook',
    { schema: { response: ProxyResponseSchema } },
    async (request, reply) => {
      const headers: Record<string, string> = {
        'content-type': 'application/json',
      }
      const token = request.headers['asaas-access-token']
      if (typeof token === 'string') headers['asaas-access-token'] = token

      const response = await fetch(`${deps.rafflesServiceUrl}/webhook`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request.body),
      })
      const body = await response.json()
      reply.status(response.status).send(body)
    },
  )

  app.post(
    '/v1/admin/raffles',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/raffles')
    },
  )

  app.patch(
    '/v1/admin/raffles/:id',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/raffles/${id}`)
    },
  )

  app.post(
    '/v1/admin/raffles/:id/draw',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/raffles/${id}/draw`)
    },
  )
}
