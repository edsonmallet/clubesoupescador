import { createDbClient } from '@clube/db-client'
import { env } from '../../shared/env'
import { schema } from './schema'

export const db = createDbClient(schema, env.DATABASE_URL)
