import type { FastifyReply, FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import {
  requireAuth,
  requireOwner,
  requireSubscriber,
  requireSuperAdmin,
} from './guards'

function createMockReply() {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply
}

function createRequestWithRole(role: string | undefined) {
  return {
    user: role ? { uid: '1', role, tenant_id: null } : undefined,
  } as unknown as FastifyRequest
}

describe('guards', () => {
  it('requireSubscriber allows a subscriber role', async () => {
    const reply = createMockReply()
    await requireSubscriber(createRequestWithRole('subscriber'), reply)
    expect(reply.status).not.toHaveBeenCalled()
  })

  it('requireSubscriber rejects a plain user role', async () => {
    const reply = createMockReply()
    await requireSubscriber(createRequestWithRole('user'), reply)
    expect(reply.status).toHaveBeenCalledWith(403)
  })

  it('requireSuperAdmin rejects a missing role with 401', async () => {
    const reply = createMockReply()
    await requireSuperAdmin(createRequestWithRole(undefined), reply)
    expect(reply.status).toHaveBeenCalledWith(401)
  })

  it('requireAuth allows any known role', async () => {
    const reply = createMockReply()
    await requireAuth(createRequestWithRole('user'), reply)
    expect(reply.status).not.toHaveBeenCalled()
  })

  it('requireSubscriber replies 401 when there is no authenticated user at all', async () => {
    const reply = createMockReply()
    await requireSubscriber(createRequestWithRole(undefined), reply)
    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({
      error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
    })
  })

  it('requireSubscriber replies 403 (not 401) when a valid user has the wrong role', async () => {
    const reply = createMockReply()
    await requireSubscriber(createRequestWithRole('user'), reply)
    expect(reply.status).toHaveBeenCalledWith(403)
    expect(reply.send).toHaveBeenCalledWith({
      error: { code: 'FORBIDDEN', message: 'Access denied' },
    })
  })

  it('requireOwner rejects when the JWT tenant_id does not match the resolved tenant', async () => {
    const reply = createMockReply()
    const request = {
      user: { uid: '1', role: 'store_owner', tenant_id: 'tenant-a' },
      tenant: { id: 'tenant-b', slug: 'other' },
    } as unknown as FastifyRequest
    await requireOwner(request, reply)
    expect(reply.status).toHaveBeenCalledWith(403)
  })

  it('requireOwner allows when the JWT tenant_id matches the resolved tenant', async () => {
    const reply = createMockReply()
    const request = {
      user: { uid: '1', role: 'store_owner', tenant_id: 'tenant-a' },
      tenant: { id: 'tenant-a', slug: 'mine' },
    } as unknown as FastifyRequest
    await requireOwner(request, reply)
    expect(reply.status).not.toHaveBeenCalled()
  })

  it('requireSuperAdmin is exempt from the tenant-binding check (tenant_id is null)', async () => {
    const reply = createMockReply()
    const request = {
      user: { uid: '1', role: 'super_admin', tenant_id: null },
      tenant: { id: 'tenant-a', slug: 'mine' },
    } as unknown as FastifyRequest
    await requireSuperAdmin(request, reply)
    expect(reply.status).not.toHaveBeenCalled()
  })
})
