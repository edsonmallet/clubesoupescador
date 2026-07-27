export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-slate-200 p-4">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  )
}
