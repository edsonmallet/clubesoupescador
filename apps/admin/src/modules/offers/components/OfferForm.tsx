'use client'

import { Button, Input } from '@clube/ui'
import { useCreateOffer } from '../hooks/useCreateOffer'

const centsFromReais = (value: string) => Math.round(Number(value) * 100)

export function OfferForm() {
  const { form, mutation, onSubmit } = useCreateOffer()
  const {
    register,
    formState: { errors },
  } = form

  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Nome
        </label>
        <Input id="name" {...register('name')} />
        {errors.name && (
          <span className="text-sm text-red-600">{errors.name.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          Descrição
        </label>
        <Input id="description" {...register('description')} />
        {errors.description && (
          <span className="text-sm text-red-600">
            {errors.description.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="sku" className="text-sm font-medium">
          SKU
        </label>
        <Input id="sku" {...register('sku')} />
        {errors.sku && (
          <span className="text-sm text-red-600">{errors.sku.message}</span>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="priceFull" className="text-sm font-medium">
            Preço cheio (R$)
          </label>
          <Input
            id="priceFull"
            type="number"
            step="0.01"
            {...register('priceFullCents', { setValueAs: centsFromReais })}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="priceClub" className="text-sm font-medium">
            Preço clube (R$)
          </label>
          <Input
            id="priceClub"
            type="number"
            step="0.01"
            {...register('priceClubCents', { setValueAs: centsFromReais })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="stock" className="text-sm font-medium">
          Estoque
        </label>
        <Input
          id="stock"
          type="number"
          {...register('stock', { valueAsNumber: true })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="images" className="text-sm font-medium">
          URLs das imagens (uma por linha)
        </label>
        <textarea
          id="images"
          rows={3}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          {...register('images', {
            setValueAs: (value: string) =>
              value
                .split('\n')
                .map((url: string) => url.trim())
                .filter(Boolean),
          })}
        />
        {errors.images && (
          <span className="text-sm text-red-600">
            Verifique as URLs das imagens.
          </span>
        )}
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600">
          Não foi possível salvar o produto.
        </p>
      )}

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Salvando...' : 'Salvar produto'}
      </Button>
    </form>
  )
}
