import { PlanGrid } from '@/modules/subscriptions/components/PlanGrid'

export default function PlanosPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-16">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold">Assine o clube por R$ 19,90/mês</h1>
        <p className="text-slate-600">
          Compre com preço de custo, acumule XP e desbloqueie descontos.
        </p>
      </div>
      <PlanGrid />
    </main>
  )
}
