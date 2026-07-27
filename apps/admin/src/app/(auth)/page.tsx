import { DashboardOverview } from '@/modules/dashboard/components/DashboardOverview'

export default function DashboardPage() {
  return (
    <main className="px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <DashboardOverview />
    </main>
  )
}
