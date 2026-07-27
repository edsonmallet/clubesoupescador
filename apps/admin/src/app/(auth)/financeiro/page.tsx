import { FinancialSummary } from '@/modules/financial/components/FinancialSummary'

export default function FinanceiroPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Financeiro</h1>
      <FinancialSummary />
    </main>
  )
}
