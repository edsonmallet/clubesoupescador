import { resolve } from 'node:path'
import { setRole } from '@clube/firebase-utils'
import { config } from 'dotenv'

config({ path: resolve(__dirname, '../../../.env') })

async function main(): Promise<void> {
  const uid = process.argv[2]

  if (!uid) {
    console.error('Uso: npx tsx scripts/seed-super-admin.ts <uid>')
    process.exit(1)
  }

  await setRole(uid, 'super_admin')

  console.log(`Role 'super_admin' atribuída ao usuário ${uid}.`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Falha ao atribuir role super_admin:', error)
    process.exit(1)
  })
