import { SettingsTabs } from '@/modules/settings/components/SettingsTabs'

export default function ConfiguracoesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Configurações</h1>
      <SettingsTabs />
    </main>
  )
}
