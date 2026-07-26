import { getFirebaseAuth } from './firebase'

const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL ?? ''

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function resolveTenantSlug(): string | null {
  if (typeof window === 'undefined') return null
  const host = window.location.hostname
  return host.endsWith('.clube.com.br')
    ? host.replace('.clube.com.br', '')
    : null
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')

  const slug = resolveTenantSlug()
  if (slug) headers.set('x-tenant-slug', slug)

  const user = getFirebaseAuth().currentUser
  if (user) {
    const token = await user.getIdToken()
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${BFF_URL}${path}`, { ...init, headers })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { code?: string; message?: string }
    } | null
    throw new ApiError(
      response.status,
      body?.error?.code ?? 'UNKNOWN',
      body?.error?.message ?? response.statusText,
    )
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
}
