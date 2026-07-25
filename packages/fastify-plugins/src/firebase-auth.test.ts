import type { FastifyReply, FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import { createFirebaseAuthPreHandler } from './firebase-auth'

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

describe('createFirebaseAuthPreHandler', () => {
  it('does nothing when there is no authorization header', async () => {
    const preHandler = createFirebaseAuthPreHandler()
    const request = { headers: {} } as unknown as FastifyRequest
    const reply = createMockReply()

    await preHandler(request, reply)

    expect(request.user).toBeUndefined()
    expect(reply.status).not.toHaveBeenCalled()
  })

  it('maps a verified JWT into request.user without touching request.tenant', async () => {
    verifyIdToken.mockResolvedValueOnce({
      uid: 'user-1',
      role: 'subscriber',
      tenant_id: 'tenant-1',
    })
    const preHandler = createFirebaseAuthPreHandler()
    const request = {
      headers: { authorization: 'Bearer fake-token' },
    } as unknown as FastifyRequest
    const reply = createMockReply()

    await preHandler(request, reply)

    expect(verifyIdToken).toHaveBeenCalledWith('fake-token')
    expect(request.user).toEqual({
      uid: 'user-1',
      role: 'subscriber',
      tenant_id: 'tenant-1',
    })
    expect(request.tenant).toBeUndefined()
  })

  it('replies 401 with TOKEN_EXPIRED when the token is expired', async () => {
    verifyIdToken.mockRejectedValueOnce(
      Object.assign(new Error('Firebase ID token has expired'), {
        code: 'auth/id-token-expired',
      }),
    )
    const preHandler = createFirebaseAuthPreHandler()
    const request = {
      headers: { authorization: 'Bearer expired-token' },
    } as unknown as FastifyRequest
    const reply = createMockReply()

    await preHandler(request, reply)

    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({
      error: { code: 'TOKEN_EXPIRED', message: 'Token expired' },
    })
  })

  it('replies 401 with INVALID_TOKEN for any other verification failure', async () => {
    verifyIdToken.mockRejectedValueOnce(
      Object.assign(new Error('Decoding Firebase ID token failed'), {
        code: 'auth/argument-error',
      }),
    )
    const preHandler = createFirebaseAuthPreHandler()
    const request = {
      headers: { authorization: 'Bearer malformed-token' },
    } as unknown as FastifyRequest
    const reply = createMockReply()

    await preHandler(request, reply)

    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({
      error: { code: 'INVALID_TOKEN', message: 'Invalid token' },
    })
  })
})
