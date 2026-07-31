'use client'

import Link from 'next/link'
import { useCategories } from '../hooks/useCategories'

export function CategoryList() {
  const { data: categories, isLoading } = useCategories()

  if (isLoading) return null

  return (
    <nav className="flex flex-col gap-1">
      <Link
        href="/comunidade"
        className="rounded-md px-3 py-2 text-sm font-medium text-brand-ink hover:bg-brand-sand/60"
      >
        Todas
      </Link>
      {categories?.map((category) => (
        <Link
          key={category.id}
          href={`/comunidade/${category.slug}`}
          className="rounded-md px-3 py-2 text-sm text-brand-ink/80 hover:bg-brand-sand/60"
        >
          {category.name}
        </Link>
      ))}
    </nav>
  )
}
