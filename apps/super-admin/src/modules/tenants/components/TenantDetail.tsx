'use client'

import { Button } from '@clube/ui'
import { useImpersonateTenant } from '../hooks/useImpersonateTenant'
import { useTenant } from '../hooks/useTenant'
import { useUpdateTenantStatus } from '../hooks/useUpdateTenantStatus'

export function TenantDetail({ tenantId }: { tenantId: string }) {
  const { data, isLoading, isError } = useTenant(tenantId)
  const updateStatus = useUpdateTenantStatus(tenantId)
  const impersonate = useImpersonateTenant(tenantId)

  if (isLoading) return <p>Carregando...</p>
  if (isError) return <p>Erro ao carregar lojista.</p>
  if (!data) return <p>Lojista não encontrado.</p>

  const { tenant, memberCount } = data
  const isActive = tenant.status === 'active'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{tenant.name}</h1>
        <p className="text-sm text-slate-500">{tenant.slug}.clube.com.br</p>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="font-medium text-slate-500">Status</dt>
          <dd>{tenant.status}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Plano</dt>
          <dd>{tenant.planId ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Membros</dt>
          <dd>{memberCount}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Dono (uid)</dt>
          <dd>{tenant.ownerUid}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Criado em</dt>
          <dd>{new Date(tenant.createdAt).toLocaleDateString('pt-BR')}</dd>
        </div>
      </dl>

      <div className="flex gap-3">
        <Button
          variant={isActive ? 'outline' : 'default'}
          disabled={updateStatus.isPending}
          onClick={() => updateStatus.mutate(isActive ? 'suspended' : 'active')}
        >
          {isActive ? 'Suspender' : 'Ativar'}
        </Button>
        <Button
          variant="outline"
          disabled={impersonate.isPending}
          onClick={() => impersonate.mutate()}
        >
          {impersonate.isPending ? 'Gerando acesso...' : 'Impersonar'}
        </Button>
      </div>
    </div>
  )
}
