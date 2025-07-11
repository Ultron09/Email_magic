import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'session';
const PROTECTED_ROUTE = '/dashboard';
const LOGIN_ROUTE = '/';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const { pathname } = request.nextUrl;

  // If user is trying to access the dashboard without a session, redirect to login
  if (pathname.startsWith(PROTECTED_ROUTE) && !sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_ROUTE;
    return NextResponse.redirect(url);
  }

  // If user is logged in and tries to access the login page, redirect to dashboard
  if (pathname === LOGIN_ROUTE && sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = PROTECTED_ROUTE;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/'],
};
