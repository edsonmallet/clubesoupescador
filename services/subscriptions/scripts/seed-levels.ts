import { db } from '../src/infrastructure/db'
import { levels } from '../src/infrastructure/db/schema/subscriptions'

const LEVELS = [
  { name: 'Bronze', minXp: 0, storeDiscountPct: '5', cashbackPct: '3' },
  { name: 'Prata', minXp: 500, storeDiscountPct: '10', cashbackPct: '4' },
  { name: 'Ouro', minXp: 1500, storeDiscountPct: '15', cashbackPct: '5' },
  { name: 'Diamante', minXp: 5000, storeDiscountPct: '20', cashbackPct: '6' },
  { name: 'Lenda', minXp: 15000, storeDiscountPct: '25', cashbackPct: '8' },
]

async function seed(): Promise<void> {
  for (const level of LEVELS) {
    await db.insert(levels).values(level)
  }
  console.log('Seed concluído: 5 níveis (Bronze a Lenda) inseridos.')
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed falhou:', error)
    process.exit(1)
  })
