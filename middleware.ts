import { NextResponse, NextRequest } from 'next/server'

const PUBLIC_PATHS = new Set([
  '/api/supabase-health',
  '/favicon.ico',
  '/login',
])

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const path = url.pathname

  if (path.startsWith('/_next') || path.startsWith('/assets')) {
    return NextResponse.next()
  }
  if (PUBLIC_PATHS.has(path)) {
    return NextResponse.next()
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
