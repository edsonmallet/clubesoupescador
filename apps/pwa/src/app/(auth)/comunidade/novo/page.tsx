import { NewTopicForm } from '@/modules/community/components/NewTopicForm'

export default function NovoTopicoPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Novo tópico</h1>
      <NewTopicForm />
    </main>
  )
}
