import { NextRequest } from 'next/server';

/**
 * Verifies CSRF token for state-changing requests (POST, PUT, DELETE, PATCH)
 * This implements a basic double-submit cookie pattern or header check.
 * Since NextAuth handles CSRF for its own routes, this is for our custom API endpoints.
 */
export async function verifyCsrfToken(req: NextRequest): Promise<boolean> {
  // Only verify for state-changing methods
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  const csrfTokenFromHeader = req.headers.get('x-csrf-token');
  // In NextAuth v4, the CSRF token is available in a cookie
  // This varies by environment (secure cookie vs plain)
  const isSecure = process.env.NEXTAUTH_URL?.startsWith('https');
  const cookieName = isSecure ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token';
  const csrfTokenFromCookie = req.cookies.get(cookieName)?.value;

  if (!csrfTokenFromHeader || !csrfTokenFromCookie) {
    // Development fallback if needed, but for production readiness we enforce it
    if (process.env.NODE_ENV === 'development') {
      // console.warn('[CSRF] Missing token in development - allowing for now');
      // return true;
    }
    return false;
  }

  // NextAuth stores the token as 'hash|token' or just 'token'
  // We just need to ensure the header matches the cookie value bits
  return csrfTokenFromHeader === csrfTokenFromCookie.split('|')[0];
}
