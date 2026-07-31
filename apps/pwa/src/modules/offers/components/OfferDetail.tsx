'use client'

import { useCashbackBalance } from '@/modules/cashback/hooks/useCashbackBalance'
import { zodResolver } from '@/shared/utils/zod-resolver'
import { Button, Input } from '@clube/ui'
import { useForm } from 'react-hook-form'
import { useBuyOffer } from '../hooks/useBuyOffer'
import { useOffer } from '../hooks/useOffer'
import { useShippingQuote } from '../hooks/useShippingQuote'
import {
  type BuyOfferFormInput,
  buyOfferSchema,
} from '../schemas/address.schema'

const CASHBACK_MAX_PCT_OF_ORDER = 0.3

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function OfferDetail({ offerId }: { offerId: string }) {
  const { data: offer, isLoading } = useOffer(offerId)
  const { data: cashbackBalance } = useCashbackBalance()
  const buyOffer = useBuyOffer(offerId)
  const shippingQuote = useShippingQuote(offerId)

  const { register, handleSubmit, watch, formState } =
    useForm<BuyOfferFormInput>({
      resolver: zodResolver(buyOfferSchema),
      defaultValues: { qty: 1, cashbackUseCents: 0 },
    })

  if (isLoading || !offer) return <p>Carregando...</p>

  const isLocked = offer.priceClubCents === 0
  const qty = watch('qty') || 1
  const cashbackUseCents = watch('cashbackUseCents') || 0
  const subtotalCents = offer.priceClubCents * qty
  // Client-side preview only — the level discount isn't known here, so the
  // real total (with discount applied) is computed server-side at checkout.
  const cashbackCapCents = Math.floor(subtotalCents * CASHBACK_MAX_PCT_OF_ORDER)
  const maxUsableCashbackCents = Math.min(
    cashbackBalance?.availableCents ?? 0,
    cashbackCapCents,
  )
  const previewTotalCents = Math.max(
    0,
    subtotalCents - Math.min(cashbackUseCents, maxUsableCashbackCents),
  )

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="aspect-square overflow-hidden rounded-lg bg-brand-sand/60">
        {offer.images[0] && (
          <img
            src={offer.images[0]}
            alt={offer.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{offer.name}</h1>
        <p className="text-brand-ink/80">{offer.description}</p>

        <div className="flex flex-col gap-1">
          <span className="text-sm text-brand-ink/40 line-through">
            {formatPrice(offer.priceFullCents)}
          </span>
          {isLocked ? (
            <span className="text-lg font-semibold text-brand-ink/60">
              🔒 Assine para ver o preço de clube
            </span>
          ) : (
            <span className="text-2xl font-bold text-emerald-700">
              {formatPrice(offer.priceClubCents)}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-brand-ink/15 p-3">
          <span className="text-sm font-medium">Calcular frete</span>
          <div className="flex gap-2">
            <Input
              placeholder="CEP de destino"
              maxLength={9}
              onChange={(event) => {
                const zipCode = event.target.value.replace(/\D/g, '')
                if (zipCode.length === 8) {
                  shippingQuote.mutate({ qty: watch('qty') || 1, zipCode })
                }
              }}
            />
          </div>
          {shippingQuote.isPending && (
            <p className="text-sm text-brand-ink/60">Calculando...</p>
          )}
          {shippingQuote.data?.map((option) => (
            <div key={option.id} className="flex justify-between text-sm">
              <span>
                {option.name} ({option.deliveryTimeDays} dias)
              </span>
              <span>{formatPrice(option.price * 100)}</span>
            </div>
          ))}
        </div>

        {!isLocked && (
          <form
            onSubmit={handleSubmit((data) =>
              buyOffer.mutate({
                qty: data.qty,
                cashbackUseCents: data.cashbackUseCents,
                address: data.address,
              }),
            )}
            className="flex flex-col gap-3 rounded-md border border-brand-ink/15 p-3"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="qty" className="text-sm font-medium">
                Quantidade
              </label>
              <Input
                id="qty"
                type="number"
                min={1}
                {...register('qty', { valueAsNumber: true })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="cashback" className="text-sm font-medium">
                Cashback a usar (R$)
              </label>
              <span className="text-xs text-brand-ink/60">
                Disponível: {formatPrice(cashbackBalance?.availableCents ?? 0)}{' '}
                · máx. neste pedido: {formatPrice(maxUsableCashbackCents)}
              </span>
              <Input
                id="cashback"
                type="number"
                min={0}
                max={maxUsableCashbackCents / 100}
                step="0.01"
                {...register('cashbackUseCents', {
                  valueAsNumber: true,
                  setValueAs: (v) => Math.round(Number(v) * 100),
                })}
              />
            </div>

            <div className="flex justify-between border-t border-brand-ink/15 pt-2 text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(subtotalCents)}</span>
            </div>
            {cashbackUseCents > 0 && (
              <div className="flex justify-between text-sm text-emerald-700">
                <span>Cashback aplicado</span>
                <span>
                  -
                  {formatPrice(
                    Math.min(cashbackUseCents, maxUsableCashbackCents),
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold">
              <span>Total estimado</span>
              <span>{formatPrice(previewTotalCents)}</span>
            </div>

            <span className="text-sm font-medium">Endereço de entrega</span>
            <Input placeholder="CEP" {...register('address.zipCode')} />
            <Input placeholder="Rua" {...register('address.street')} />
            <div className="flex gap-2">
              <Input placeholder="Número" {...register('address.number')} />
              <Input
                placeholder="Complemento"
                {...register('address.complement')}
              />
            </div>
            <Input placeholder="Bairro" {...register('address.neighborhood')} />
            <div className="flex gap-2">
              <Input placeholder="Cidade" {...register('address.city')} />
              <Input
                placeholder="UF"
                maxLength={2}
                {...register('address.state')}
              />
            </div>

            {formState.errors.address && (
              <p className="text-sm text-red-600">
                Verifique os campos de endereço.
              </p>
            )}

            <Button type="submit" disabled={buyOffer.isPending}>
              {buyOffer.isPending ? 'Processando...' : 'Comprar'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
