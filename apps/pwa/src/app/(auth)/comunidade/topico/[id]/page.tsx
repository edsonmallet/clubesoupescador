import { TopicDetail } from '@/modules/community/components/TopicDetail'

export default function TopicoPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <TopicDetail topicId={params.id} />
    </main>
  )
}
