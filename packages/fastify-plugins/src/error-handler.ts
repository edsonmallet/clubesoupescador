import type { FastifyInstance } from 'fastify'

type DomainErrorShape = {
  code: string
  statusCode: number
  message: string
}

function isDomainError(error: unknown): error is DomainErrorShape {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'statusCode' in error &&
    'message' in error
  )
}

export async function registerErrorHandler(app: FastifyInstance): Promise<void> {
  app.setErrorHandler((error: unknown, _request, reply) => {
    if (isDomainError(error)) {
      reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message },
      })
      return
    }

    app.log.error(error)
    reply.status(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' },
    })
  })
}
