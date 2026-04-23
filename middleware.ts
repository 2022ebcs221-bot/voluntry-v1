// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthToken, decodeToken, getDashboardPath, isUserApproved } from './src/lib/permissions';

export async function middleware(request: NextRequest) {
  const token = await getAuthToken();
  const path = request.nextUrl.pathname;

  const publicRoutes = ['/login', '/register', '/api/auth/register', '/api/auth/login', '/'];
  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith(route));

if (isPublicRoute && path.startsWith('/dashboard')) {
      // If user is logged in, redirect away from login/register to their dashboard
      if (token) {
         const decoded = decodeToken(token) as { role: string } | null;
         if (decoded?.role) {
            return NextResponse.redirect(new URL(getDashboardPath(decoded.role), request.url));
         }
      }
   }

  // If no token and trying to access protected route
  if (!token) {
    if (path.startsWith('/dashboard') || path.startsWith('/profile')) {
       return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Verify token
  const decoded = decodeToken(token) as { userId: string; role: string } | null;
  if (!decoded?.role) {
    // Invalid token
     if (path.startsWith('/dashboard') || path.startsWith('/profile')) {
       return NextResponse.redirect(new URL('/login', request.url));
     }
     return NextResponse.next();
  }

  const userRole = decoded.role;

  // Role-based redirection for dashboards
  if (path.startsWith('/dashboard/admin') && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL(getDashboardPath(userRole), request.url));
  }

  if (path.startsWith('/dashboard/volunteer') && userRole !== 'VOLUNTEER') {
    return NextResponse.redirect(new URL(getDashboardPath(userRole), request.url));
  }

  if (path.startsWith('/dashboard/organization') && userRole !== 'ORGANIZATION') {
    return NextResponse.redirect(new URL(getDashboardPath(userRole), request.url));
  }

  // Check user approval status for protected routes
  if (path.startsWith('/dashboard') || path.startsWith('/profile')) {
    const approved = await isUserApproved(decoded.userId);
    if (!approved) {
      return NextResponse.redirect(new URL('/status', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};