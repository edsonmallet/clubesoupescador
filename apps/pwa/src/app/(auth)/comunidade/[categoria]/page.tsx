import { CategoryTopicFeed } from '@/modules/community/components/CategoryTopicFeed'

export default function CategoriaPage({
  params,
}: { params: { categoria: string } }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <CategoryTopicFeed slug={params.categoria} />
    </main>
  )
}
