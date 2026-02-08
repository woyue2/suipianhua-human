import { NextResponse, NextRequest } from 'next/server'

const PUBLIC_PATHS = new Set([
  '/access',
  '/api/access',
  '/api/supabase-health',
  '/favicon.ico',
  '/login',
])

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const path = url.pathname

  const isProd = process.env.NODE_ENV === 'production'

  if (path.startsWith('/_next') || path.startsWith('/assets')) {
    return NextResponse.next()
  }
  if (PUBLIC_PATHS.has(path)) {
    return NextResponse.next()
  }

  if (!isProd) {
    return NextResponse.next()
  }

  const envPassword = process.env.APP_ACCESS_PASSWORD
  if (!envPassword) {
    return NextResponse.next()
  }

  const cookieA = req.cookies.get('app_access')?.value
  const cookieB = req.cookies.get('app_access_client')?.value
  const queryToken = req.nextUrl.searchParams.get('access')
  const hasAccess = cookieA === 'yes' || cookieB === 'yes' || queryToken === 'yes'

  if (hasAccess) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/access', req.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
