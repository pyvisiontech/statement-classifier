// utils/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(
  request: NextRequest,
  { isPageNavigation = true }: { isPageNavigation?: boolean } = {}
) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, // Changed from PUBLISHABLE_KEY to ANON_KEY
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession();

  // Public paths that don't require authentication
  const publicPaths = [
    '/',        // public landing page
    '/signin',
    '/signup',
    '/auth/callback',
    '/forgot-password',
    '/_next/',
    '/favicon.ico',
    '/api/'
  ];

  const isPublicPath = publicPaths.some(path => {
    // Exact match
    if (request.nextUrl.pathname === path) return true;
    // Path starts with (for nested paths)
    if (path.endsWith('/') && request.nextUrl.pathname.startsWith(path)) return true;
    // API routes
    if (path === '/api/' && request.nextUrl.pathname.startsWith('/api/')) return true;
    return false;
  });

  // Redirect unauthenticated users to sign-in for protected routes
  if (!session && !isPublicPath) {
    const url = new URL('/signin', request.url);
    url.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages to dashboard
  if (session && (request.nextUrl.pathname === '/signin' || request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}