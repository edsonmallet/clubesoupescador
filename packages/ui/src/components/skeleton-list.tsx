import { Skeleton } from './skeleton'

export function SkeletonList({
  count,
  itemClassName,
  containerClassName,
}: {
  count: number
  itemClassName: string
  containerClassName: string
}) {
  return (
    <div className={containerClassName}>
      {Array.from({ length: count }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton count, no reordering
        <Skeleton key={index} className={itemClassName} />
      ))}
    </div>
  )
}
