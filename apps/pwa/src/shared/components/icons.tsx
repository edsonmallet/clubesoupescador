import type { SVGProps } from 'react'

function base(props: SVGProps<SVGSVGElement>) {
  return {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  }
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

export function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function EyeOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.5 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7c1.4 0 2.6-.3 3.7-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}

export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17.5" cy="9" r="2.5" />
      <path d="M21.5 20c0-2.6-1.9-4.8-4.5-5.4" />
    </svg>
  )
}

export function TagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M3 12.5 12.5 3H20a1 1 0 0 1 1 1v7.5L11.5 21 3 12.5Z" />
      <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function StoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M3 9.5 4.5 4h15L21 9.5" />
      <path d="M3 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" />
      <path d="M5 10v9h14v-9" />
      <path d="M10 19v-5h4v5" />
    </svg>
  )
}

export function MessageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M4 4h16v12H8l-4 4Z" />
    </svg>
  )
}

export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5" />
    </svg>
  )
}

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </svg>
  )
}

export function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" />
      <path d="M10 19.5a2 2 0 0 0 4 0" />
    </svg>
  )
}

export function TrophyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0Z" />
      <path d="M7 5H4v1.5A3.5 3.5 0 0 0 7.5 10" />
      <path d="M17 5h3v1.5A3.5 3.5 0 0 1 16.5 10" />
      <path d="M12 14v3" />
      <path d="M9 20h6" />
      <path d="M10 17h4v3h-4Z" />
    </svg>
  )
}

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3.5" />
      <path d="M16 3v3.5" />
    </svg>
  )
}

export function ShareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <circle cx="18" cy="5.5" r="2.3" />
      <circle cx="6" cy="12" r="2.3" />
      <circle cx="18" cy="18.5" r="2.3" />
      <path d="m8 10.8 8-4.2" />
      <path d="m8 13.2 8 4.2" />
    </svg>
  )
}

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function ArrowLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  )
}

export function TicketIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" />
      <path d="M14 6v12" strokeDasharray="2 2" />
    </svg>
  )
}

export function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="m12 3 2.6 5.8 6.2.6-4.7 4.2 1.4 6.2L12 16.8 6.5 19.8l1.4-6.2-4.7-4.2 6.2-.6Z" />
    </svg>
  )
}

export function PhoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M5 4h3.5l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2 4 1.5V19a2 2 0 0 1-2 2 16 16 0 0 1-14-14 2 2 0 0 1 2-2Z" />
    </svg>
  )
}

export function MapPinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M12 21s7-6.5 7-11.5a7 7 0 1 0-14 0C5 14.5 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  )
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.5-2-3.5-2.4 1a7.7 7.7 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5a7.7 7.7 0 0 0-2.6 1.5l-2.4-1-2 3.5 2 1.5a7.6 7.6 0 0 0 0 3l-2 1.5 2 3.5 2.4-1a7.7 7.7 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.7 7.7 0 0 0 2.6-1.5l2.4 1 2-3.5Z" />
    </svg>
  )
}

export function LogoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M16 16l4-4-4-4" />
      <path d="M20 12H9" />
    </svg>
  )
}

export function EditIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19 3 20l1-4Z" />
      <path d="m14.5 5.5 3 3" />
    </svg>
  )
}

export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={18}
      height={18}
      {...props}
    >
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.38l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.62l4.01 3.1C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  )
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={18}
      height={18}
      {...props}
    >
      <path
        fill="#1877F2"
        d="M24 12a12 12 0 1 0-13.88 11.86v-8.39H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.39A12 12 0 0 0 24 12Z"
      />
    </svg>
  )
}
