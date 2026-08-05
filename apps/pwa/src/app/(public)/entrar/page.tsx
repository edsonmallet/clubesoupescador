import { SignInForm } from '@/modules/auth/components/SignInForm'
import { Logo } from '@/shared/components/Logo'
import {
  MessageIcon,
  StoreIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
} from '@/shared/components/icons'

const FEATURES = [
  { icon: UsersIcon, label: 'COMUNIDADE', desc: 'Conecte-se com pescadores' },
  {
    icon: TagIcon,
    label: 'OFERTAS',
    desc: 'As melhores ofertas em um só lugar',
  },
  {
    icon: StoreIcon,
    label: 'LOJAS PARCEIRAS',
    desc: 'Apoie lojas locais da pesca',
  },
  { icon: MessageIcon, label: 'FÓRUNS', desc: 'Dicas, histórias e muito mais' },
]

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col md:flex-row">
      {/* Hero panel — desktop only */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden md:flex md:w-1/2"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(31,78,95,0.55), rgba(18,30,36,0.85)), url('/hero-pescador.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="flex px-12 pt-16">
          <Logo size="lg" />
        </div>

        <div className="grid grid-cols-4 gap-6 border-t border-brand-sand/15 bg-brand-dark/70 px-8 py-8 backdrop-blur-sm">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex flex-col items-start gap-2 text-brand-sand"
            >
              <Icon width={28} height={28} className="text-brand-sand" />
              <span className="font-heading text-base tracking-wide">
                {label}
              </span>
              <span className="text-sm leading-tight text-brand-sand/70">
                {desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile header */}
      <div className="flex flex-col items-center justify-center gap-2 rounded-b-[2.5rem] bg-brand-dark px-6 py-12 md:hidden">
        <Logo variant="compact" size="sm" />
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 flex-col items-center justify-center gap-6 bg-brand-sand px-6 py-10">
        <button
          type="button"
          disabled
          className="absolute right-6 top-6 hidden items-center gap-2 rounded-full border border-brand-ink/20 bg-white px-4 py-2 text-xs font-medium text-brand-ink/60 md:flex"
        >
          <UserIcon width={16} height={16} />
          Sou lojista
        </button>

        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-3xl leading-tight text-brand-dark">
              BEM-VINDO
              <br />
              AO ANZOL CLUB
            </h1>
            <p className="text-sm text-brand-ink/70">
              Entre para a comunidade de quem vive a pesca.
            </p>
          </div>

          <SignInForm />
        </div>
      </div>
    </main>
  )
}
