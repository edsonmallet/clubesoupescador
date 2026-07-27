import { registerErrorHandler } from '@clube/fastify-plugins'
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import type { CreatePlanUseCase } from '../../../application/plans/create-plan.usecase'
import type { ListPlansUseCase } from '../../../application/plans/list-plans.usecase'
import type { UpdatePlanUseCase } from '../../../application/plans/update-plan.usecase'
import { SaasPlan } from '../../../domain/entities/saas-plan'
import { PlanNotFoundError } from '../../../domain/errors'
import { type PlansRouteDeps, registerPlansRoutes } from './plans'

function fakePlan(
  overrides: Partial<Parameters<typeof SaasPlan.create>[0]> = {},
) {
  return SaasPlan.create({
    id: 'plan-1',
    name: 'Basic',
    priceCents: 4900,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  })
}

async function buildTestApp(overrides: Partial<PlansRouteDeps> = {}) {
  const app = Fastify()
  await registerErrorHandler(app)

  const deps: PlansRouteDeps = {
    billingAuthPreHandler: async (request: FastifyRequest) => {
      request.user = { uid: 'super-1', role: 'super_admin', tenant_id: null }
    },
    requireSuperAdmin: async () => {},
    listPlansUseCase: {
      execute: vi.fn().mockResolvedValue([fakePlan()]),
    } as unknown as ListPlansUseCase,
    createPlanUseCase: {
      execute: vi.fn().mockResolvedValue(fakePlan()),
    } as unknown as CreatePlanUseCase,
    updatePlanUseCase: {
      execute: vi.fn().mockResolvedValue(fakePlan({ priceCents: 5900 })),
    } as unknown as UpdatePlanUseCase,
    ...overrides,
  }

  await registerPlansRoutes(app, deps)
  return { app, deps }
}

describe('plans routes', () => {
  it('GET /plans returns the active plans with no guard', async () => {
    const { app } = await buildTestApp()

    const response = await app.inject({ method: 'GET', url: '/plans' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([
      {
        id: 'plan-1',
        name: 'Basic',
        priceCents: 4900,
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ])
  })

  it('GET /plans/all returns all plans (active and inactive) for super_admin', async () => {
    const { app, deps } = await buildTestApp({
      listPlansUseCase: {
        execute: vi
          .fn()
          .mockResolvedValue([fakePlan(), fakePlan({ id: 'plan-2', active: false })]),
      } as unknown as ListPlansUseCase,
    })

    const response = await app.inject({ method: 'GET', url: '/plans/all' })

    expect(response.statusCode).toBe(200)
    expect(deps.listPlansUseCase.execute).toHaveBeenCalledWith({
      includeInactive: true,
    })
    expect(response.json()).toHaveLength(2)
  })

  it('GET /plans/all rejects non-super_admin callers with 403', async () => {
    const { app, deps } = await buildTestApp({
      requireSuperAdmin: async (
        _request: FastifyRequest,
        reply: FastifyReply,
      ) => {
        reply
          .status(403)
          .send({ error: { code: 'FORBIDDEN', message: 'Access denied' } })
      },
    })

    const response = await app.inject({ method: 'GET', url: '/plans/all' })

    expect(response.statusCode).toBe(403)
    expect(deps.listPlansUseCase.execute).not.toHaveBeenCalled()
  })

  it('GET /plans/all rejects unauthenticated callers with 401', async () => {
    const { app, deps } = await buildTestApp({
      billingAuthPreHandler: async () => {},
      requireSuperAdmin: async (
        _request: FastifyRequest,
        reply: FastifyReply,
      ) => {
        reply.status(401).send({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          },
        })
      },
    })

    const response = await app.inject({ method: 'GET', url: '/plans/all' })

    expect(response.statusCode).toBe(401)
    expect(deps.listPlansUseCase.execute).not.toHaveBeenCalled()
  })

  it('POST /plans creates a plan defaulting active to true when omitted', async () => {
    const { app, deps } = await buildTestApp()

    const response = await app.inject({
      method: 'POST',
      url: '/plans',
      payload: { name: 'Basic', priceCents: 4900 },
    })

    expect(response.statusCode).toBe(201)
    expect(deps.createPlanUseCase.execute).toHaveBeenCalledWith({
      name: 'Basic',
      priceCents: 4900,
      active: true,
    })
  })

  it('POST /plans rejects non-super_admin callers with 403', async () => {
    const { app, deps } = await buildTestApp({
      requireSuperAdmin: async (
        _request: FastifyRequest,
        reply: FastifyReply,
      ) => {
        reply
          .status(403)
          .send({ error: { code: 'FORBIDDEN', message: 'Access denied' } })
      },
    })

    const response = await app.inject({
      method: 'POST',
      url: '/plans',
      payload: { name: 'Basic', priceCents: 4900 },
    })

    expect(response.statusCode).toBe(403)
    expect(deps.createPlanUseCase.execute).not.toHaveBeenCalled()
  })

  it('POST /plans rejects unauthenticated callers with 401', async () => {
    const { app, deps } = await buildTestApp({
      billingAuthPreHandler: async () => {},
      requireSuperAdmin: async (
        _request: FastifyRequest,
        reply: FastifyReply,
      ) => {
        reply.status(401).send({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          },
        })
      },
    })

    const response = await app.inject({
      method: 'POST',
      url: '/plans',
      payload: { name: 'Basic', priceCents: 4900 },
    })

    expect(response.statusCode).toBe(401)
    expect(deps.createPlanUseCase.execute).not.toHaveBeenCalled()
  })

  it('PATCH /plans/:id updates a plan', async () => {
    const { app, deps } = await buildTestApp()

    const response = await app.inject({
      method: 'PATCH',
      url: '/plans/plan-1',
      payload: { priceCents: 5900 },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().priceCents).toBe(5900)
    expect(deps.updatePlanUseCase.execute).toHaveBeenCalledWith({
      id: 'plan-1',
      priceCents: 5900,
    })
  })

  it('PATCH /plans/:id returns 404 when the plan does not exist', async () => {
    const { app } = await buildTestApp({
      updatePlanUseCase: {
        execute: vi.fn().mockRejectedValue(new PlanNotFoundError('missing')),
      } as unknown as UpdatePlanUseCase,
    })

    const response = await app.inject({
      method: 'PATCH',
      url: '/plans/missing',
      payload: { priceCents: 5900 },
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().error.code).toBe('PLAN_NOT_FOUND')
  })

  it('PATCH /plans/:id rejects non-super_admin callers with 403', async () => {
    const { app, deps } = await buildTestApp({
      requireSuperAdmin: async (
        _request: FastifyRequest,
        reply: FastifyReply,
      ) => {
        reply
          .status(403)
          .send({ error: { code: 'FORBIDDEN', message: 'Access denied' } })
      },
    })

    const response = await app.inject({
      method: 'PATCH',
      url: '/plans/plan-1',
      payload: { priceCents: 5900 },
    })

    expect(response.statusCode).toBe(403)
    expect(deps.updatePlanUseCase.execute).not.toHaveBeenCalled()
  })
})
