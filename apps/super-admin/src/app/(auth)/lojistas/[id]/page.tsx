import { TenantDetail } from '@/modules/tenants/components/TenantDetail'

export default function LojistaDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <TenantDetail tenantId={params.id} />
    </main>
  )
}
