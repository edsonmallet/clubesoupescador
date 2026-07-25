import type { FastifyReply, FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import { createTenantAuthPreHandler } from './tenant-auth'

const { verifyIdToken } = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
}))

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ verifyIdToken }),
}))

vi.mock('@clube/firebase-utils', () => ({
  getFirebaseApp: () => ({}),
}))

function createMockReply() {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply
}

describe('createTenantAuthPreHandler', () => {
  it('replies 404 when tenant is not found', async () => {
    const preHandler = createTenantAuthPreHandler(async () => null)
    const request = {
      headers: { host: 'unknown.clube.com.br' },
    } as unknown as FastifyRequest
    const reply = createMockReply()

    await preHandler(request, reply)

    expect(reply.status).toHaveBeenCalledWith(404)
  })

  it('attaches tenant to the request when found', async () => {
    const tenant = { id: '1', slug: 'soupescador' }
    const preHandler = createTenantAuthPreHandler(async () => tenant)
    const request = {
      headers: { host: 'soupescador.clube.com.br' },
    } as unknown as FastifyRequest
    const reply = createMockReply()

    await preHandler(request, reply)

    expect(request.tenant).toEqual(tenant)
    expect(reply.status).not.toHaveBeenCalled()
  })

  it('maps a verified JWT into request.user', async () => {
    verifyIdToken.mockResolvedValueOnce({
      uid: 'user-1',
      role: 'store_owner',
      tenant_id: 'tenant-1',
    })
    const tenant = { id: '1', slug: 'soupescador' }
    const preHandler = createTenantAuthPreHandler(async () => tenant)
    const request = {
      headers: {
        host: 'soupescador.clube.com.br',
        authorization: 'Bearer fake-token',
      },
    } as unknown as FastifyRequest
    const reply = createMockReply()

    await preHandler(request, reply)

    expect(verifyIdToken).toHaveBeenCalledWith('fake-token')
    expect(request.user).toEqual({
      uid: 'user-1',
      role: 'store_owner',
      tenant_id: 'tenant-1',
    })
  })

  it('prefers the x-tenant-slug header over the host domain', async () => {
    const resolveTenant = vi.fn().mockResolvedValue({ id: '1', slug: 'dev' })
    const preHandler = createTenantAuthPreHandler(resolveTenant)
    const request = {
      headers: { host: 'localhost:3004', 'x-tenant-slug': 'dev' },
    } as unknown as FastifyRequest
    const reply = createMockReply()

    await preHandler(request, reply)

    expect(resolveTenant).toHaveBeenCalledWith('dev')
    expect(request.tenant).toEqual({ id: '1', slug: 'dev' })
  })

  it('ignores x-tenant-slug header when NODE_ENV is production', async () => {
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    try {
      const resolveTenant = vi
        .fn()
        .mockResolvedValue({ id: '1', slug: 'soupescador' })
      const preHandler = createTenantAuthPreHandler(resolveTenant)
      const request = {
        headers: { host: 'soupescador.clube.com.br', 'x-tenant-slug': 'dev' },
      } as unknown as FastifyRequest
      const reply = createMockReply()

      await preHandler(request, reply)

      expect(resolveTenant).toHaveBeenCalledWith('soupescador.clube.com.br')
    } finally {
      process.env.NODE_ENV = originalNodeEnv
    }
  })

  it('replies 401 with TOKEN_EXPIRED when the token is expired', async () => {
    verifyIdToken.mockRejectedValueOnce(
      Object.assign(new Error('Firebase ID token has expired'), {
        code: 'auth/id-token-expired',
      }),
    )
    const tenant = { id: '1', slug: 'soupescador' }
    const preHandler = createTenantAuthPreHandler(async () => tenant)
    const request = {
      headers: {
        host: 'soupescador.clube.com.br',
        authorization: 'Bearer expired-token',
      },
    } as unknown as FastifyRequest
    const reply = createMockReply()

    await preHandler(request, reply)

    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({
      error: { code: 'TOKEN_EXPIRED', message: 'Token expired' },
    })
    expect(request.user).toBeUndefined()
  })

  it('replies 401 with INVALID_TOKEN for any other verification failure', async () => {
    verifyIdToken.mockRejectedValueOnce(
      Object.assign(new Error('Decoding Firebase ID token failed'), {
        code: 'auth/argument-error',
      }),
    )
    const tenant = { id: '1', slug: 'soupescador' }
    const preHandler = createTenantAuthPreHandler(async () => tenant)
    const request = {
      headers: {
        host: 'soupescador.clube.com.br',
        authorization: 'Bearer malformed-token',
      },
    } as unknown as FastifyRequest
    const reply = createMockReply()

    await preHandler(request, reply)

    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({
      error: { code: 'INVALID_TOKEN', message: 'Invalid token' },
    })
    expect(request.user).toBeUndefined()
  })
})
