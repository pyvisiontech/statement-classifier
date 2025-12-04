import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) Skip auth for webhooks & API routes
  if (
    pathname.startsWith('/transactions/webhook') || // your webhook
    pathname.startsWith('/api') // any API routes you might add
  ) {
    return NextResponse.next();
  }

  // 2) Skip expensive Supabase session check for public auth/landing pages.
  // These pages can render without knowing the current session; redirects for
  // authenticated users are handled after login elsewhere.
  if (pathname === '/' || pathname === '/signin' || pathname === '/signup') {
    return NextResponse.next();
  }

  // 3) Only redirect unauthenticated users for page navigations
  const accept = request.headers.get('accept') || '';
  const isPageNavigation = accept.includes('text/html');

  // Delegate to your existing session handler
  return updateSession(request, { isPageNavigation });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
