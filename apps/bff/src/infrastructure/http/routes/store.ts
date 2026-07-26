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
 * owned and validated by services/store. The proxy deliberately does not
 * re-validate them, so the schema stays permissive.
 */
const ProxyResponseSchema = {
  '2xx': Type.Unknown(),
  '4xx': Type.Unknown(),
  '5xx': Type.Unknown(),
}

export type StoreProxyDeps = {
  storeServiceUrl: string
  tenantAuthPreHandler: preHandlerHookHandler
  requireAuth: preHandlerHookHandler
  requireSubscriber: preHandlerHookHandler
  requireOwner: preHandlerHookHandler
}

async function forward(
  request: FastifyRequest,
  reply: FastifyReply,
  deps: StoreProxyDeps,
  path: string,
  body?: unknown,
): Promise<void> {
  const tenant = request.tenant as Tenant
  const headers: Record<string, string> = { 'x-tenant-id': tenant.id }

  const authorization = request.headers.authorization
  if (authorization) headers.authorization = authorization

  const init: RequestInit = { method: request.method, headers }
  const payload = body !== undefined ? body : request.body
  if (request.method !== 'GET' && payload !== undefined) {
    headers['content-type'] = 'application/json'
    init.body = JSON.stringify(payload)
  }

  const response = await fetch(`${deps.storeServiceUrl}${path}`, init)
  const responseBody = await response.json()
  reply.status(response.status).send(responseBody)
}

export async function registerStoreProxyRoutes(
  app: FastifyInstance,
  deps: StoreProxyDeps,
): Promise<void> {
  app.get(
    '/v1/offers',
    {
      preHandler: [deps.tenantAuthPreHandler],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const query = new URLSearchParams(
        request.query as Record<string, string>,
      ).toString()
      await forward(
        request,
        reply,
        deps,
        `/products${query ? `?${query}` : ''}`,
      )
    },
  )

  app.get(
    '/v1/offers/:id',
    {
      preHandler: [deps.tenantAuthPreHandler],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/products/${id}`)
    },
  )

  app.post(
    '/v1/offers/:id/buy',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireSubscriber],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as {
        qty: number
        cashbackUseCents: number
        address: unknown
      }

      await forward(request, reply, deps, '/orders', {
        items: [{ productId: id, qty: body.qty }],
        cashbackUseCents: body.cashbackUseCents,
        address: body.address,
      })
    },
  )

  app.get(
    '/v1/orders',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireAuth],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const query = new URLSearchParams(
        request.query as Record<string, string>,
      ).toString()
      await forward(request, reply, deps, `/orders${query ? `?${query}` : ''}`)
    },
  )

  app.get(
    '/v1/orders/:id',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireAuth],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/orders/${id}`)
    },
  )

  app.get(
    '/v1/shipping/quote',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireAuth],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const query = new URLSearchParams(
        request.query as Record<string, string>,
      ).toString()
      await forward(
        request,
        reply,
        deps,
        `/shipping/quote${query ? `?${query}` : ''}`,
      )
    },
  )

  app.post(
    '/v1/store/webhook',
    { schema: { response: ProxyResponseSchema } },
    async (request, reply) => {
      const headers: Record<string, string> = {
        'content-type': 'application/json',
      }
      const token = request.headers['asaas-access-token']
      if (typeof token === 'string') headers['asaas-access-token'] = token

      const response = await fetch(`${deps.storeServiceUrl}/webhook`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request.body),
      })
      const body = await response.json()
      reply.status(response.status).send(body)
    },
  )

  app.get(
    '/v1/admin/orders',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const query = new URLSearchParams(
        request.query as Record<string, string>,
      ).toString()
      await forward(
        request,
        reply,
        deps,
        `/admin/orders${query ? `?${query}` : ''}`,
      )
    },
  )

  app.patch(
    '/v1/admin/orders/:id',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/admin/orders/${id}`)
    },
  )

  app.get(
    '/v1/admin/offers',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const query = new URLSearchParams(
        request.query as Record<string, string>,
      ).toString()
      await forward(
        request,
        reply,
        deps,
        `/admin/products${query ? `?${query}` : ''}`,
      )
    },
  )

  app.post(
    '/v1/admin/offers',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/products')
    },
  )

  app.patch(
    '/v1/admin/offers/:id',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/products/${id}`)
    },
  )
}
