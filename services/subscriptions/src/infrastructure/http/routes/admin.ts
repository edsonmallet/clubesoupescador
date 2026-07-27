import { setRole } from '@clube/firebase-utils'
import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { ILevelRepository } from '../../../domain/interfaces/ILevelRepository'
import type { ISubscriptionRepository } from '../../../domain/interfaces/ISubscriptionRepository'
import type { IXpConfigRepository } from '../../../domain/interfaces/IXpConfigRepository'
import type { DashboardRepository } from '../../db/repositories/dashboard.repository'
import {
  ErrorResponseSchema,
  ListLevelsResponseSchema,
  ListSubscribersResponseSchema,
  ListXpConfigResponseSchema,
  LevelSchema,
  PromoteBodySchema,
  PromoteResponseSchema,
  SummaryResponseSchema,
  UpdateLevelBodySchema,
  UpdateXpConfigBodySchema,
  XpConfigItemSchema,
} from '../schemas/admin'

export type AdminRouteDeps = {
  subscriptionsAuthPreHandler: preHandlerHookHandler
  requireOwner: preHandlerHookHandler
  subscriptionRepository: ISubscriptionRepository
  levelRepository: ILevelRepository
  xpConfigRepository: IXpConfigRepository
  dashboardRepository: DashboardRepository
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
    '/admin/subscribers',
    {
      preHandler: [deps.subscriptionsAuthPreHandler, deps.requireOwner],
      schema: {
        querystring: {
          type: 'object',
          properties: { page: { type: 'number', default: 1 } },
        },
        response: { 200: ListSubscribersResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenantId(request.headers)
      if (!tenantId) {
        reply.status(400).send({
          error: { code: 'MISSING_TENANT', message: 'x-tenant-id header is required' },
        })
        return
      }

      const { page = 1 } = request.query as { page?: number }
      const result = await deps.subscriptionRepository.findMany(tenantId, page, 20)

      reply.status(200).send({
        items: result.items.map((s) => ({
          id: s.id,
          uid: s.uid,
          planId: s.planId,
          status: s.status,
          totalXp: s.totalXp,
          levelId: s.levelId,
          createdAt: s.createdAt.toISOString(),
        })),
        total: result.total,
      })
    },
  )

  app.patch(
    '/admin/subscribers/:uid/role',
    {
      preHandler: [deps.subscriptionsAuthPreHandler, deps.requireOwner],
      schema: {
        body: PromoteBodySchema,
        response: { 200: PromoteResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenantId(request.headers)
      if (!tenantId) {
        reply.status(400).send({
          error: { code: 'MISSING_TENANT', message: 'x-tenant-id header is required' },
        })
        return
      }

      const { uid } = request.params as { uid: string }
      const { role } = request.body as { role: 'community_mod' }

      await setRole(uid, role, tenantId)

      reply.status(200).send({ promoted: true })
    },
  )

  app.get(
    '/admin/levels',
    {
      preHandler: [deps.subscriptionsAuthPreHandler, deps.requireOwner],
      schema: { response: { 200: ListLevelsResponseSchema } },
    },
    async (_request, reply) => {
      const levels = await deps.levelRepository.findAll()
      reply.status(200).send(
        levels.map((level) => ({
          id: level.id,
          name: level.name,
          minXp: level.minXp,
          storeDiscountPct: level.storeDiscountPct,
          cashbackPct: level.cashbackPct,
        })),
      )
    },
  )

  app.patch(
    '/admin/levels/:id',
    {
      preHandler: [deps.subscriptionsAuthPreHandler, deps.requireOwner],
      schema: {
        body: UpdateLevelBodySchema,
        response: { 200: LevelSchema, 400: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as Partial<{
        name: string
        minXp: number
        storeDiscountPct: number
        cashbackPct: number
      }>

      const level = await deps.levelRepository.update(id, body)

      reply.status(200).send({
        id: level.id,
        name: level.name,
        minXp: level.minXp,
        storeDiscountPct: level.storeDiscountPct,
        cashbackPct: level.cashbackPct,
      })
    },
  )

  app.get(
    '/admin/xp-config',
    {
      preHandler: [deps.subscriptionsAuthPreHandler, deps.requireOwner],
      schema: { response: { 200: ListXpConfigResponseSchema, 400: ErrorResponseSchema } },
    },
    async (request, reply) => {
      const tenantId = requireTenantId(request.headers)
      if (!tenantId) {
        reply.status(400).send({
          error: { code: 'MISSING_TENANT', message: 'x-tenant-id header is required' },
        })
        return
      }

      const configs = await deps.xpConfigRepository.findAll(tenantId)
      reply.status(200).send(
        configs.map((c) => ({ source: c.source, points: c.points, dailyCap: c.dailyCap })),
      )
    },
  )

  app.patch(
    '/admin/xp-config',
    {
      preHandler: [deps.subscriptionsAuthPreHandler, deps.requireOwner],
      schema: {
        body: UpdateXpConfigBodySchema,
        response: { 200: XpConfigItemSchema, 400: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenantId(request.headers)
      if (!tenantId) {
        reply.status(400).send({
          error: { code: 'MISSING_TENANT', message: 'x-tenant-id header is required' },
        })
        return
      }

      const body = request.body as { source: string; points: number; dailyCap: number | null }
      const updated = await deps.xpConfigRepository.upsert({ tenantId, ...body })

      reply
        .status(200)
        .send({ source: updated.source, points: updated.points, dailyCap: updated.dailyCap })
    },
  )

  app.get(
    '/admin/summary',
    {
      preHandler: [deps.subscriptionsAuthPreHandler, deps.requireOwner],
      schema: { response: { 200: SummaryResponseSchema, 400: ErrorResponseSchema } },
    },
    async (request, reply) => {
      const tenantId = requireTenantId(request.headers)
      if (!tenantId) {
        reply.status(400).send({
          error: { code: 'MISSING_TENANT', message: 'x-tenant-id header is required' },
        })
        return
      }

      const summary = await deps.dashboardRepository.getSummary(tenantId)
      reply.status(200).send(summary)
    },
  )
}
