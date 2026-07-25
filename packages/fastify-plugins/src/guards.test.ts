import type { FastifyReply, FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import { requireAuth, requireSubscriber, requireSuperAdmin } from './guards'

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
})
