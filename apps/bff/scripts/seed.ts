import { db } from '../src/infrastructure/db'
import { tenants } from '../src/infrastructure/db/schema/tenants'

const DEV_TENANT_ID = '00000000-0000-0000-0000-000000000001'

async function seed(): Promise<void> {
  await db
    .insert(tenants)
    .values({
      id: DEV_TENANT_ID,
      slug: 'dev',
      name: 'Dev Tenant',
      ownerUid: 'dev-owner',
      status: 'active',
      settings: {},
    })
    .onConflictDoUpdate({
      target: tenants.id,
      set: { slug: 'dev', name: 'Dev Tenant' },
    })

  console.log(`Seed concluído: tenant dev (${DEV_TENANT_ID}) pronto.`)
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed falhou:', error)
    process.exit(1)
  })
