import { TenantTable } from '@/modules/tenants/components/TenantTable'
import { Button } from '@clube/ui'
import Link from 'next/link'

export default function LojistasPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lojistas</h1>
        <Link href="/lojistas/novo">
          <Button>Novo lojista</Button>
        </Link>
      </div>
      <TenantTable />
    </main>
  )
}
