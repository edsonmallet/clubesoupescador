export function SignupsChart({
  data,
}: {
  data: Array<{ date: string; count: number }>
}) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">Sem novos membros nos últimos 30 dias.</p>
  }

  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="flex h-32 items-end gap-1">
      {data.map((point) => (
        <div key={point.date} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-slate-700"
            style={{ height: `${(point.count / max) * 100}%`, minHeight: point.count > 0 ? 4 : 0 }}
            title={`${point.date}: ${point.count}`}
          />
        </div>
      ))}
    </div>
  )
}
