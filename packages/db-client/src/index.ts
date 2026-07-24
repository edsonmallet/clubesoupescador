import { type NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

export function createDbClient<TSchema extends Record<string, unknown>>(
  schema: TSchema,
  connectionString: string,
): NodePgDatabase<TSchema> {
  const pool = new Pool({ connectionString })
  // node-postgres emits 'error' on the pool for failures on idle clients
  // (e.g. the backend closing the connection). Without a listener, that
  // becomes an unhandled exception and can crash the process. See:
  // https://node-postgres.com/apis/pool#error
  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message)
  })
  return drizzle(pool, { schema })
}
