'use client'

import { Button, Input } from '@clube/ui'
import { useCreateTenant } from '../hooks/useCreateTenant'

export function TenantForm() {
  const { form, mutation, onSubmit } = useCreateTenant()
  const {
    register,
    formState: { errors },
  } = form

  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Nome da loja
        </label>
        <Input id="name" {...register('name')} />
        {errors.name && (
          <span className="text-sm text-red-600">{errors.name.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="slug" className="text-sm font-medium">
          Slug (subdomínio)
        </label>
        <Input id="slug" placeholder="acme" {...register('slug')} />
        {errors.slug && (
          <span className="text-sm text-red-600">{errors.slug.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="ownerUid" className="text-sm font-medium">
          UID Firebase do dono
        </label>
        <Input id="ownerUid" {...register('ownerUid')} />
        {errors.ownerUid && (
          <span className="text-sm text-red-600">
            {errors.ownerUid.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="logoUrl" className="text-sm font-medium">
          URL do logo (opcional)
        </label>
        <Input id="logoUrl" {...register('logoUrl')} />
        {errors.logoUrl && (
          <span className="text-sm text-red-600">{errors.logoUrl.message}</span>
        )}
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600">
          Não foi possível criar o lojista.
        </p>
      )}

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Criando...' : 'Criar lojista'}
      </Button>
    </form>
  )
}
