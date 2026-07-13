import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { middleware } from './middleware'

describe('middleware', () => {
  it('sets x-tenant-slug for a *.clube.com.br subdomain', () => {
    const request = new NextRequest('https://soupescador.clube.com.br/', {
      headers: { host: 'soupescador.clube.com.br' },
    })

    const response = middleware(request)

    expect(response.headers.get('x-tenant-slug')).toBe('soupescador')
  })

  it('sets x-tenant-domain for a custom domain', () => {
    const request = new NextRequest('https://minhaloja.com.br/', {
      headers: { host: 'minhaloja.com.br' },
    })

    const response = middleware(request)

    expect(response.headers.get('x-tenant-domain')).toBe('minhaloja.com.br')
  })
})
