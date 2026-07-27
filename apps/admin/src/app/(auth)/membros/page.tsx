import { MemberTable } from '@/modules/members/components/MemberTable'

export default function MembrosPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Membros</h1>
      <MemberTable />
    </main>
  )
}
