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
 * owned and validated by services/community. The proxy deliberately does
 * not re-validate them, so the schema stays permissive.
 */
const ProxyResponseSchema = {
  '2xx': Type.Unknown(),
  '4xx': Type.Unknown(),
  '5xx': Type.Unknown(),
}

export type CommunityProxyDeps = {
  communityServiceUrl: string
  tenantAuthPreHandler: preHandlerHookHandler
  requireAuth: preHandlerHookHandler
  requireSubscriber: preHandlerHookHandler
  requireOwner: preHandlerHookHandler
}

async function forward(
  request: FastifyRequest,
  reply: FastifyReply,
  deps: CommunityProxyDeps,
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

  const response = await fetch(`${deps.communityServiceUrl}${path}`, init)
  const body = await response.json()
  reply.status(response.status).send(body)
}

export async function registerCommunityProxyRoutes(
  app: FastifyInstance,
  deps: CommunityProxyDeps,
): Promise<void> {
  app.get(
    '/v1/community/categories',
    {
      preHandler: [deps.tenantAuthPreHandler],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/categories')
    },
  )

  app.post(
    '/v1/admin/community/categories',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/categories')
    },
  )

  app.get(
    '/v1/community/topics',
    {
      preHandler: [deps.tenantAuthPreHandler],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const query = new URLSearchParams(
        request.query as Record<string, string>,
      ).toString()
      await forward(request, reply, deps, `/topics${query ? `?${query}` : ''}`)
    },
  )

  app.get(
    '/v1/community/topics/:id',
    {
      preHandler: [deps.tenantAuthPreHandler],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/topics/${id}`)
    },
  )

  app.post(
    '/v1/community/topics',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireSubscriber],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/topics')
    },
  )

  app.patch(
    '/v1/admin/community/topics/:id',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/topics/${id}`)
    },
  )

  app.post(
    '/v1/community/topics/:topicId/comments',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireSubscriber],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { topicId } = request.params as { topicId: string }
      await forward(request, reply, deps, `/comments/${topicId}`)
    },
  )

  app.delete(
    '/v1/admin/community/comments/:id',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/comments/${id}`)
    },
  )

  app.post(
    '/v1/community/topics/:id/vote',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireSubscriber],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/topics/${id}/vote`)
    },
  )

  app.post(
    '/v1/community/comments/:id/vote',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireSubscriber],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/comments/${id}/vote`)
    },
  )

  app.post(
    '/v1/community/topics/:id/react',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireSubscriber],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/topics/${id}/react`)
    },
  )

  app.post(
    '/v1/community/comments/:id/react',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireSubscriber],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/comments/${id}/react`)
    },
  )

  app.post(
    '/v1/community/reports',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireSubscriber],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      await forward(request, reply, deps, '/reports')
    },
  )

  app.get(
    '/v1/admin/community/reports',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const query = new URLSearchParams(
        request.query as Record<string, string>,
      ).toString()
      await forward(request, reply, deps, `/reports${query ? `?${query}` : ''}`)
    },
  )

  app.patch(
    '/v1/admin/community/reports/:id',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireOwner],
      schema: { response: ProxyResponseSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await forward(request, reply, deps, `/reports/${id}`)
    },
  )
}
