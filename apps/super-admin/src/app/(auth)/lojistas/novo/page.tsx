import { TenantForm } from '@/modules/tenants/components/TenantForm'

export default function NovoLojistaPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Novo lojista</h1>
      <TenantForm />
    </main>
  )
}
