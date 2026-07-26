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
        className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Todas
      </Link>
      {categories?.map((category) => (
        <Link
          key={category.id}
          href={`/comunidade/${category.slug}`}
          className="rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          {category.name}
        </Link>
      ))}
    </nav>
  )
}
