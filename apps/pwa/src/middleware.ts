import { type NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const domain = host.replace('www.', '').split(':')[0]

  const slug = domain.endsWith('.clube.com.br')
    ? domain.replace('.clube.com.br', '')
    : null

  const response = NextResponse.next()
  if (slug) {
    response.headers.set('x-tenant-slug', slug)
  } else {
    response.headers.set('x-tenant-domain', domain)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
