import { NextResponse } from 'next/server'

export function middleware() {
  // Simple passthrough middleware - no authentication checks for now
  return NextResponse.next()
}

export const config = {
  // Apply to all routes except static files
  matcher: [
    /*
     * Match all request paths except:
     * - _next directory (Next.js static files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - image files
     */
    '/((?!_next|favicon.ico|sitemap.xml|robots.txt|.*\.jpg|.*\.png|.*\.svg|.*\.gif).*)',
  ],
} 