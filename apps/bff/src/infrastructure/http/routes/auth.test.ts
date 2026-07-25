import Fastify, { type FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import type { GetMeUseCase } from '../../../application/tenants/get-me.usecase'
import type { RegisterUserUseCase } from '../../../application/tenants/register-user.usecase'
import { type AuthRouteDeps, registerAuthRoutes } from './auth'

function buildTestApp(overrides: Partial<AuthRouteDeps> = {}) {
  const app = Fastify()
  const deps: AuthRouteDeps = {
    tenantAuthPreHandler: async (request: FastifyRequest) => {
      request.tenant = { id: 'tenant-1', slug: 'dev' }
    },
    requireAuth: async (request: FastifyRequest) => {
      request.user = { uid: 'firebase-uid-1', role: 'user', tenant_id: 'tenant-1' }
    },
    registerUserUseCase: {
      execute: vi.fn().mockResolvedValue({
        id: 'user-1',
        tenantId: 'tenant-1',
        uid: 'firebase-uid-1',
        role: 'user',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    } as unknown as RegisterUserUseCase,
    getMeUseCase: {
      execute: vi.fn().mockResolvedValue({
        uid: 'firebase-uid-1',
        role: 'user',
        tenantId: 'tenant-1',
        registeredAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    } as unknown as GetMeUseCase,
    ...overrides,
  }
  return { app, deps }
}

describe('auth routes', () => {
  it('POST /v1/auth/register returns the created user', async () => {
    const { app, deps } = buildTestApp()
    await registerAuthRoutes(app, deps)

    const response = await app.inject({ method: 'POST', url: '/v1/auth/register' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      id: 'user-1',
      tenantId: 'tenant-1',
      uid: 'firebase-uid-1',
      role: 'user',
      createdAt: '2026-01-01T00:00:00.000Z',
    })
    expect(deps.registerUserUseCase.execute).toHaveBeenCalledWith({
      uid: 'firebase-uid-1',
      tenantId: 'tenant-1',
    })
  })

  it('GET /v1/auth/me returns uid, role, tenantId and registeredAt', async () => {
    const { app, deps } = buildTestApp()
    await registerAuthRoutes(app, deps)

    const response = await app.inject({ method: 'GET', url: '/v1/auth/me' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      uid: 'firebase-uid-1',
      role: 'user',
      tenantId: 'tenant-1',
      registeredAt: '2026-01-01T00:00:00.000Z',
    })
    expect(deps.getMeUseCase.execute).toHaveBeenCalledWith({
      uid: 'firebase-uid-1',
      tenantId: 'tenant-1',
      role: 'user',
    })
  })

  it('does not call the usecase when requireAuth rejects the request', async () => {
    const { app, deps } = buildTestApp({
      requireAuth: async (_request, reply) => {
        reply.status(401).send({
          error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
        })
      },
    })
    await registerAuthRoutes(app, deps)

    const response = await app.inject({ method: 'GET', url: '/v1/auth/me' })

    expect(response.statusCode).toBe(401)
    expect(deps.getMeUseCase.execute).not.toHaveBeenCalled()
  })
})
