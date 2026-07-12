import { type NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

export function createDbClient<TSchema extends Record<string, unknown>>(
  schema: TSchema,
  connectionString: string,
): NodePgDatabase<TSchema> {
  const pool = new Pool({ connectionString })
  return drizzle(pool, { schema })
}
