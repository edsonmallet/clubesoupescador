import { registerErrorHandler } from '@clube/fastify-plugins'
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import type { CreateCheckoutUseCase } from '../../../application/billing/create-checkout.usecase'
import type { GetBillingOverviewUseCase } from '../../../application/billing/get-billing-overview.usecase'
import { TenantBilling } from '../../../domain/entities/tenant-billing'
import type { ITenantBillingRepository } from '../../../domain/interfaces/ITenantBillingRepository'
import { type BillingRouteDeps, registerBillingRoutes } from './billing'

function fakeTenantBilling(
  overrides: Partial<Parameters<typeof TenantBilling.create>[0]> = {},
) {
  return TenantBilling.create({
    id: 'tb-1',
    tenantId: 'tenant-1',
    planId: 'plan-1',
    asaasCustomerId: 'cus_1',
    asaasSubscriptionId: 'asub_1',
    status: 'inactive',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  })
}

async function buildTestApp(overrides: Partial<BillingRouteDeps> = {}) {
  const app = Fastify()
  await registerErrorHandler(app)

  const deps: BillingRouteDeps = {
    billingAuthPreHandler: async (request: FastifyRequest) => {
      request.user = {
        uid: 'owner-1',
        role: 'store_owner',
        tenant_id: 'tenant-1',
      }
    },
    requireOwner: async () => {},
    requireSuperAdmin: async () => {},
    createCheckoutUseCase: {
      execute: vi
        .fn()
        .mockResolvedValue({ paymentUrl: 'https://pay.asaas.com/x' }),
    } as unknown as CreateCheckoutUseCase,
    tenantBillingRepository: {
      findByTenantId: vi.fn().mockResolvedValue(fakeTenantBilling()),
      findByAsaasSubscriptionId: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateAsaasDetails: vi.fn(),
      list: vi.fn(),
    } as unknown as ITenantBillingRepository,
    getBillingOverviewUseCase: {
      execute: vi.fn().mockResolvedValue({
        items: [
          {
            tenantId: 'tenant-1',
            planName: 'Basic',
            priceCents: 4900,
            status: 'active',
          },
        ],
        summary: { mrrCents: 4900, overdueCount: 0 },
      }),
    } as unknown as GetBillingOverviewUseCase,
    ...overrides,
  }

  await registerBillingRoutes(app, deps)
  return { app, deps }
}

describe('billing routes', () => {
  describe('POST /checkout', () => {
    it('uses the authenticated tenant_id, never the body, and returns id/status/paymentUrl', async () => {
      const { app, deps } = await buildTestApp()

      const response = await app.inject({
        method: 'POST',
        url: '/checkout',
        payload: {
          planId: 'plan-1',
          name: 'Loja da Maria',
          cpfCnpj: '12345678909',
          tenantId: 'attacker-tenant',
        },
      })

      expect(response.statusCode).toBe(200)
      expect(deps.createCheckoutUseCase.execute).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        planId: 'plan-1',
        name: 'Loja da Maria',
        cpfCnpj: '12345678909',
      })
      expect(response.json()).toEqual({
        id: 'tb-1',
        status: 'inactive',
        paymentUrl: 'https://pay.asaas.com/x',
      })
    })

    it('rejects non-owner callers with 403', async () => {
      const { app, deps } = await buildTestApp({
        requireOwner: async (_request: FastifyRequest, reply: FastifyReply) => {
          reply
            .status(403)
            .send({ error: { code: 'FORBIDDEN', message: 'Access denied' } })
        },
      })

      const response = await app.inject({
        method: 'POST',
        url: '/checkout',
        payload: {
          planId: 'plan-1',
          name: 'Loja da Maria',
          cpfCnpj: '12345678909',
        },
      })

      expect(response.statusCode).toBe(403)
      expect(deps.createCheckoutUseCase.execute).not.toHaveBeenCalled()
    })

    it('rejects unauthenticated callers with 401', async () => {
      const { app, deps } = await buildTestApp({
        billingAuthPreHandler: async () => {},
        requireOwner: async (_request: FastifyRequest, reply: FastifyReply) => {
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
        url: '/checkout',
        payload: {
          planId: 'plan-1',
          name: 'Loja da Maria',
          cpfCnpj: '12345678909',
        },
      })

      expect(response.statusCode).toBe(401)
      expect(deps.createCheckoutUseCase.execute).not.toHaveBeenCalled()
    })
  })

  describe('GET /me', () => {
    it('returns the tenant billing for the authenticated tenant', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({ method: 'GET', url: '/me' })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        id: 'tb-1',
        tenantId: 'tenant-1',
        planId: 'plan-1',
        asaasCustomerId: 'cus_1',
        asaasSubscriptionId: 'asub_1',
        status: 'inactive',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      })
    })

    it('returns 404 when the tenant never subscribed', async () => {
      const { app } = await buildTestApp({
        tenantBillingRepository: {
          findByTenantId: vi.fn().mockResolvedValue(null),
          findByAsaasSubscriptionId: vi.fn(),
          create: vi.fn(),
          updateStatus: vi.fn(),
          updateAsaasDetails: vi.fn(),
          list: vi.fn(),
        } as unknown as ITenantBillingRepository,
      })

      const response = await app.inject({ method: 'GET', url: '/me' })

      expect(response.statusCode).toBe(404)
      expect(response.json().error.code).toBe('TENANT_BILLING_NOT_FOUND')
    })

    it('rejects non-owner callers with 403', async () => {
      const { app } = await buildTestApp({
        requireOwner: async (_request: FastifyRequest, reply: FastifyReply) => {
          reply
            .status(403)
            .send({ error: { code: 'FORBIDDEN', message: 'Access denied' } })
        },
      })

      const response = await app.inject({ method: 'GET', url: '/me' })

      expect(response.statusCode).toBe(403)
    })
  })

  describe('GET /tenants', () => {
    it('returns the flattened billing overview for super_admin', async () => {
      const { app } = await buildTestApp()

      const response = await app.inject({ method: 'GET', url: '/tenants' })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        items: [
          {
            tenantId: 'tenant-1',
            planName: 'Basic',
            priceCents: 4900,
            status: 'active',
          },
        ],
        mrrCents: 4900,
        overdueCount: 0,
      })
    })

    it('rejects non-super_admin callers with 403', async () => {
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

      const response = await app.inject({ method: 'GET', url: '/tenants' })

      expect(response.statusCode).toBe(403)
      expect(deps.getBillingOverviewUseCase.execute).not.toHaveBeenCalled()
    })

    it('rejects store_owner callers (super-admin only) with 403', async () => {
      const { app } = await buildTestApp({
        billingAuthPreHandler: async (request: FastifyRequest) => {
          request.user = {
            uid: 'owner-1',
            role: 'store_owner',
            tenant_id: 'tenant-1',
          }
        },
        requireSuperAdmin: async (
          _request: FastifyRequest,
          reply: FastifyReply,
        ) => {
          reply
            .status(403)
            .send({ error: { code: 'FORBIDDEN', message: 'Access denied' } })
        },
      })

      const response = await app.inject({ method: 'GET', url: '/tenants' })

      expect(response.statusCode).toBe(403)
    })
  })
})
