import type { FastifyReply, FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import { createTenantAuthPreHandler } from './tenant-auth'

const { verifyIdToken } = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
}))

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ verifyIdToken }),
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
})
