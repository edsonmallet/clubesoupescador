'use client'

import { useCategories } from '../hooks/useCategories'
import { TopicFeed } from './TopicFeed'

export function CategoryTopicFeed({ slug }: { slug: string }) {
  const { data: categories, isLoading } = useCategories()

  if (isLoading) return <p>Carregando...</p>

  const category = categories?.find((c) => c.slug === slug)
  if (!category) return <p>Categoria não encontrada.</p>

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">{category.name}</h1>
      <TopicFeed categoryId={category.id} />
    </div>
  )
}
