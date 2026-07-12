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

  it('requireSuperAdmin rejects a missing role', async () => {
    const reply = createMockReply()
    await requireSuperAdmin(createRequestWithRole(undefined), reply)
    expect(reply.status).toHaveBeenCalledWith(403)
  })

  it('requireAuth allows any known role', async () => {
    const reply = createMockReply()
    await requireAuth(createRequestWithRole('user'), reply)
    expect(reply.status).not.toHaveBeenCalled()
  })
})
