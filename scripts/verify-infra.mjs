import 'dotenv/config'
import { Client } from 'pg'
import { createClient } from 'redis'

async function verifyPostgres() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  await client.query('SELECT 1')
  await client.end()
  console.log('Postgres: OK')
}

async function verifyRedis() {
  const client = createClient({ url: process.env.REDIS_URL })
  await client.connect()
  await client.ping()
  await client.quit()
  console.log('Redis: OK')
}

async function main() {
  await verifyPostgres()
  await verifyRedis()
}

main().catch((error) => {
  console.error('Infra verification failed:', error)
  process.exit(1)
})
