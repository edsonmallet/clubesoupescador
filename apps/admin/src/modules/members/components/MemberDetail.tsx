'use client'

import { useMemberOrders } from '../hooks/useMemberOrders'

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function MemberDetail({ uid }: { uid: string }) {
  const { data: orders, isLoading } = useMemberOrders(uid)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Membro {uid.slice(0, 12)}</h1>
        <p className="text-sm text-slate-500">{uid}</p>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Pedidos</h2>
        {isLoading ? (
          <p>Carregando...</p>
        ) : !orders?.items.length ? (
          <p className="text-sm text-slate-600">Nenhum pedido.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="py-2">Pedido</th>
                <th className="py-2">Status</th>
                <th className="py-2">Valor</th>
                <th className="py-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {orders.items.map((order) => (
                <tr key={order.id} className="border-b border-slate-100">
                  <td className="py-2">#{order.id.slice(0, 8)}</td>
                  <td className="py-2">{order.status}</td>
                  <td className="py-2">{formatPrice(order.totalCents)}</td>
                  <td className="py-2">
                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-sm text-slate-500">
        Histórico detalhado de XP, cashback e participações em rifas/torneios ainda não tem
        endpoint administrativo dedicado.
      </p>
    </div>
  )
}
