import { CategoryList } from '@/modules/community/components/CategoryList'
import { TopicFeed } from '@/modules/community/components/TopicFeed'
import { Button } from '@clube/ui'
import Link from 'next/link'

export default function ComunidadePage() {
  return (
    <main className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[200px_1fr]">
      <aside className="flex flex-col gap-4">
        <Link href="/comunidade/novo">
          <Button>Novo tópico</Button>
        </Link>
        <CategoryList />
      </aside>
      <TopicFeed />
    </main>
  )
}
