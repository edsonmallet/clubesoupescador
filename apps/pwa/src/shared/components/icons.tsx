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
