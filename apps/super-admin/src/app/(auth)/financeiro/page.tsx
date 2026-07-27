import { BillingOverviewTable } from '@/modules/financeiro/components/BillingOverviewTable'
import { RevenueSummary } from '@/modules/financeiro/components/RevenueSummary'

export default function FinanceiroPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Financeiro Global</h1>
        <RevenueSummary />
        <BillingOverviewTable />
      </div>
    </main>
  )
}
