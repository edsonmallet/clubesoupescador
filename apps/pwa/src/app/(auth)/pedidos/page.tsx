import { OrderList } from '@/modules/orders/components/OrderList'

export default function PedidosPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Meus pedidos</h1>
      <OrderList />
    </main>
  )
}
