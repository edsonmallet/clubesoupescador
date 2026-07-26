import { Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'
import type { ILevelRepository } from '../../../domain/interfaces/ILevelRepository'
import { LevelResponseSchema } from '../schemas/levels'

export type LevelsRouteDeps = {
  levelRepository: ILevelRepository
}

const ErrorResponseSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
})

export async function registerLevelsRoutes(
  app: FastifyInstance,
  deps: LevelsRouteDeps,
): Promise<void> {
  app.get(
    '/levels/:id',
    {
      schema: {
        response: { 200: LevelResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const level = await deps.levelRepository.findById(id)

      if (!level) {
        reply.status(404).send({
          error: {
            code: 'LEVEL_NOT_FOUND',
            message: `Level ${id} not found`,
          },
        })
        return
      }

      reply.status(200).send({
        id: level.id,
        name: level.name,
        minXp: level.minXp,
        storeDiscountPct: level.storeDiscountPct,
        cashbackPct: level.cashbackPct,
      })
    },
  )
}
