import { getCsrfToken } from 'next-auth/react';

/**
 * Enhanced fetch wrapper for API calls that automatically handles:
 * - CSRF token injection for state-changing methods
 * - JSON serialization/deserialization
 * - Error handling
 */
export async function apiFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

  const headers = new Headers(options.headers);

  // Automatically inject CSRF token if method is state-changing
  if (isStateChanging && !headers.has('X-CSRF-Token')) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  // Set default Content-Type if body is present and not already set
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `API error: ${response.status}`);
  }

  // Handle empty responses
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return {} as T;
}
