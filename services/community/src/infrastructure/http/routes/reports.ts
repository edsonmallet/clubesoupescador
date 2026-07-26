import type { AuthenticatedUser } from '@clube/fastify-plugins'
import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { CreateReportUseCase } from '../../../application/reports/create-report.usecase'
import type {
  IReportRepository,
  ReportStatus,
  ReportTargetType,
} from '../../../domain/interfaces/IReportRepository'
import {
  CreateReportBodySchema,
  ErrorResponseSchema,
  ListReportsResponseSchema,
  ReportSchema,
  UpdateReportBodySchema,
} from '../schemas/reports'

export type ReportsRouteDeps = {
  communityAuthPreHandler: preHandlerHookHandler
  requireSubscriber: preHandlerHookHandler
  requireOwner: preHandlerHookHandler
  createReportUseCase: CreateReportUseCase
  reportRepository: IReportRepository
}

function requireTenantId(headers: Record<string, unknown>): string | null {
  const tenantId = headers['x-tenant-id']
  return typeof tenantId === 'string' ? tenantId : null
}

export async function registerReportsRoutes(
  app: FastifyInstance,
  deps: ReportsRouteDeps,
): Promise<void> {
  app.post(
    '/reports',
    {
      preHandler: [deps.communityAuthPreHandler, deps.requireSubscriber],
      schema: {
        body: CreateReportBodySchema,
        response: { 201: ReportSchema, 400: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenantId(request.headers)
      if (!tenantId) {
        reply.status(400).send({
          error: {
            code: 'MISSING_TENANT',
            message: 'x-tenant-id header is required',
          },
        })
        return
      }

      const user = request.user as AuthenticatedUser
      const body = request.body as {
        targetType: ReportTargetType
        targetId: string
        reason: string
      }

      const report = await deps.createReportUseCase.execute({
        tenantId,
        targetType: body.targetType,
        targetId: body.targetId,
        reporterUid: user.uid,
        reason: body.reason,
      })

      reply.status(201).send({
        id: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        reporterUid: report.reporterUid,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt.toISOString(),
      })
    },
  )

  app.get(
    '/reports',
    {
      preHandler: [deps.communityAuthPreHandler, deps.requireOwner],
      schema: {
        querystring: {
          type: 'object',
          properties: { page: { type: 'number', default: 1 } },
        },
        response: { 200: ListReportsResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenantId(request.headers)
      if (!tenantId) {
        reply.status(400).send({
          error: {
            code: 'MISSING_TENANT',
            message: 'x-tenant-id header is required',
          },
        })
        return
      }

      const { page = 1 } = request.query as { page?: number }
      const result = await deps.reportRepository.findMany(tenantId, page, 20)

      reply.status(200).send({
        items: result.items.map((report) => ({
          id: report.id,
          targetType: report.targetType,
          targetId: report.targetId,
          reporterUid: report.reporterUid,
          reason: report.reason,
          status: report.status,
          createdAt: report.createdAt.toISOString(),
        })),
        total: result.total,
      })
    },
  )

  app.patch(
    '/reports/:id',
    {
      preHandler: [deps.communityAuthPreHandler, deps.requireOwner],
      schema: {
        body: UpdateReportBodySchema,
        response: { 200: ReportSchema, 400: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { status } = request.body as { status: ReportStatus }

      const report = await deps.reportRepository.updateStatus(id, status)

      reply.status(200).send({
        id: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        reporterUid: report.reporterUid,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt.toISOString(),
      })
    },
  )
}
