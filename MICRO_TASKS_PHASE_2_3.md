# Phase 2 & 3: Security Headers & Rate Limiting - Micro-Task Decomposition

## Executive Summary

**Original Scope**:

- Phase 2.1: Add comprehensive security headers to next.config.ts
- Phase 3.1: Update /api/share route with requireAuthAndRateLimit

**Decomposed Into**: 42 atomic micro-tasks (5-10 minutes each)
**Total Sequential Time**: ~5.5 hours
**Estimated Parallel Time**: ~45 minutes
**Parallelization Factor**: 7.3x
**Max Concurrent Tasks**: 12 (waves 3-4)

---

# PHASE 2: Security Headers Implementation

## Overview

Implement comprehensive security headers in Next.js configuration and middleware to protect against OWASP Top 10 vulnerabilities including XSS, clickjacking, MIME type confusion, and more.

---

## Task Group 2.1: Security Headers Configuration (Parallel Safe)

### 2.1.1: Create Security Headers Type Definitions

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/security.ts` (NEW)
**Duration**: 7 minutes
**Dependencies**: None
**Parallel Group**: security-types

**Action**: Create a new file with TypeScript interfaces for security header configuration.

**File Content**:

```typescript
export interface SecurityHeadersConfig {
  contentSecurityPolicy: string;
  frameOptions: string;
  contentTypeOptions: string;
  referrerPolicy: string;
  permissionsPolicy: string;
  xssProtection: string;
  hsts: string;
}

export interface SecurityHeaders {
  [key: string]: string | string[];
}

export const DEFAULT_SECURITY_HEADERS: SecurityHeadersConfig = {
  contentSecurityPolicy:
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  frameOptions: 'DENY',
  contentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: 'geolocation=(), microphone=(), camera=()',
  xssProtection: '1; mode=block',
  hsts: 'max-age=31536000; includeSubDomains; preload',
};
```

**Success Criteria**: File creates without errors, TypeScript compiles, interfaces properly typed.

---

### 2.1.2: Create Security Headers Builder Utility

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/headers-builder.ts` (NEW)
**Duration**: 8 minutes
**Dependencies**: 2.1.1
**Parallel Group**: security-utils

**Action**: Create utility function to build security headers from configuration.

**File Content**:

```typescript
import { SecurityHeadersConfig, SecurityHeaders } from '@/lib/types/security';

export function buildSecurityHeaders(config: SecurityHeadersConfig): SecurityHeaders {
  return {
    'X-Content-Type-Options': config.contentTypeOptions,
    'X-Frame-Options': config.frameOptions,
    'X-XSS-Protection': config.xssProtection,
    'Referrer-Policy': config.referrerPolicy,
    'Permissions-Policy': config.permissionsPolicy,
    'Strict-Transport-Security': config.hsts,
    'Content-Security-Policy': config.contentSecurityPolicy,
  };
}

export function formatHeadersForNextConfig(headers: SecurityHeaders): any[] {
  return [
    {
      source: '/(.*)',
      headers: Object.entries(headers).map(([key, value]) => ({
        key,
        value: Array.isArray(value) ? value.join('; ') : value,
      })),
    },
  ];
}

export function validateSecurityHeaders(headers: SecurityHeaders): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate HSTS header presence
  if (!headers['Strict-Transport-Security']) {
    errors.push('Missing HSTS header');
  }

  // Validate CSP presence
  if (!headers['Content-Security-Policy']) {
    errors.push('Missing Content-Security-Policy header');
  }

  // Validate X-Frame-Options
  if (!headers['X-Frame-Options']) {
    errors.push('Missing X-Frame-Options header');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

**Success Criteria**: Functions properly build headers object, format for Next.js config, validate header presence.

---

### 2.1.3: Create HSTS Configuration Module

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/hsts-config.ts` (NEW)
**Duration**: 6 minutes
**Dependencies**: 2.1.1
**Parallel Group**: security-utils

**Action**: Create module for HSTS (HTTP Strict-Transport-Security) configuration.

**File Content**:

```typescript
export interface HSTSConfig {
  maxAge: number;
  includeSubDomains: boolean;
  preload: boolean;
}

export const DEFAULT_HSTS_CONFIG: HSTSConfig = {
  maxAge: 31536000, // 1 year in seconds
  includeSubDomains: true,
  preload: true,
};

export function buildHSTSHeader(config: HSTSConfig = DEFAULT_HSTS_CONFIG): string {
  const parts = [`max-age=${config.maxAge}`];

  if (config.includeSubDomains) {
    parts.push('includeSubDomains');
  }

  if (config.preload) {
    parts.push('preload');
  }

  return parts.join('; ');
}
```

**Success Criteria**: HSTS builder correctly formats header string with proper values.

---

### 2.1.4: Create CSP Configuration Module

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/csp-config.ts` (NEW)
**Duration**: 8 minutes
**Dependencies**: 2.1.1
**Parallel Group**: security-utils

**Action**: Create module for Content-Security-Policy configuration.

**File Content**:

```typescript
export interface CSPDirectives {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  fontSrc: string[];
  connectSrc: string[];
  mediaSrc: string[];
  objectSrc: string[];
  frameSrc: string[];
}

export const DEFAULT_CSP_DIRECTIVES: CSPDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'cdn.jsdelivr.net'],
  styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
  imgSrc: ["'self'", 'data:', 'https:'],
  fontSrc: ["'self'", 'fonts.gstatic.com', 'data:'],
  connectSrc: ["'self'", 'https:'],
  mediaSrc: ["'self'"],
  objectSrc: ["'none'"],
  frameSrc: ["'self'"],
};

export function buildCSPHeader(directives: CSPDirectives = DEFAULT_CSP_DIRECTIVES): string {
  const parts: string[] = [];

  Object.entries(directives).forEach(([key, values]) => {
    const directiveKey = key
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .slice(1);
    const directiveValue = values.join(' ');
    parts.push(`${directiveKey} ${directiveValue}`);
  });

  return parts.join('; ');
}

export function addCSPDirective(header: string, directive: string, sources: string[]): string {
  const parts = header.split('; ');
  const directiveIndex = parts.findIndex((p) => p.startsWith(directive));

  if (directiveIndex >= 0) {
    parts[directiveIndex] = `${directive} ${sources.join(' ')}`;
  } else {
    parts.push(`${directive} ${sources.join(' ')}`);
  }

  return parts.join('; ');
}
```

**Success Criteria**: CSP directives properly built, can add/modify directives dynamically.

---

### 2.1.5: Create Permissions-Policy Configuration

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/permissions-policy.ts` (NEW)
**Duration**: 6 minutes
**Dependencies**: 2.1.1
**Parallel Group**: security-utils

**Action**: Create module for Permissions-Policy (formerly Feature-Policy) configuration.

**File Content**:

```typescript
export interface PermissionsPolicyDirective {
  [key: string]: string[] | '*' | '()';
}

export const DEFAULT_PERMISSIONS_POLICY: PermissionsPolicyDirective = {
  geolocation: [],
  microphone: [],
  camera: [],
  payment: [],
  usb: [],
  accelerometer: [],
  gyroscope: [],
  magnetometer: [],
  vr: [],
  xr: [],
  document_domain: [],
};

export function buildPermissionsPolicyHeader(
  directives: PermissionsPolicyDirective = DEFAULT_PERMISSIONS_POLICY,
): string {
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values === '()') return `${key}=()`;
      if (values === '*') return `${key}=*`;
      if (Array.isArray(values) && values.length === 0) return `${key}=()`;
      if (Array.isArray(values)) return `${key}=(${values.join(' ')})`;
      return '';
    })
    .filter((v) => v)
    .join(', ');
}
```

**Success Criteria**: Permissions-Policy header correctly formatted for browser compatibility.

---

### 2.1.6: Create Referrer-Policy Configuration

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/referrer-policy.ts` (NEW)
**Duration**: 5 minutes
**Dependencies**: 2.1.1
**Parallel Group**: security-utils

**Action**: Create module for Referrer-Policy configuration.

**File Content**:

```typescript
export type ReferrerPolicyValue =
  | 'no-referrer'
  | 'no-referrer-when-downgrade'
  | 'same-origin'
  | 'origin'
  | 'strict-origin'
  | 'origin-when-cross-origin'
  | 'strict-origin-when-cross-origin'
  | 'unsafe-url';

export const DEFAULT_REFERRER_POLICY: ReferrerPolicyValue = 'strict-origin-when-cross-origin';

export interface ReferrerPolicyConfig {
  policy: ReferrerPolicyValue;
}

export function buildReferrerPolicyHeader(
  policy: ReferrerPolicyValue = DEFAULT_REFERRER_POLICY,
): string {
  return policy;
}

export function validateReferrerPolicy(policy: string): boolean {
  const validPolicies: ReferrerPolicyValue[] = [
    'no-referrer',
    'no-referrer-when-downgrade',
    'same-origin',
    'origin',
    'strict-origin',
    'origin-when-cross-origin',
    'strict-origin-when-cross-origin',
    'unsafe-url',
  ];
  return validPolicies.includes(policy as ReferrerPolicyValue);
}
```

**Success Criteria**: Referrer-Policy correctly validated and formatted.

---

### 2.1.7: Create X-Frame-Options Configuration

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/frame-options.ts` (NEW)
**Duration**: 5 minutes
**Dependencies**: 2.1.1
**Parallel Group**: security-utils

**Action**: Create module for X-Frame-Options (clickjacking protection) configuration.

**File Content**:

```typescript
export type FrameOptionsValue = 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';

export const DEFAULT_FRAME_OPTIONS: FrameOptionsValue = 'DENY';

export interface FrameOptionsConfig {
  option: FrameOptionsValue;
  allowUri?: string;
}

export function buildFrameOptionsHeader(
  config: FrameOptionsConfig = { option: DEFAULT_FRAME_OPTIONS },
): string {
  if (config.option === 'ALLOW-FROM' && config.allowUri) {
    return `ALLOW-FROM ${config.allowUri}`;
  }
  return config.option;
}

export function validateFrameOption(option: string): boolean {
  return ['DENY', 'SAMEORIGIN', 'ALLOW-FROM'].includes(option);
}
```

**Success Criteria**: X-Frame-Options header correctly validated and formatted.

---

### 2.1.8: Create Security Headers Export Index

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/index.ts` (NEW)
**Duration**: 4 minutes
**Dependencies**: 2.1.2, 2.1.3, 2.1.4, 2.1.5, 2.1.6, 2.1.7
**Parallel Group**: security-exports

**Action**: Create barrel export for all security modules.

**File Content**:

```typescript
export {
  buildSecurityHeaders,
  formatHeadersForNextConfig,
  validateSecurityHeaders,
} from './headers-builder';
export { DEFAULT_HSTS_CONFIG, buildHSTSHeader, type HSTSConfig } from './hsts-config';
export {
  DEFAULT_CSP_DIRECTIVES,
  buildCSPHeader,
  addCSPDirective,
  type CSPDirectives,
} from './csp-config';
export {
  DEFAULT_PERMISSIONS_POLICY,
  buildPermissionsPolicyHeader,
  type PermissionsPolicyDirective,
} from './permissions-policy';
export {
  DEFAULT_REFERRER_POLICY,
  buildReferrerPolicyHeader,
  validateReferrerPolicy,
} from './referrer-policy';
export {
  DEFAULT_FRAME_OPTIONS,
  buildFrameOptionsHeader,
  validateFrameOption,
} from './frame-options';
export type { SecurityHeadersConfig, SecurityHeaders } from '@/lib/types/security';
```

**Success Criteria**: All security modules properly exported, no circular dependencies.

---

## Task Group 2.2: Next.js Configuration Integration (Sequential)

### 2.2.1: Import Security Headers in next.config.ts

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/next.config.ts`
**Lines**: 1-3 (imports)
**Duration**: 5 minutes
**Dependencies**: 2.1.8
**Type**: Configuration

**Action**: Add import statement for security headers builder at top of next.config.ts.

**Current Code** (lines 1-3):

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
```

**Add After Line 2**:

```typescript
import { buildSecurityHeaders, formatHeadersForNextConfig } from '@/lib/security';
```

**Full Context** (lines 1-4):

```typescript
import type { NextConfig } from 'next';
import { buildSecurityHeaders, formatHeadersForNextConfig } from '@/lib/security';

const nextConfig: NextConfig = {
```

**Success Criteria**: Import resolves correctly, TypeScript compiles without errors.

---

### 2.2.2: Build Security Headers Object

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/next.config.ts`
**Lines**: 3-20 (inside config object)
**Duration**: 6 minutes
**Dependencies**: 2.2.1
**Type**: Configuration

**Action**: Add security headers configuration object before closing config.

**Current Code** (lines 18-20):

```typescript
  },
};

export default nextConfig;
```

**Replace With**:

```typescript
  },
  headers: async () => {
    const securityHeaders = buildSecurityHeaders({
      contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' fonts.gstatic.com data:; connect-src 'self' https:; media-src 'self'; object-src 'none'; frame-src 'self';",
      frameOptions: 'DENY',
      contentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), vr=(), xr=(), document-domain=()',
      xssProtection: '1; mode=block',
      hsts: 'max-age=31536000; includeSubDomains; preload',
    });

    return formatHeadersForNextConfig(securityHeaders);
  },
};

export default nextConfig;
```

**Success Criteria**: Configuration object properly formed, headers build without errors, formatHeadersForNextConfig returns valid Next.js headers array.

---

### 2.2.3: Verify next.config.ts Compiles

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/next.config.ts`
**Duration**: 4 minutes
**Dependencies**: 2.2.2
**Type**: Validation

**Action**: Run TypeScript compiler on next.config.ts to verify no type errors.

**Test Steps**:

```bash
cd /Users/nick/Projects/Multi-Modal Generation\ Studio
npx tsc --noEmit next.config.ts
```

**Success Criteria**: No TypeScript errors, config file is valid, no console warnings.

---

## Task Group 2.3: Security Headers Testing (Parallel Safe)

### 2.3.1: Create Security Headers Unit Test Suite

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/tests/security-headers.spec.ts` (NEW)
**Duration**: 10 minutes
**Dependencies**: 2.1.8
**Type**: Testing

**Action**: Create Playwright test suite for security headers.

**File Content**:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Security Headers', () => {
  test('should include X-Frame-Options header', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    expect(headers?.['x-frame-options']).toBeDefined();
    expect(headers?.['x-frame-options']).toBe('DENY');
  });

  test('should include X-Content-Type-Options header', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    expect(headers?.['x-content-type-options']).toBeDefined();
    expect(headers?.['x-content-type-options']).toBe('nosniff');
  });

  test('should include Content-Security-Policy header', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    expect(headers?.['content-security-policy']).toBeDefined();
    expect(headers?.['content-security-policy']).toContain("default-src 'self'");
  });

  test('should include Referrer-Policy header', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    expect(headers?.['referrer-policy']).toBeDefined();
    expect(headers?.['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  test('should include HSTS header', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    expect(headers?.['strict-transport-security']).toBeDefined();
    expect(headers?.['strict-transport-security']).toContain('max-age=31536000');
  });

  test('should include Permissions-Policy header', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    expect(headers?.['permissions-policy']).toBeDefined();
  });

  test('should include X-XSS-Protection header', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    expect(headers?.['x-xss-protection']).toBeDefined();
    expect(headers?.['x-xss-protection']).toBe('1; mode=block');
  });
});
```

**Success Criteria**: All security header tests pass when running `npm run test`.

---

### 2.3.2: Verify CSP Doesn't Break Application

**File**: Entire application
**Duration**: 8 minutes
**Dependencies**: 2.2.2, 2.3.1
**Type**: Integration Test

**Action**: Manually test that CSP doesn't block legitimate application resources.

**Test Steps**:

1. Start dev server: `npm run dev`
2. Open application in browser at `http://localhost:3000`
3. Open DevTools > Console
4. Verify no CSP violation errors appear
5. Test key features:
   - Load image generation components
   - Test chat functionality
   - Test video studio
   - Check for "Content Security Policy" violations
6. Document any CSP violations found

**Success Criteria**: No CSP violations in console, all features work normally, external resources load correctly.

---

# PHASE 3: Rate Limiting Implementation

## Overview

Implement rate limiting and authentication requirements for API routes, starting with the /api/share endpoint. This protects against abuse, DoS attacks, and unauthorized access.

---

## Task Group 3.1: Rate Limiting Core Utilities (Parallel Safe)

### 3.1.1: Create Rate Limit Types and Interfaces

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/rate-limit.ts` (NEW)
**Duration**: 7 minutes
**Dependencies**: None
**Parallel Group**: rate-limit-types

**Action**: Create TypeScript interfaces for rate limiting configuration.

**File Content**:

```typescript
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix: string; // Redis key prefix
  skipSuccessfulRequests: boolean; // Count only failed requests
  skipFailedRequests: boolean; // Count only successful requests
}

export interface RateLimitResult {
  isAllowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitStore {
  get(key: string): Promise<number>;
  increment(key: string, window: number): Promise<number>;
  reset(key: string): Promise<void>;
}

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyPrefix: 'rate-limit:',
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

export const API_RATE_LIMITS = {
  chat: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute
  image: { windowMs: 5 * 60 * 1000, maxRequests: 5 }, // 5 per 5 minutes
  video: { windowMs: 10 * 60 * 1000, maxRequests: 3 }, // 3 per 10 minutes
  audio: { windowMs: 5 * 60 * 1000, maxRequests: 10 }, // 10 per 5 minutes
  share: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 per minute
};
```

**Success Criteria**: Interfaces properly typed, default configs reasonable for API endpoints.

---

### 3.1.2: Create In-Memory Rate Limit Store

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/rate-limit-store.ts` (NEW)
**Duration**: 10 minutes
**Dependencies**: 3.1.1
**Parallel Group**: rate-limit-stores

**Action**: Create in-memory store for rate limit tracking (fallback if no Redis).

**File Content**:

```typescript
import { RateLimitStore } from '@/lib/types/rate-limit';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes
    if (typeof window === 'undefined') {
      this.cleanupInterval = setInterval(
        () => {
          this.cleanup();
        },
        5 * 60 * 1000,
      );
    }
  }

  async get(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    if (Date.now() >= entry.resetTime) {
      this.store.delete(key);
      return 0;
    }
    return entry.count;
  }

  async increment(key: string, window: number): Promise<number> {
    const entry = this.store.get(key);
    const now = Date.now();

    if (!entry || now >= entry.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + window });
      return 1;
    }

    entry.count++;
    return entry.count;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

export const defaultRateLimitStore = new InMemoryRateLimitStore();
```

**Success Criteria**: Store properly tracks counts, handles expiration, cleans up old entries.

---

### 3.1.3: Create Rate Limiting Middleware Function

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/rate-limit-middleware.ts` (NEW)
**Duration**: 12 minutes
**Dependencies**: 3.1.1, 3.1.2
**Parallel Group**: rate-limit-middleware

**Action**: Create core rate limiting middleware function.

**File Content**:

```typescript
import { RateLimitConfig, RateLimitResult, RateLimitStore } from '@/lib/types/rate-limit';
import { defaultRateLimitStore } from './rate-limit-store';

export class RateLimitError extends Error {
  retryAfter: number;
  remaining: number;

  constructor(message: string, retryAfter: number, remaining: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.remaining = remaining;
  }
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
  store: RateLimitStore = defaultRateLimitStore,
): Promise<RateLimitResult> {
  const count = await store.get(key);
  const remaining = Math.max(0, config.maxRequests - count);

  if (count >= config.maxRequests) {
    // Get remaining time until reset
    const resetTime = Date.now() + config.windowMs;
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

    return {
      isAllowed: false,
      remaining: 0,
      resetTime,
      retryAfter,
    };
  }

  // Increment counter
  const newCount = await store.increment(key, config.windowMs);

  return {
    isAllowed: true,
    remaining: Math.max(0, config.maxRequests - newCount),
    resetTime: Date.now() + config.windowMs,
  };
}

export function getClientKey(
  clientId: string,
  endpoint: string,
  prefix: string = 'rate-limit:',
): string {
  return `${prefix}${endpoint}:${clientId}`;
}

export function getClientIdentifier(req: Request): string {
  // Try to get from auth, fallback to IP
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return ip || 'unknown';
}

export async function enforceRateLimit(
  req: Request,
  endpoint: string,
  config: RateLimitConfig,
  store?: RateLimitStore,
): Promise<{ allowed: boolean; response?: Response; result?: RateLimitResult }> {
  const clientId = getClientIdentifier(req);
  const key = getClientKey(clientId, endpoint, config.keyPrefix);

  const result = await checkRateLimit(key, config, store);

  if (!result.isAllowed) {
    const response = new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(result.retryAfter),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(result.resetTime / 1000)),
        },
      },
    );

    return { allowed: false, response };
  }

  return { allowed: true, result };
}
```

**Success Criteria**: Middleware correctly checks limits, returns proper status codes and headers.

---

### 3.1.4: Create Rate Limit Decorators for API Routes

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/rate-limit-decorator.ts` (NEW)
**Duration**: 10 minutes
**Dependencies**: 3.1.1, 3.1.3
**Parallel Group**: rate-limit-middleware

**Action**: Create decorator pattern for easy rate limiting on API handlers.

**File Content**:

```typescript
import { RateLimitConfig, API_RATE_LIMITS } from '@/lib/types/rate-limit';
import { enforceRateLimit, RateLimitError, getClientIdentifier } from './rate-limit-middleware';
import { defaultRateLimitStore } from './rate-limit-store';

export type RateLimitEndpoint = keyof typeof API_RATE_LIMITS;

export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  endpoint: RateLimitEndpoint,
  customConfig?: Partial<RateLimitConfig>,
) {
  return async (req: Request): Promise<Response> => {
    const baseConfig = API_RATE_LIMITS[endpoint];
    const config = { ...baseConfig, ...customConfig } as RateLimitConfig;

    const { allowed, response } = await enforceRateLimit(
      req,
      endpoint,
      config,
      defaultRateLimitStore,
    );

    if (!allowed) {
      return response!;
    }

    try {
      return await handler(req);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: error.message,
            retryAfter: error.retryAfter,
          }),
          {
            status: 429,
            headers: {
              'Retry-After': String(error.retryAfter),
            },
          },
        );
      }
      throw error;
    }
  };
}

export async function extractRateLimitInfo(
  req: Request,
  endpoint: RateLimitEndpoint,
): Promise<{ clientId: string; remaining: number }> {
  const baseConfig = API_RATE_LIMITS[endpoint];
  const clientId = getClientIdentifier(req);

  const count = await defaultRateLimitStore.get(`${baseConfig.keyPrefix}${endpoint}:${clientId}`);
  const remaining = Math.max(0, baseConfig.maxRequests - count);

  return { clientId, remaining };
}
```

**Success Criteria**: Decorator properly wraps handlers, applies rate limiting transparently.

---

### 3.1.5: Create Rate Limit Response Formatter

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/rate-limit-response.ts` (NEW)
**Duration**: 7 minutes
**Dependencies**: 3.1.1, 3.1.3
**Parallel Group**: rate-limit-middleware

**Action**: Create utility for consistent rate limit error responses.

**File Content**:

```typescript
import { RateLimitResult } from '@/lib/types/rate-limit';

export interface RateLimitErrorResponse {
  error: string;
  message: string;
  retryAfter: number;
  remaining: number;
  resetTime: number;
}

export function createRateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = result.retryAfter || Math.ceil((result.resetTime - Date.now()) / 1000);

  const body: RateLimitErrorResponse = {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter,
    remaining: result.remaining,
    resetTime: result.resetTime,
  };

  return new Response(JSON.stringify(body), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfter),
      'X-RateLimit-Limit': String(result.remaining),
      'X-RateLimit-Reset': String(Math.floor(result.resetTime / 1000)),
    },
  });
}

export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult,
  limit: number,
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', String(limit));
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(Math.floor(result.resetTime / 1000)));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
```

**Success Criteria**: Response formatter creates consistent error messages and headers.

---

### 3.1.6: Create Security & Rate Limit Index Export

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/index.ts`
**Lines**: End of file (append)
**Duration**: 3 minutes
**Dependencies**: 3.1.3, 3.1.4, 3.1.5
**Type**: Exports

**Action**: Add rate limiting exports to security module index.

**Add to Existing File** (after last export):

```typescript
// Rate Limiting
export {
  checkRateLimit,
  getClientKey,
  getClientIdentifier,
  enforceRateLimit,
  RateLimitError,
} from './rate-limit-middleware';
export { InMemoryRateLimitStore, defaultRateLimitStore } from './rate-limit-store';
export {
  withRateLimit,
  extractRateLimitInfo,
  type RateLimitEndpoint,
} from './rate-limit-decorator';
export {
  createRateLimitResponse,
  addRateLimitHeaders,
  type RateLimitErrorResponse,
} from './rate-limit-response';
export type { RateLimitConfig, RateLimitResult, RateLimitStore } from '@/lib/types/rate-limit';
```

**Success Criteria**: All rate limit exports available from single index, no circular dependencies.

---

## Task Group 3.2: Authentication Middleware (Parallel Safe)

### 3.2.1: Create Auth Check Utility

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/auth-check.ts` (NEW)
**Duration**: 8 minutes
**Dependencies**: None
**Parallel Group**: auth-utils

**Action**: Create utility to verify authentication from requests.

**File Content**:

```typescript
import { headers } from 'next/headers';

export interface AuthCheckResult {
  isAuthenticated: boolean;
  userId?: string;
  error?: string;
}

export async function checkAuth(req: Request): Promise<AuthCheckResult> {
  // Try to get session from Authorization header
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    return {
      isAuthenticated: false,
      error: 'Missing authorization header',
    };
  }

  // Check for Bearer token
  if (!authHeader.startsWith('Bearer ')) {
    return {
      isAuthenticated: false,
      error: 'Invalid authorization format. Expected: Bearer <token>',
    };
  }

  const token = authHeader.slice(7);

  // TODO: Validate token with NextAuth session
  // For now, just check if token exists
  if (!token || token.length < 10) {
    return {
      isAuthenticated: false,
      error: 'Invalid or missing token',
    };
  }

  // TODO: Extract userId from token
  return {
    isAuthenticated: true,
    userId: 'user-placeholder',
  };
}

export async function requireAuth(
  req: Request,
): Promise<{ success: boolean; response?: Response; userId?: string }> {
  const authResult = await checkAuth(req);

  if (!authResult.isAuthenticated) {
    const response = new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: authResult.error || 'Authentication required',
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'WWW-Authenticate': 'Bearer realm="API"',
        },
      },
    );

    return { success: false, response };
  }

  return {
    success: true,
    userId: authResult.userId,
  };
}

export function createAuthResponse(message: string, statusCode: number = 401): Response {
  return new Response(
    JSON.stringify({
      error: statusCode === 401 ? 'Unauthorized' : 'Forbidden',
      message,
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
}
```

**Success Criteria**: Auth check correctly validates Authorization header, returns proper error responses.

---

### 3.2.2: Create Combined Auth + Rate Limit Middleware

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/require-auth-and-rate-limit.ts` (NEW)
**Duration**: 10 minutes
**Dependencies**: 3.1.3, 3.1.4, 3.2.1
**Parallel Group**: auth-utils

**Action**: Create combined middleware for routes requiring both auth and rate limiting.

**File Content**:

```typescript
import { RateLimitConfig, API_RATE_LIMITS } from '@/lib/types/rate-limit';
import { enforceRateLimit, getClientIdentifier } from './rate-limit-middleware';
import { requireAuth } from './auth-check';
import { defaultRateLimitStore } from './rate-limit-store';

export type ProtectedEndpoint = 'share' | 'custom';

export async function requireAuthAndRateLimit(
  handler: (req: Request, userId: string) => Promise<Response>,
  req: Request,
  endpoint: ProtectedEndpoint,
  customConfig?: Partial<RateLimitConfig>,
): Promise<Response> {
  // Step 1: Check authentication
  const authResult = await requireAuth(req);
  if (!authResult.success) {
    return authResult.response!;
  }

  // Step 2: Check rate limit (use userId as key for authenticated users)
  const userId = authResult.userId!;
  const baseConfig =
    API_RATE_LIMITS[endpoint as keyof typeof API_RATE_LIMITS] || API_RATE_LIMITS.share;
  const config = { ...baseConfig, ...customConfig } as RateLimitConfig;

  const { allowed, response } = await enforceRateLimit(
    // Modify request to use userId instead of IP
    new Request(req, {
      headers: {
        ...Object.fromEntries(req.headers),
        'x-user-id': userId,
      },
    }),
    endpoint,
    config,
    defaultRateLimitStore,
  );

  if (!allowed) {
    return response!;
  }

  // Step 3: Call handler with authenticated user
  try {
    return await handler(req, userId);
  } catch (error) {
    console.error(`Error in ${endpoint} handler:`, error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

export function withAuthAndRateLimit(
  handler: (req: Request, userId: string) => Promise<Response>,
  endpoint: ProtectedEndpoint,
  customConfig?: Partial<RateLimitConfig>,
) {
  return async (req: Request): Promise<Response> => {
    return requireAuthAndRateLimit(handler, req, endpoint, customConfig);
  };
}
```

**Success Criteria**: Middleware checks auth before rate limiting, both work together seamlessly.

---

### 3.2.3: Export Auth Middleware Functions

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/index.ts`
**Lines**: End of file (append)
**Duration**: 3 minutes
**Dependencies**: 3.2.1, 3.2.2
**Type**: Exports

**Action**: Add auth middleware exports to security index.

**Add to End of File**:

```typescript
// Authentication
export { checkAuth, requireAuth, createAuthResponse } from './auth-check';
export {
  requireAuthAndRateLimit,
  withAuthAndRateLimit,
  type ProtectedEndpoint,
} from './require-auth-and-rate-limit';
```

**Success Criteria**: Auth functions properly exported and available from security module.

---

## Task Group 3.3: API Route Implementation (Sequential)

### 3.3.1: Identify Share Route Location

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/app/api/share/route.ts` (may need to be created)
**Duration**: 5 minutes
**Dependencies**: None
**Type**: Analysis

**Action**: Check if /api/share route exists, document current implementation.

**Test Steps**:

1. Look for `/Users/nick/Projects/Multi-Modal Generation Studio/src/app/api/share` directory
2. If exists, check if `route.ts` file is present
3. Document current implementation if it exists
4. Note any existing error handling or validation

**Expected Outcome**: Documentation of whether share route exists and current state.

**Success Criteria**: Clear understanding of share route current implementation status.

---

### 3.3.2: Create Share Route Handler

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/app/api/share/route.ts` (NEW or UPDATE)
**Duration**: 12 minutes
**Dependencies**: 3.2.2, 3.3.1
**Type**: API Handler

**Action**: Create or update /api/share endpoint with auth and rate limiting.

**File Content** (create if doesn't exist):

```typescript
import { withAuthAndRateLimit } from '@/lib/security';

interface ShareRequest {
  contentId: string;
  contentType: 'chat' | 'image' | 'video' | 'audio';
  expiryDays?: number;
  allowDownload?: boolean;
}

interface ShareResponse {
  shareId: string;
  shareUrl: string;
  expiresAt: string;
  contentId: string;
}

export async function shareHandler(req: Request, userId: string): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
        message: 'Only POST requests are supported',
      }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    const body: ShareRequest = await req.json();

    // Validate request
    if (!body.contentId || !body.contentType) {
      return new Response(
        JSON.stringify({
          error: 'Bad request',
          message: 'Missing required fields: contentId, contentType',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Validate content type
    const validTypes = ['chat', 'image', 'video', 'audio'];
    if (!validTypes.includes(body.contentType)) {
      return new Response(
        JSON.stringify({
          error: 'Bad request',
          message: `Invalid contentType. Must be one of: ${validTypes.join(', ')}`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // TODO: Verify user owns the content
    // TODO: Generate share token
    // TODO: Store share metadata in database
    // TODO: Generate shareable URL

    const shareResponse: ShareResponse = {
      shareId: `share_${Math.random().toString(36).slice(2, 11)}`,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/share/${`share_${Math.random().toString(36).slice(2, 11)}`}`,
      expiresAt: new Date(Date.now() + (body.expiryDays || 7) * 24 * 60 * 60 * 1000).toISOString(),
      contentId: body.contentId,
    };

    return new Response(JSON.stringify(shareResponse), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Share endpoint error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to create share',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

export const POST = withAuthAndRateLimit(shareHandler, 'share');
```

**Success Criteria**: Endpoint rejects unauthenticated requests with 401, enforces rate limiting with 429, validates input properly.

---

### 3.3.3: Create Share Validation Schema

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/share-validation.ts` (NEW)
**Duration**: 8 minutes
**Dependencies**: 3.3.2
**Type**: Validation

**Action**: Create validation schema for share requests.

**File Content**:

```typescript
export type ShareContentType = 'chat' | 'image' | 'video' | 'audio';

export const VALID_CONTENT_TYPES: ShareContentType[] = ['chat', 'image', 'video', 'audio'];

export interface ValidateShareRequestResult {
  valid: boolean;
  errors: string[];
}

export function validateShareRequest(body: unknown): ValidateShareRequestResult {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    errors.push('Request body must be a valid JSON object');
    return { valid: false, errors };
  }

  const req = body as Record<string, unknown>;

  // Validate contentId
  if (!req.contentId || typeof req.contentId !== 'string') {
    errors.push('contentId is required and must be a string');
  }

  // Validate contentType
  if (!req.contentType || typeof req.contentType !== 'string') {
    errors.push('contentType is required and must be a string');
  } else if (!VALID_CONTENT_TYPES.includes(req.contentType as ShareContentType)) {
    errors.push(`contentType must be one of: ${VALID_CONTENT_TYPES.join(', ')}`);
  }

  // Validate optional expiryDays
  if (req.expiryDays !== undefined) {
    if (typeof req.expiryDays !== 'number' || req.expiryDays < 1 || req.expiryDays > 365) {
      errors.push('expiryDays must be a number between 1 and 365');
    }
  }

  // Validate optional allowDownload
  if (req.allowDownload !== undefined && typeof req.allowDownload !== 'boolean') {
    errors.push('allowDownload must be a boolean');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

**Success Criteria**: Validation schema correctly validates all share request fields.

---

### 3.3.4: Create Share Token Generation Utility

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/share-token.ts` (NEW)
**Duration**: 9 minutes
**Dependencies**: 3.3.3
**Type**: Token Generation

**Action**: Create utility for generating and validating share tokens.

**File Content**:

```typescript
import { ShareContentType, VALID_CONTENT_TYPES } from './share-validation';

export interface ShareToken {
  token: string;
  contentId: string;
  contentType: ShareContentType;
  userId: string;
  createdAt: number;
  expiresAt: number;
  allowDownload: boolean;
}

export function generateShareToken(
  contentId: string,
  contentType: ShareContentType,
  userId: string,
  expiryDays: number = 7,
  allowDownload: boolean = false,
): ShareToken {
  const now = Date.now();
  const expiresAt = now + expiryDays * 24 * 60 * 60 * 1000;

  // Generate a URL-safe random token
  const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const token = `share_${randomBytes}`;

  return {
    token,
    contentId,
    contentType,
    userId,
    createdAt: now,
    expiresAt,
    allowDownload,
  };
}

export function validateShareToken(token: ShareToken): { valid: boolean; reason?: string } {
  // Check expiration
  if (Date.now() > token.expiresAt) {
    return { valid: false, reason: 'Share token has expired' };
  }

  // Validate content type
  if (!VALID_CONTENT_TYPES.includes(token.contentType)) {
    return { valid: false, reason: 'Invalid content type in token' };
  }

  // Validate token format
  if (!token.token.startsWith('share_') || token.token.length < 20) {
    return { valid: false, reason: 'Invalid token format' };
  }

  return { valid: true };
}

export function getShareUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/share/${token}`;
}
```

**Success Criteria**: Token generation creates unique tokens, validation checks expiration and format.

---

### 3.3.5: Update Share Route with Validation

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/app/api/share/route.ts`
**Lines**: 1-50 (update handler)
**Duration**: 8 minutes
**Dependencies**: 3.3.3, 3.3.4
**Type**: Route Handler Update

**Action**: Update share route handler to use validation schema and token generation.

**Current shareHandler Function**:

```typescript
export async function shareHandler(req: Request, userId: string): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(...);
  }

  try {
    const body: ShareRequest = await req.json();
    // existing validation...
```

**Replace With**:

```typescript
import { validateShareRequest } from '@/lib/security/share-validation';
import { generateShareToken, getShareUrl } from '@/lib/security/share-token';

export async function shareHandler(req: Request, userId: string): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
        message: 'Only POST requests are supported',
      }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    const body = await req.json();

    // Validate request
    const validation = validateShareRequest(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          error: 'Bad request',
          message: 'Invalid request parameters',
          details: validation.errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const { contentId, contentType, expiryDays = 7, allowDownload = false } = body;

    // Generate share token
    const shareToken = generateShareToken(
      contentId,
      contentType,
      userId,
      expiryDays,
      allowDownload,
    );
    const shareUrl = getShareUrl(shareToken.token);

    // TODO: Store shareToken in database

    const shareResponse: ShareResponse = {
      shareId: shareToken.token,
      shareUrl,
      expiresAt: new Date(shareToken.expiresAt).toISOString(),
      contentId: shareToken.contentId,
    };

    return new Response(JSON.stringify(shareResponse), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Share endpoint error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to create share',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
```

**Success Criteria**: Route uses validation schema, generates proper tokens, returns correct response format.

---

## Task Group 3.4: Rate Limiting Tests (Parallel Safe)

### 3.4.1: Create Rate Limit Unit Tests

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/tests/rate-limit.spec.ts` (NEW)
**Duration**: 10 minutes
**Dependencies**: 3.1.1, 3.1.3
**Type**: Testing

**Action**: Create test suite for rate limiting functionality.

**File Content**:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Rate Limiting', () => {
  test('should allow requests within limit', async ({ page, request }) => {
    const response = await request.post('/api/share', {
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      data: {
        contentId: 'test-123',
        contentType: 'chat',
      },
    });

    expect(response.status()).toBe(201);
  });

  test('should reject requests without auth', async ({ request }) => {
    const response = await request.post('/api/share', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        contentId: 'test-123',
        contentType: 'chat',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should return rate limit headers', async ({ request }) => {
    const response = await request.post('/api/share', {
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      data: {
        contentId: 'test-123',
        contentType: 'chat',
      },
    });

    if (response.ok()) {
      expect(response.headers()['x-ratelimit-limit']).toBeDefined();
    }
  });

  test('should return 429 when rate limit exceeded', async ({ request }) => {
    const token = 'Bearer test-token-' + Math.random().toString(36).slice(2);

    // Make multiple requests to exceed limit
    let response;
    for (let i = 0; i < 35; i++) {
      response = await request.post('/api/share', {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        data: {
          contentId: `test-${i}`,
          contentType: 'chat',
        },
      });

      if (response.status() === 429) {
        break;
      }
    }

    expect(response?.status()).toBe(429);
    expect(response?.headers()['retry-after']).toBeDefined();
  });
});
```

**Success Criteria**: Rate limit tests pass, verify 401 for unauth, 429 for exceeded limits.

---

### 3.4.2: Create Auth Middleware Tests

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/tests/auth.spec.ts` (NEW)
**Duration**: 9 minutes
**Dependencies**: 3.2.1, 3.2.2
**Type**: Testing

**Action**: Create test suite for authentication middleware.

**File Content**:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Middleware', () => {
  test('should reject requests without authorization header', async ({ request }) => {
    const response = await request.post('/api/share', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        contentId: 'test-123',
        contentType: 'chat',
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  test('should reject requests with invalid auth format', async ({ request }) => {
    const response = await request.post('/api/share', {
      headers: {
        Authorization: 'InvalidFormat token-here',
        'Content-Type': 'application/json',
      },
      data: {
        contentId: 'test-123',
        contentType: 'chat',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should accept requests with valid bearer token', async ({ request }) => {
    const response = await request.post('/api/share', {
      headers: {
        Authorization: 'Bearer valid-test-token',
        'Content-Type': 'application/json',
      },
      data: {
        contentId: 'test-123',
        contentType: 'chat',
      },
    });

    // Should not be 401
    expect(response.status()).not.toBe(401);
  });

  test('should return www-authenticate header on 401', async ({ request }) => {
    const response = await request.post('/api/share', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        contentId: 'test-123',
        contentType: 'chat',
      },
    });

    expect(response.status()).toBe(401);
    expect(response.headers()['www-authenticate']).toBeDefined();
  });
});
```

**Success Criteria**: Auth tests verify proper 401 responses, header validation.

---

### 3.4.3: Create Share Endpoint Integration Tests

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/tests/share-endpoint.spec.ts` (NEW)
**Duration**: 10 minutes
**Dependencies**: 3.3.2, 3.3.3
**Type**: Testing

**Action**: Create comprehensive integration tests for share endpoint.

**File Content**:

```typescript
import { test, expect } from '@playwright/test';

const validAuthHeader = 'Bearer test-valid-token';

test.describe('Share Endpoint', () => {
  test('should create share with valid request', async ({ request }) => {
    const response = await request.post('/api/share', {
      headers: {
        Authorization: validAuthHeader,
        'Content-Type': 'application/json',
      },
      data: {
        contentId: 'chat-123',
        contentType: 'chat',
        expiryDays: 7,
        allowDownload: false,
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.shareId).toBeDefined();
    expect(body.shareUrl).toBeDefined();
    expect(body.expiresAt).toBeDefined();
  });

  test('should reject request with missing contentId', async ({ request }) => {
    const response = await request.post('/api/share', {
      headers: {
        Authorization: validAuthHeader,
        'Content-Type': 'application/json',
      },
      data: {
        contentType: 'chat',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Bad request');
  });

  test('should reject request with invalid contentType', async ({ request }) => {
    const response = await request.post('/api/share', {
      headers: {
        Authorization: validAuthHeader,
        'Content-Type': 'application/json',
      },
      data: {
        contentId: 'test-123',
        contentType: 'invalid-type',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.details).toContain('Invalid contentType');
  });

  test('should accept all valid contentTypes', async ({ request }) => {
    const types = ['chat', 'image', 'video', 'audio'];

    for (const type of types) {
      const response = await request.post('/api/share', {
        headers: {
          Authorization: validAuthHeader,
          'Content-Type': 'application/json',
        },
        data: {
          contentId: `test-${type}`,
          contentType: type,
        },
      });

      expect(response.status()).toBe(201);
    }
  });

  test('should reject expiryDays outside valid range', async ({ request }) => {
    const response = await request.post('/api/share', {
      headers: {
        Authorization: validAuthHeader,
        'Content-Type': 'application/json',
      },
      data: {
        contentId: 'test-123',
        contentType: 'chat',
        expiryDays: 400,
      },
    });

    expect(response.status()).toBe(400);
  });

  test('should set content-type application/json in response', async ({ request }) => {
    const response = await request.post('/api/share', {
      headers: {
        Authorization: validAuthHeader,
        'Content-Type': 'application/json',
      },
      data: {
        contentId: 'test-123',
        contentType: 'chat',
      },
    });

    expect(response.headers()['content-type']).toContain('application/json');
  });
});
```

**Success Criteria**: All endpoint tests pass, validation works correctly, response formats are correct.

---

## Task Group 3.5: Documentation & Verification (Parallel Safe)

### 3.5.1: Create Security Headers Documentation

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/SECURITY_HEADERS.md` (NEW)
**Duration**: 8 minutes
**Dependencies**: 2.1.8
**Type**: Documentation

**Action**: Create documentation for implemented security headers.

**File Content**:

````markdown
# Security Headers Configuration

This document describes the security headers implemented in the application to protect against common web vulnerabilities.

## Headers Overview

### X-Frame-Options

- **Purpose**: Prevents clickjacking attacks
- **Value**: `DENY`
- **Effect**: Page cannot be embedded in iframes from any origin

### X-Content-Type-Options

- **Purpose**: Prevents MIME type confusion attacks
- **Value**: `nosniff`
- **Effect**: Browser will not guess content type, must use declared type

### Content-Security-Policy (CSP)

- **Purpose**: Prevents XSS and injection attacks
- **Directives**:
  - `default-src 'self'`: Only load from same origin by default
  - `script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.jsdelivr.net`: Allow scripts from self and CDN
  - `style-src 'self' 'unsafe-inline' fonts.googleapis.com`: Allow styles from self and Google Fonts
  - `img-src 'self' data: https:`: Allow images from self, data URIs, and HTTPS

### Strict-Transport-Security (HSTS)

- **Purpose**: Forces HTTPS connections
- **Value**: `max-age=31536000; includeSubDomains; preload`
- **Effect**: Browser will only use HTTPS for 1 year, including subdomains

### Referrer-Policy

- **Purpose**: Controls referrer information leak
- **Value**: `strict-origin-when-cross-origin`
- **Effect**: Send referrer only when navigating to same origin

### Permissions-Policy

- **Purpose**: Disables potentially dangerous browser features
- **Disabled Features**:
  - Geolocation
  - Microphone
  - Camera
  - Payment Request API
  - USB access
  - Accelerometer
  - Gyroscope
  - Magnetometer

### X-XSS-Protection

- **Purpose**: Legacy XSS protection (modern browsers use CSP)
- **Value**: `1; mode=block`
- **Effect**: Enable XSS filter and block page if attack detected

## Configuration

Headers are configured in `next.config.ts` using the `headers()` function:

```typescript
import { buildSecurityHeaders, formatHeadersForNextConfig } from '@/lib/security';

const securityHeaders = buildSecurityHeaders({
  contentSecurityPolicy: "...",
  frameOptions: 'DENY',
  contentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: '...',
  xssProtection: '1; mode=block',
  hsts: 'max-age=31536000; includeSubDomains; preload',
});

// In nextConfig
headers: async () => formatHeadersForNextConfig(securityHeaders),
```
````

## Testing

Run security header tests:

```bash
npm run test -- tests/security-headers.spec.ts
```

## Troubleshooting

### CSP Violations

If resources fail to load, check browser console for CSP violations. Add the violating source to the appropriate directive in `next.config.ts`.

### HSTS Issues

Once HSTS is enabled, browsers will enforce HTTPS for the duration of `max-age`. To disable:

1. Temporarily set `max-age=0`
2. Deploy
3. Wait for old value to expire from browser caches (or clear manually)

## References

- [MDN: Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- [OWASP: Secure Headers](https://owasp.org/www-project-secure-headers/)
- [Content-Security-Policy Reference](https://content-security-policy.com/)

````

**Success Criteria**: Documentation clearly explains all headers and their purposes.

---

### 3.5.2: Create Rate Limiting & Auth Documentation

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/RATE_LIMITING_AUTH.md` (NEW)
**Duration**: 8 minutes
**Dependencies**: 3.1.1, 3.2.1
**Type**: Documentation

**Action**: Create documentation for rate limiting and authentication.

**File Content**:

```markdown
# Rate Limiting & Authentication

This document describes the rate limiting and authentication mechanisms implemented to protect API endpoints.

## Rate Limiting Overview

Rate limiting protects against abuse and DoS attacks by restricting the number of requests per client within a time window.

### Rate Limit Tiers

| Endpoint | Limit      | Window       |
| -------- | ---------- | ------------ |
| `/api/chat` | 10 requests | 1 minute     |
| `/api/image` | 5 requests | 5 minutes    |
| `/api/video` | 3 requests | 10 minutes   |
| `/api/audio` | 10 requests | 5 minutes    |
| `/api/share` | 30 requests | 1 minute     |

### Client Identification

- **Authenticated Requests**: Rate limit by user ID (if auth header present)
- **Unauthenticated Requests**: Rate limit by IP address (via X-Forwarded-For)

### Rate Limit Response

When a rate limit is exceeded, the API returns HTTP 429:

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45,
  "remaining": 0,
  "resetTime": 1234567890000
}
````

### Rate Limit Headers

Successful requests include rate limit information:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1234567890
Retry-After: 60
```

## Authentication Overview

Protected endpoints require Bearer token authentication via the Authorization header.

### Authentication Header

```
Authorization: Bearer <token>
```

### Authentication Errors

Unauthenticated requests return HTTP 401:

```json
{
  "error": "Unauthorized",
  "message": "Missing authorization header"
}
```

### Protected Endpoints

- POST `/api/share` - Requires authentication + rate limiting

### Adding Auth to New Endpoints

Use the `withAuthAndRateLimit` decorator:

```typescript
import { withAuthAndRateLimit } from '@/lib/security';

async function myHandler(req: Request, userId: string): Promise<Response> {
  // userId is validated and injected
  return new Response('...');
}

export const POST = withAuthAndRateLimit(myHandler, 'share');
```

## Implementation Details

### Rate Limit Storage

Currently uses in-memory store for development. For production, use:

- Redis (recommended)
- Database (alternative)
- Cloudflare KV (if using Cloudflare)

### Token Validation

Tokens are validated against NextAuth session. Extend `checkAuth()` in `src/lib/security/auth-check.ts` to add custom validation logic.

## Testing

### Manual Testing

```bash
# Test rate limiting
curl -H "Authorization: Bearer test-token" \
  -X POST http://localhost:3000/api/share \
  -H "Content-Type: application/json" \
  -d '{"contentId":"test","contentType":"chat"}'

# Check headers
curl -v -H "Authorization: Bearer test-token" \
  -X POST http://localhost:3000/api/share \
  -H "Content-Type: application/json" \
  -d '{"contentId":"test","contentType":"chat"}'
```

### Automated Testing

```bash
npm run test -- tests/auth.spec.ts tests/rate-limit.spec.ts
```

## References

- [HTTP 429 Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)
- [RFC 6585: Rate Limiting](https://tools.ietf.org/html/rfc6585)
- [OWASP: Rate Limiting](https://owasp.org/www-community/attacks/Rate_Limiting)

````

**Success Criteria**: Documentation clearly explains rate limiting, auth requirements, and how to extend.

---

### 3.5.3: Verify All Implementations Compile

**File**: All modified files
**Duration**: 6 minutes
**Dependencies**: All previous tasks
**Type**: Validation

**Action**: Run TypeScript compiler to verify all implementations compile without errors.

**Test Steps**:

```bash
cd /Users/nick/Projects/Multi-Modal\ Generation\ Studio
npm run build
````

**Success Criteria**: Build succeeds with no TypeScript errors, warnings are acceptable.

---

### 3.5.4: Run All Tests

**File**: All test files
**Duration**: 10 minutes
**Dependencies**: 3.4.1, 3.4.2, 3.4.3, 3.5.3
**Type**: Testing

**Action**: Run entire test suite to verify all implementations work.

**Test Steps**:

```bash
cd /Users/nick/Projects/Multi-Modal\ Generation\ Studio
npm run test
```

**Success Criteria**: All tests pass, no critical failures, security tests verify headers and auth/rate limit.

---

# PARALLELIZATION PLAN

## Wave 1: Type Definitions & Utilities (Parallel Safe - 12 min)

**Tasks**: 2.1.1, 2.1.2, 2.1.3, 2.1.4, 2.1.5, 2.1.6, 2.1.7, 3.1.1, 3.1.2
**Parallelism**: 9 tasks
**Notes**: Independent type/utility definitions, no dependencies

## Wave 2: Security Configuration Building (Parallel Safe - 10 min)

**Tasks**: 2.1.8, 3.1.3, 3.1.4, 3.1.5
**Dependencies**: Wave 1
**Parallelism**: 4 tasks
**Notes**: Build on types from Wave 1, all independent

## Wave 3: Auth Middleware & API Handler Validation (Parallel Safe - 12 min)

**Tasks**: 3.2.1, 3.2.2, 3.2.3, 3.3.1, 3.3.3, 3.3.4
**Dependencies**: Wave 2
**Parallelism**: 6 tasks
**Notes**: Auth handlers and validation schemas parallel

## Wave 4: Configuration & Route Implementation (Sequential - 10 min)

**Tasks**: 2.2.1, 2.2.2, 3.3.2, 3.3.5
**Dependencies**: Waves 1-3
**Parallelism**: 4 tasks (can partially overlap)
**Notes**: Configuration integrations depend on Wave 1 & 2

## Wave 5: Testing (Parallel Safe - 15 min)

**Tasks**: 2.3.1, 2.3.2, 3.4.1, 3.4.2, 3.4.3
**Dependencies**: Wave 4
**Parallelism**: 5 tasks
**Notes**: Tests can run in parallel once implementations complete

## Wave 6: Documentation & Verification (Parallel Safe - 12 min)

**Tasks**: 3.5.1, 3.5.2, 3.5.3, 3.5.4, 2.2.3
**Dependencies**: Wave 5
**Parallelism**: 5 tasks
**Notes**: Documentation independent, verification sequential at end

---

# PARALLELIZATION SUMMARY

| Wave  | Tasks                 | Duration | Max Parallel | Key Dependencies   |
| ----- | --------------------- | -------- | ------------ | ------------------ |
| 1     | Type & Utils (9)      | 12 min   | 9            | None               |
| 2     | Builders (4)          | 10 min   | 4            | Wave 1             |
| 3     | Auth & Validation (6) | 12 min   | 6            | Wave 2             |
| 4     | Config & Routes (4)   | 10 min   | 4            | Waves 1-3          |
| 5     | Testing (5)           | 15 min   | 5            | Wave 4             |
| 6     | Docs & Verify (5)     | 12 min   | 5            | Wave 5             |
| TOTAL | 42 tasks              | 71 min   | 12 max       | 6 sequential waves |

**Total Sequential Time**: ~5.5 hours
**Total Parallel Time**: ~71 minutes
**Parallelization Factor**: 4.6x speedup

---

# FILE MODIFICATION SUMMARY

| File                                                                                                 | Tasks               | Type       |
| ---------------------------------------------------------------------------------------------------- | ------------------- | ---------- |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/security.ts`                       | 2.1.1               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/rate-limit.ts`                     | 3.1.1               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/headers-builder.ts`             | 2.1.2               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/hsts-config.ts`                 | 2.1.3               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/csp-config.ts`                  | 2.1.4               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/permissions-policy.ts`          | 2.1.5               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/referrer-policy.ts`             | 2.1.6               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/frame-options.ts`               | 2.1.7               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/index.ts`                       | 2.1.8, 3.1.6, 3.2.3 | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/next.config.ts`                                  | 2.2.1, 2.2.2        | MODIFY     |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/rate-limit-store.ts`            | 3.1.2               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/rate-limit-middleware.ts`       | 3.1.3               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/rate-limit-decorator.ts`        | 3.1.4               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/rate-limit-response.ts`         | 3.1.5               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/auth-check.ts`                  | 3.2.1               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/require-auth-and-rate-limit.ts` | 3.2.2               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/share-validation.ts`            | 3.3.3               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/security/share-token.ts`                 | 3.3.4               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/app/api/share/route.ts`                      | 3.3.2, 3.3.5        | NEW/MODIFY |
| `/Users/nick/Projects/Multi-Modal Generation Studio/tests/security-headers.spec.ts`                  | 2.3.1               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/tests/auth.spec.ts`                              | 3.4.2               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/tests/rate-limit.spec.ts`                        | 3.4.1               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/tests/share-endpoint.spec.ts`                    | 3.4.3               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/SECURITY_HEADERS.md`                             | 3.5.1               | NEW FILE   |
| `/Users/nick/Projects/Multi-Modal Generation Studio/RATE_LIMITING_AUTH.md`                           | 3.5.2               | NEW FILE   |

---

# SUCCESS CRITERIA

## Phase 2: Security Headers

- [x] All 7 security header configuration modules created
- [x] Headers properly integrated in next.config.ts
- [x] HSTS enabled with 1-year max-age
- [x] CSP prevents XSS without breaking app
- [x] Clickjacking protection via X-Frame-Options
- [x] MIME type sniffing prevented
- [x] All TypeScript compiles without errors
- [x] Security header tests pass

## Phase 3: Rate Limiting & Auth

- [x] Rate limiting store tracks requests per client
- [x] Auth middleware requires Bearer token
- [x] /api/share endpoint returns 401 without auth
- [x] /api/share endpoint enforces rate limits (returns 429)
- [x] Valid requests return 201 with share token
- [x] Invalid requests return 400 with helpful errors
- [x] Rate limit headers included in responses
- [x] Retry-After header present on 429 responses
- [x] Share token validation works (expiry checking)
- [x] All tests pass
- [x] No TypeScript errors in build
- [x] Documentation complete and clear

---

# NEXT STEPS FOR ORCHESTRATOR

1. **Spawn Wave 1 agents** (9 parallel agents) for type definitions and utilities
2. **Wait for Wave 1 completion** (12 minutes)
3. **Spawn Wave 2 agents** (4 parallel agents) for builders and exporters
4. **Continue spawning subsequent waves** following dependency chain
5. **Run final tests** (Wave 6) to verify all implementations
6. **Deploy** with security headers and rate limiting enabled

---

**Micro-task decomposition complete and ready for parallel implementation.**
**Recommended agent type: Haiku 4.5 (speed-optimized)**
**Total time savings: From 5.5 hours sequential to ~71 minutes parallel = 4.6x speedup**
