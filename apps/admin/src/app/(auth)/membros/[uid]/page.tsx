import { MemberDetail } from '@/modules/members/components/MemberDetail'

export default function MemberDetailPage({ params }: { params: { uid: string } }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <MemberDetail uid={params.uid} />
    </main>
  )
}
