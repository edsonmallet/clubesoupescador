'use client'

import { Button } from '@clube/ui'
import Link from 'next/link'
import { useAdminOffers } from '../hooks/useAdminOffers'
import { useUpdateOffer } from '../hooks/useUpdateOffer'

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function OfferTable() {
  const { data, isLoading } = useAdminOffers()
  const updateOffer = useUpdateOffer()

  if (isLoading) return <p>Carregando produtos...</p>

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link href="/ofertas/nova">
          <Button>Novo produto</Button>
        </Link>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left">
            <th className="py-2">Nome</th>
            <th className="py-2">Preço clube</th>
            <th className="py-2">Estoque</th>
            <th className="py-2">Status</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {data?.items.map((offer) => (
            <tr key={offer.id} className="border-b border-slate-100">
              <td className="py-2">{offer.name}</td>
              <td className="py-2">{formatPrice(offer.priceClubCents)}</td>
              <td className="py-2">{offer.stock}</td>
              <td className="py-2">{offer.active ? 'Ativo' : 'Inativo'}</td>
              <td className="py-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={updateOffer.isPending}
                  onClick={() =>
                    updateOffer.mutate({
                      id: offer.id,
                      data: { active: !offer.active },
                    })
                  }
                >
                  {offer.active ? 'Desativar' : 'Ativar'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
