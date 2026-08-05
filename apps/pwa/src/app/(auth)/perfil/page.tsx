import { ProfileHeader } from '@/modules/profile/components/ProfileHeader'
import { ProfileMenu } from '@/modules/profile/components/ProfileMenu'

export default function PerfilPage() {
  return (
    <main className="min-h-screen bg-brand-sand">
      <ProfileHeader />
      <div className="mx-auto w-full max-w-3xl md:px-4">
        <ProfileMenu />
      </div>
    </main>
  )
}
