import { OrderTable } from '@/modules/orders/components/OrderTable'

export default function PedidosPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Pedidos</h1>
      <OrderTable />
    </main>
  )
}
