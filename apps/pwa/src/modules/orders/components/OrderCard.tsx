import type { Order } from '@clube/shared-types'

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const STATUS_LABEL: Record<Order['status'], string> = {
  pending: 'Aguardando pagamento',
  paid: 'Pago',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

export function OrderCard({ order }: { order: Order }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">
          Pedido #{order.id.slice(0, 8)}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <span className="text-lg font-bold">{formatPrice(order.totalCents)}</span>

      {order.trackingCode && (
        <span className="text-sm text-slate-600">
          Rastreio: {order.trackingCode}
        </span>
      )}

      <span className="text-xs text-slate-400">
        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
      </span>
    </div>
  )
}
