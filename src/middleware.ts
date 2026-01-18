import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Only run on /api routes
  if (!path.startsWith('/api')) {
    return NextResponse.next();
  }

  // Exclude public endpoints (Explicit Allowlist)
  if (
    path.startsWith('/api/auth') || // NextAuth endpoints
    path.startsWith('/api/webhooks') || // External webhooks
    path.startsWith('/api/share') || // Publicly shared content
    path.startsWith('/api/public') // Explicitly public API routes
  ) {
    return NextResponse.next();
  }

  // Check for session token
  // exact usage depends on how cookies are named, but getToken handles it automatically
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 },
    );
  }

  // Continue if authenticated
  return NextResponse.next();
}

// Configure matcher to only intercept API routes, optimizing performance
export const config = {
  matcher: '/api/:path*',
};
