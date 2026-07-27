import { eq } from 'drizzle-orm'
import { db } from '../src/infrastructure/db'
import { saasPlans } from '../src/infrastructure/db/schema/billing'

const PLANS = [
  { name: 'Basic', priceCents: 4900 },
  { name: 'Pro', priceCents: 9900 },
  { name: 'Enterprise', priceCents: 19900 },
]

async function seed(): Promise<void> {
  for (const plan of PLANS) {
    const [existing] = await db
      .select()
      .from(saasPlans)
      .where(eq(saasPlans.name, plan.name))
      .limit(1)

    if (existing) {
      console.log(`Plano "${plan.name}" já existe, pulando.`)
      continue
    }

    await db.insert(saasPlans).values({ ...plan, active: true })
    console.log(`Plano "${plan.name}" criado.`)
  }

  console.log('Seed concluído: planos Basic/Pro/Enterprise verificados.')
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed falhou:', error)
    process.exit(1)
  })
