import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_PATHS = ['/', '/login', '/register', '/verify-otp', '/forgot-password'];

// Route prefixes that require authentication
const PROTECTED_PREFIXES = ['/customer', '/provider', '/chat', '/notifications', '/profile', '/support-chatbot'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || (p !== '/' && pathname.startsWith(`${p}/`))
  );
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const isLoggedIn = Boolean(request.cookies.get('kk_auth')?.value);

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isPublic(pathname) && pathname !== '/') {
    return NextResponse.redirect(new URL('/customer/dashboard', request.url));
  }

  // Redirect unauthenticated users away from protected pages
  if (!isLoggedIn && isProtected(pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all paths except static files; the matcher above narrows it further
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
