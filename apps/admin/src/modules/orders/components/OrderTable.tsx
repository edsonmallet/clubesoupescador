'use client'

import type { Order } from '@clube/shared-types'
import { Button, Input } from '@clube/ui'
import { useState } from 'react'
import { useAdminOrders } from '../hooks/useAdminOrders'
import { useDispatchOrder } from '../hooks/useDispatchOrder'

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const STATUS_LABEL: Record<Order['status'], string> = {
  pending: 'Aguardando pagamento',
  paid: 'Pago',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

function DispatchCell({ order }: { order: Order }) {
  const [trackingCode, setTrackingCode] = useState('')
  const dispatch = useDispatchOrder()

  if (order.status !== 'paid') {
    return order.trackingCode ? (
      <span className="text-slate-600">{order.trackingCode}</span>
    ) : null
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Código de rastreio"
        value={trackingCode}
        onChange={(event) => setTrackingCode(event.target.value)}
      />
      <Button
        size="sm"
        disabled={dispatch.isPending || !trackingCode}
        onClick={() => dispatch.mutate({ id: order.id, trackingCode })}
      >
        Marcar como despachado
      </Button>
    </div>
  )
}

export function OrderTable() {
  const { data, isLoading } = useAdminOrders()

  if (isLoading) return <p>Carregando pedidos...</p>

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left">
          <th className="py-2">Pedido</th>
          <th className="py-2">Status</th>
          <th className="py-2">Valor</th>
          <th className="py-2">Rastreio</th>
        </tr>
      </thead>
      <tbody>
        {data?.items.map((order) => (
          <tr key={order.id} className="border-b border-slate-100">
            <td className="py-2">#{order.id.slice(0, 8)}</td>
            <td className="py-2">{STATUS_LABEL[order.status]}</td>
            <td className="py-2">{formatPrice(order.totalCents)}</td>
            <td className="py-2">
              <DispatchCell order={order} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
