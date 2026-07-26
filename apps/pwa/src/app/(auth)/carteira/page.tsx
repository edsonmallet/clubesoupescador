import { CashbackBalance } from '@/modules/cashback/components/CashbackBalance'
import { CashbackHistory } from '@/modules/cashback/components/CashbackHistory'

export default function CarteiraPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Carteira de cashback</h1>
      <CashbackBalance />
      <div>
        <h2 className="mb-3 text-lg font-semibold">Extrato</h2>
        <CashbackHistory />
      </div>
    </main>
  )
}
