'use client'

import { useOrders } from '../hooks/useOrders'
import { OrderCard } from './OrderCard'

export function OrderList() {
  const { data, isLoading } = useOrders()

  if (isLoading) return <p>Carregando pedidos...</p>

  if (!data?.items.length) {
    return <p className="text-slate-600">Você ainda não fez nenhum pedido.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {data.items.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}
