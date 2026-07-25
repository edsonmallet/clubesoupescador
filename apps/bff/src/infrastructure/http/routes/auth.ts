import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { GetMeUseCase } from '../../../application/tenants/get-me.usecase'
import type { RegisterUserUseCase } from '../../../application/tenants/register-user.usecase'
import { MeResponseSchema, RegisterUserResponseSchema } from '../schemas/auth'

export type AuthRouteDeps = {
  tenantAuthPreHandler: preHandlerHookHandler
  requireAuth: preHandlerHookHandler
  registerUserUseCase: RegisterUserUseCase
  getMeUseCase: GetMeUseCase
}

export async function registerAuthRoutes(
  app: FastifyInstance,
  deps: AuthRouteDeps,
): Promise<void> {
  app.post(
    '/v1/auth/register',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireAuth],
      schema: { response: { 200: RegisterUserResponseSchema } },
    },
    async (request, reply) => {
      const user = await deps.registerUserUseCase.execute({
        uid: request.user!.uid,
        tenantId: request.tenant!.id,
      })

      reply.status(200).send({
        id: user.id,
        tenantId: user.tenantId,
        uid: user.uid,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      })
    },
  )

  app.get(
    '/v1/auth/me',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireAuth],
      schema: { response: { 200: MeResponseSchema } },
    },
    async (request, reply) => {
      const result = await deps.getMeUseCase.execute({
        uid: request.user!.uid,
        tenantId: request.tenant!.id,
        role: request.user!.role,
      })

      reply.status(200).send({
        uid: result.uid,
        role: result.role,
        tenantId: result.tenantId,
        registeredAt: result.registeredAt?.toISOString() ?? null,
      })
    },
  )
}
