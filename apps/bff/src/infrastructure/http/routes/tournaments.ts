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
 * owned and validated by services/tournaments. The proxy deliberately does
 * not re-validate them, so the schema stays permissive.
 */
const ProxyResponseSchema = {
  '2xx': Type.Unknown(),
  '4xx': Type.Unknown(),
  '5xx': Type.Unknown(),
}

export type TournamentsProxyDeps = {
  tournamentsServiceUrl: string
  tenantAuthPreHandler: preHandlerHookHandler
  requireSubscriber: preHandlerHookHandler
  requireOwner: preHandlerHookHandler
}

async function forward(
  request: FastifyRequest,
  reply: FastifyReply,
  deps: TournamentsProxyDeps,
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

  const response = await fetch(`${deps.tournamentsServiceUrl}${path}`, init)
  const body = await response.json()
  reply.status(response.status).send(body)
}

export async function registerTournamentsProxyRoutes(
  app: FastifyInstance,
  deps: TournamentsProxyDeps,
): Promise<void> {
  app.get(
    '/v1/tournaments',
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
        `/tournaments${query ? `?${query}` : ''}`,
      )
    },
  )

  app.get(
    '/v1/tournaments/:id',
    {
      preHandler: [deps.tenantAuthPreHandler],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/tournaments/${id}`)
    },
  )

  app.post(
    '/v1/tournaments/:id/submissions',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireSubscriber],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/tournaments/${id}/submissions`)
    },
  )

  app.get(
    '/v1/admin/tournaments/:id/submissions',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/tournaments/${id}/submissions`)
    },
  )

  app.patch(
    '/v1/admin/submissions/:id/score',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/submissions/${id}/score`)
    },
  )

  app.post(
    '/v1/admin/tournaments',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/tournaments')
    },
  )
}
