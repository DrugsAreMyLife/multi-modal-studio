# Production Readiness Roadmap

**Multi-Modal Generation Studio**
**Date:** 2026-01-20
**Status:** Pre-Production Audit

---

## Executive Summary

### Current State: 🟡 **NEAR-READY** (85% Complete)

- ✅ TypeScript compilation clean (97 errors resolved)
- ✅ Critical security bugs fixed (3/3)
- ✅ Integration tests passing (36/36)
- ✅ Strong security foundation in place
- 🟡 Security vulnerability: Cookie package (low severity)
- 🔴 Test coverage critically low (1 test file)
- 🟡 Missing comprehensive input validation audit
- 🟡 Production environment configuration needed

### Time to Production: **2-3 weeks** (with recommendations)

---

## Priority Matrix

| Priority  | Category       | Items    | Blocker?    |
| --------- | -------------- | -------- | ----------- |
| 🔴 **P0** | Security       | 5 items  | YES         |
| 🟠 **P1** | Functionality  | 8 items  | Partial     |
| 🟡 **P2** | Testing        | 6 items  | Recommended |
| 🟢 **P3** | Novel Features | 10 items | NO          |

---

# 🔴 P0: CRITICAL SECURITY (Must Fix Before Production)

## 1. Security Vulnerability Remediation

### 1.1 Cookie Package Vulnerability ⚠️

**Issue:** Cookie package <0.7.0 has out-of-bounds character vulnerability
**Impact:** Low severity, but exploitable in edge cases
**Fix:**

```bash
npm audit fix --force
# Will upgrade next-auth to 4.24.7 (breaking change)
# Manual testing required after upgrade
```

**Testing Required:**

- [ ] Verify OAuth login flows (Google, GitHub)
- [ ] Verify session persistence
- [ ] Check for breaking changes in auth callbacks

**Timeline:** 1 day

---

### 1.2 Comprehensive API Route Security Audit 🔒

**Current State:**

- ✅ Strong auth middleware exists ([src/lib/middleware/auth.ts](src/lib/middleware/auth.ts))
- ✅ Rate limiting implemented with Redis
- ⚠️ Not all routes verified to use middleware

**Action Items:**

#### 1.2a. Verify Auth Protection on All Routes

Audit all 35 API routes to ensure they use `requireAuth()` or `requireAuthAndRateLimit()`:

**Routes to Verify:**

```typescript
// Generation endpoints (MUST have rate limiting)
- /api/generate/image/route.ts ✅ (verified)
- /api/generate/video/route.ts
- /api/generate/audio/route.ts
- /api/comfyui/execute/route.ts
- /api/comfyui/generate-workflow/route.ts ✅ (has validation)

// Chat endpoints (MUST have rate limiting)
- /api/chat/route.ts
- /api/analysis/route.ts
- /api/transcribe/route.ts

// Training endpoints (MUST have auth)
- /api/training/submit/route.ts
- /api/training/jobs/[id]/cancel/route.ts
- /api/training/jobs/[id]/samples/route.ts
- /api/datasets/route.ts
- /api/datasets/upload/route.ts

// Public endpoints (NO auth required, but need CSRF protection)
- /api/health/route.ts ✅ (public)
- /api/webhooks/*/route.ts (verify webhook signature validation)
- /api/share/route.ts (verify slug-based access only)

// Admin-only endpoints (NEED admin role check)
- /api/analytics/route.ts
- /api/publish/route.ts
```

**Verification Script:**

```bash
# Check which routes are missing auth middleware
grep -L "requireAuth" src/app/api/**/route.ts | \
  grep -v "health" | \
  grep -v "webhooks" | \
  grep -v "share"
```

**Timeline:** 2 days

---

#### 1.2b. Input Validation Audit

**Current State:**

- ✅ ComfyUI route has DoS protection ([src/app/api/comfyui/generate-workflow/route.ts](src/app/api/comfyui/generate-workflow/route.ts))
- ⚠️ Other routes need validation audit

**Validation Requirements:**

1. **Prompt Injection Prevention**
   - Max prompt length: 2000 characters
   - Sanitize system prompts in chat endpoints
   - Block SQL/NoSQL injection patterns

2. **File Upload Validation** ([src/app/api/upload/route.ts](src/app/api/upload/route.ts))
   - Max file size: 50MB
   - Allowed MIME types: whitelist only
   - Virus scanning (ClamAV or cloud service)
   - Image validation: check for embedded payloads

3. **URL Validation** (for img2img, video sources)
   - Whitelist allowed domains
   - SSRF protection (no internal IPs)
   - Max redirect depth: 3

4. **Array/Object Size Limits**
   - Max array length: 100 items
   - Max object depth: 5 levels
   - Max JSON payload: 1MB

**Implementation:**

```typescript
// Create shared validation utilities
// src/lib/validation/input-validation.ts

export const ValidationRules = {
  prompt: { maxLength: 2000, pattern: /^[^<>{}]*$/ },
  conversationArray: { maxLength: 100 },
  messageContent: { maxLength: 5000 },
  fileSize: { max: 50 * 1024 * 1024 }, // 50MB
  allowedImageTypes: ['image/png', 'image/jpeg', 'image/webp'],
  allowedVideoTypes: ['video/mp4', 'video/webm'],
};

export function validatePrompt(prompt: string): { valid: boolean; error?: string } {
  if (prompt.length > ValidationRules.prompt.maxLength) {
    return { valid: false, error: `Prompt exceeds ${ValidationRules.prompt.maxLength} characters` };
  }
  if (!ValidationRules.prompt.pattern.test(prompt)) {
    return { valid: false, error: 'Prompt contains invalid characters' };
  }
  return { valid: true };
}
```

**Timeline:** 3 days

---

#### 1.2c. Webhook Signature Validation

**Routes Affected:**

- [src/app/api/webhooks/replicate/route.ts](src/app/api/webhooks/replicate/route.ts)
- [src/app/api/webhooks/video/route.ts](src/app/api/webhooks/video/route.ts)

**Requirements:**

- Verify HMAC signatures for all webhook providers
- Implement replay attack prevention (timestamp validation)
- Rate limit webhook endpoints

**Implementation:**

```typescript
// src/lib/webhooks/validation.ts

import crypto from 'crypto';

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const expectedSignature = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

export function validateWebhookTimestamp(timestamp: number): boolean {
  const now = Date.now() / 1000;
  const diff = Math.abs(now - timestamp);
  return diff < 300; // 5 minutes tolerance
}
```

**Timeline:** 2 days

---

### 1.3 Secrets Management Audit 🔐

**Current State:**

- ✅ Good .env.example file
- ⚠️ Production secrets need secure storage

**Action Items:**

1. **Environment Variable Audit**
   - [ ] Verify NEXTAUTH_SECRET is generated with `openssl rand -base64 32`
   - [ ] Ensure all webhook secrets are unique and random
   - [ ] Rotate all API keys before production launch
   - [ ] Never commit .env files (verify .gitignore)

2. **Production Secrets Storage**
   - Use Vercel Environment Variables (encrypted at rest)
   - OR use AWS Secrets Manager / GCP Secret Manager
   - Implement secret rotation policy (every 90 days)

3. **API Key Handling**
   - [ ] Support user-provided API keys (stored encrypted)
   - [ ] Implement key encryption at rest (AES-256)
   - [ ] Never log API keys (audit logging code)

**Timeline:** 1 day

---

### 1.4 CSRF Protection Verification 🛡️

**Current State:**

- ✅ NextAuth handles CSRF for auth routes
- ⚠️ API routes need CSRF verification for state-changing operations

**Requirements:**

- All POST/PUT/DELETE endpoints must verify CSRF token
- NextAuth session cookies have SameSite=Lax by default ✅
- Double-submit cookie pattern for AJAX requests

**Implementation:**

```typescript
// src/lib/middleware/csrf.ts

export async function verifyCsrfToken(req: NextRequest): Promise<boolean> {
  const csrfTokenFromHeader = req.headers.get('x-csrf-token');
  const csrfTokenFromCookie = req.cookies.get('csrf-token')?.value;

  if (!csrfTokenFromHeader || !csrfTokenFromCookie) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(csrfTokenFromHeader), Buffer.from(csrfTokenFromCookie));
}
```

**Timeline:** 1 day

---

### 1.5 Database Security Hardening 🗄️

**Current State:**

- ✅ Row Level Security (RLS) policies implemented
- ✅ Schema includes proper indexes
- ⚠️ Need to verify policy completeness

**Action Items:**

1. **RLS Policy Audit**
   - [ ] Test all policies with integration tests
   - [ ] Verify CASCADE deletes don't bypass RLS
   - [ ] Test anonymous access to shared content
   - [ ] Verify training job isolation between users

2. **SQL Injection Prevention**
   - ✅ Using Supabase client (parameterized queries) ✅
   - [ ] Audit raw SQL queries (should be none)
   - [ ] Verify all user input is sanitized

3. **Database Connection Security**
   - [ ] Use connection pooling (Supabase handles this)
   - [ ] Set connection timeout: 30s
   - [ ] Enable SSL/TLS for production connections

**RLS Policy Tests:**

```typescript
// tests/integration/rls-complete-audit.test.ts

describe('RLS Security Boundary Tests', () => {
  it("User A cannot access User B's conversations", async () => {
    // Test isolation
  });

  it('Anonymous users cannot access private generations', async () => {
    // Test public/private boundary
  });

  it('Deleting user cascades to all owned data', async () => {
    // Test data cleanup
  });
});
```

**Timeline:** 2 days

---

## P0 Security Timeline Summary

- Cookie vulnerability fix: 1 day
- API route security audit: 2 days
- Input validation implementation: 3 days
- Webhook security: 2 days
- Secrets management: 1 day
- CSRF protection: 1 day
- Database security audit: 2 days

**Total P0: 12 days (~2.5 weeks)**

---

# 🟠 P1: CRITICAL FUNCTIONALITY (Required for Launch)

## 2. Production Environment Configuration

### 2.1 Environment Setup ⚙️

**Production Checklist:**

1. **Supabase Production Instance**
   - [ ] Create production project on Supabase
   - [ ] Run all migrations: [supabase/migrations/](supabase/migrations/)
   - [ ] Configure backups (daily automatic)
   - [ ] Set up monitoring and alerts
   - [ ] Update connection URLs in .env

2. **Redis Production Setup**
   - [ ] Deploy Upstash Redis (free tier: 10K requests/day)
   - [ ] Configure UPSTASH_REDIS_REST_URL and TOKEN
   - [ ] Test rate limiting in production environment
   - [ ] Set up monitoring for Redis hit rate

3. **NextAuth Production Config**
   - [ ] Set NEXTAUTH_URL to production domain
   - [ ] Configure OAuth redirect URIs in Google/GitHub consoles
   - [ ] Generate new NEXTAUTH_SECRET for production
   - [ ] Test OAuth flows in production

4. **AI Provider API Keys**
   - [ ] Obtain production API keys for all providers
   - [ ] Set up billing alerts for each provider
   - [ ] Configure rate limits per provider
   - [ ] Test failover scenarios

**Timeline:** 2 days

---

### 2.2 Error Handling & Recovery 🚨

**Current State:**

- ⚠️ Basic error handling exists but inconsistent

**Requirements:**

1. **Global Error Boundary**
   - ✅ Exists: [src/components/ui/error-boundary.tsx](src/components/ui/error-boundary.tsx)
   - [ ] Add error reporting (Sentry integration)
   - [ ] User-friendly error messages
   - [ ] Retry mechanisms for transient failures

2. **API Error Standardization**

```typescript
// src/lib/errors/api-errors.ts

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public retryable: boolean = false,
  ) {
    super(message);
  }
}

export const ErrorCodes = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_INPUT: 'INVALID_INPUT',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

// Standardized error responses
export function formatErrorResponse(error: ApiError) {
  return {
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      retryable: error.retryable,
    },
  };
}
```

3. **Graceful Degradation**
   - [ ] Fallback models when primary fails
   - [ ] Local Redis fallback (allow without rate limiting in dev)
   - [ ] Offline queue for failed generations
   - [ ] Circuit breaker pattern for unstable providers

**Timeline:** 3 days

---

### 2.3 Monitoring & Observability 📊

**Requirements:**

1. **Error Tracking**
   - [ ] Integrate Sentry (or Highlight.io for open-source alternative)
   - [ ] Track error rates by endpoint
   - [ ] Alert on error spikes (>10 errors/min)
   - [ ] Include user context (anonymized user ID)

2. **Performance Monitoring**
   - [ ] Track API response times
   - [ ] Monitor database query performance
   - [ ] Track provider API latency
   - [ ] Alert on P95 latency >2s

3. **Business Metrics**
   - [ ] Track generations per user
   - [ ] Track API costs per provider
   - [ ] Monitor rate limit hits
   - [ ] Track user conversion funnel

**Implementation:**

```typescript
// src/lib/monitoring/sentry.ts

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // Sample 10% for performance
  beforeSend(event, hint) {
    // Scrub sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  },
});

// Track custom metrics
export function trackGeneration(provider: string, duration: number, success: boolean) {
  Sentry.metrics.distribution('generation.duration', duration, {
    tags: { provider, success: success.toString() },
  });
}
```

**Timeline:** 2 days

---

### 2.4 Database Migrations & Seed Data 🌱

**Action Items:**

1. **Migration System**
   - ✅ Migrations exist in [supabase/migrations/](supabase/migrations/)
   - [ ] Create migration rollback scripts
   - [ ] Test migrations on staging first
   - [ ] Document migration order

2. **Seed Data for Production**
   - [ ] Create example prompts library
   - [ ] Populate model registry
   - [ ] Add default user settings templates
   - [ ] Create system user for background jobs

**Timeline:** 1 day

---

### 2.5 Performance Optimization 🚀

**Action Items:**

1. **Next.js Bundle Optimization**

```bash
# Analyze bundle size
npx @next/bundle-analyzer
```

- [ ] Implement code splitting for studio components
- [ ] Lazy load heavy dependencies (video players, audio workstation)
- [ ] Optimize images with next/image
- [ ] Use dynamic imports for AI provider SDKs

2. **Database Query Optimization**
   - [ ] Add indexes on frequently queried columns (verify with `EXPLAIN ANALYZE`)
   - [ ] Implement connection pooling
   - [ ] Add query result caching (Redis)
   - [ ] Use Supabase Edge Functions for heavy computations

3. **API Response Caching**

```typescript
// Cache expensive operations
import { redis } from '@/lib/redis';

export async function getCachedModelList(provider: string) {
  const cacheKey = `models:${provider}`;
  const cached = await redis?.get(cacheKey);

  if (cached) {
    return JSON.parse(cached as string);
  }

  const models = await fetchModelsFromProvider(provider);
  await redis?.setex(cacheKey, 3600, JSON.stringify(models)); // 1 hour
  return models;
}
```

**Timeline:** 3 days

---

### 2.6 Deployment Pipeline 🔄

**CI/CD Setup:**

1. **GitHub Actions Workflow**

```yaml
# .github/workflows/deploy.yml

name: Production Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test
      - run: npm run type-check
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: vercel/actions/deploy@v2
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

2. **Staging Environment**
   - [ ] Deploy to staging.yourdomain.com
   - [ ] Run E2E tests on staging
   - [ ] Smoke tests before production
   - [ ] Blue-green deployment for zero downtime

**Timeline:** 2 days

---

### 2.7 User Settings & Preferences 💾

**Current State:**

- ⚠️ Settings stored in database but no UI to manage them

**Requirements:**

1. **User Preferences**
   - [ ] Default model selections per studio
   - [ ] API key management (encrypted storage)
   - [ ] Usage limits and budgets
   - [ ] Notification preferences

2. **Persistence**
   - [ ] Sync settings to Supabase ([src/lib/db/schema.sql](src/lib/db/schema.sql) - `users.settings_json`)
   - [ ] Local caching with Zustand persist middleware
   - [ ] Conflict resolution for multi-device usage

**Timeline:** 2 days

---

### 2.8 Documentation 📚

**Required Documentation:**

1. **User Documentation**
   - [ ] Getting Started guide
   - [ ] Studio-specific tutorials (Image, Video, Audio, Training)
   - [ ] API key setup instructions
   - [ ] Troubleshooting guide
   - [ ] FAQ

2. **Developer Documentation**
   - [ ] API route documentation (OpenAPI spec)
   - [ ] Database schema documentation
   - [ ] Webhook integration guide
   - [ ] Local development setup
   - [ ] Contributing guide

3. **Admin Documentation**
   - [ ] Deployment guide
   - [ ] Environment variable reference (expand [.env.example](.env.example))
   - [ ] Monitoring and alerting setup
   - [ ] Incident response playbook
   - [ ] Backup and recovery procedures

**Timeline:** 3 days

---

## P1 Functionality Timeline Summary

- Production environment setup: 2 days
- Error handling: 3 days
- Monitoring setup: 2 days
- Database migrations: 1 day
- Performance optimization: 3 days
- CI/CD pipeline: 2 days
- User settings: 2 days
- Documentation: 3 days

**Total P1: 18 days (~3.5 weeks)**

---

# 🟡 P2: TESTING & QUALITY (Strongly Recommended)

## 3. Comprehensive Test Coverage

**Current State:**

- 🔴 Only 1 test file found
- ✅ 36 integration tests passing (RLS policies)
- ❌ No E2E tests
- ❌ No unit tests for components
- ❌ No API route tests

**Target Coverage:**

- Unit tests: 80% coverage
- Integration tests: All critical paths
- E2E tests: User journeys

---

### 3.1 Unit Tests 🧪

**Priority Components to Test:**

1. **Hooks** (High Value)
   - [src/lib/hooks/useChatWithModel.ts](src/lib/hooks/useChatWithModel.ts)
   - [src/lib/hooks/useSampleImages.ts](src/lib/hooks/useSampleImages.ts) ✅ (has fix)
   - [src/lib/hooks/useVideoGeneration.ts](src/lib/hooks/useVideoGeneration.ts)
   - [src/lib/hooks/useVoiceInput.ts](src/lib/hooks/useVoiceInput.ts)

2. **Validation Logic**
   - Input sanitization functions
   - Prompt validation
   - File upload validation

3. **Utility Functions**
   - [src/lib/utils.ts](src/lib/utils.ts)
   - [src/lib/file-utils.ts](src/lib/file-utils.ts)
   - [src/lib/utils/cost-estimation.ts](src/lib/utils/cost-estimation.ts)

**Testing Framework:**

```typescript
// vitest.config.ts (faster than Jest)

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
});
```

**Timeline:** 5 days

---

### 3.2 Integration Tests 🔗

**Priority API Routes to Test:**

1. **Generation Endpoints**
   - POST /api/generate/image
   - POST /api/generate/video
   - POST /api/generate/audio
   - POST /api/comfyui/execute

2. **Auth Flow**
   - OAuth login/logout
   - Session persistence
   - Token refresh

3. **Webhook Processing**
   - Replicate webhook signature validation
   - Video webhook processing
   - Job status updates

**Example Integration Test:**

```typescript
// tests/integration/api/generate-image.test.ts

import { describe, it, expect, beforeAll } from 'vitest';
import { createMocks } from 'node-mocks-http';

describe('POST /api/generate/image', () => {
  it('requires authentication', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { prompt: 'test', provider: 'openai' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });

  it('enforces rate limiting', async () => {
    // Make 11 requests (limit is 10/minute)
    for (let i = 0; i < 11; i++) {
      await makeAuthenticatedRequest();
    }

    expect(lastResponse.status).toBe(429);
  });
});
```

**Timeline:** 4 days

---

### 3.3 E2E Tests (Playwright) 🎭

**Critical User Journeys:**

1. **Sign Up & Onboarding**
   - OAuth sign-in flow
   - First-time user experience
   - API key setup

2. **Image Generation Flow**
   - Navigate to Image Studio
   - Enter prompt
   - Generate image
   - View result
   - Download/share

3. **Training Flow**
   - Create dataset
   - Upload images
   - Configure training job
   - Monitor progress
   - Use trained model

4. **Multi-Modal Workflow**
   - Generate image
   - Use image in video generation
   - Add audio to video
   - Export final result

**Example E2E Test:**

```typescript
// tests/e2e/image-generation.spec.ts

import { test, expect } from '@playwright/test';

test('user can generate an image', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.click('text=Sign in with Google');
  await authenticateWithGoogle(page);

  // Navigate to Image Studio
  await page.click('text=Image Studio');
  await expect(page).toHaveURL('/image-studio');

  // Generate image
  await page.fill('[placeholder="Describe the image..."]', 'A sunset over mountains');
  await page.click('button:has-text("Generate")');

  // Wait for result
  await expect(page.locator('img[alt="Generated image"]')).toBeVisible({ timeout: 30000 });

  // Download image
  const downloadPromise = page.waitForEvent('download');
  await page.click('button:has-text("Download")');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.(png|jpg)$/);
});
```

**Timeline:** 4 days

---

### 3.4 Performance Tests ⚡

**Load Testing:**

1. **API Endpoint Load Tests** (using k6)

```javascript
// tests/load/api-load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
};

export default function () {
  const response = http.post(
    'https://yourapp.com/api/chat',
    JSON.stringify({ message: 'Hello AI' }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${__ENV.TEST_TOKEN}`,
      },
    },
  );

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
```

2. **Database Performance**
   - Query performance benchmarks
   - Connection pool stress test
   - RLS policy performance impact

**Timeline:** 2 days

---

### 3.5 Security Tests 🔒

**Penetration Testing Checklist:**

1. **OWASP Top 10 Tests**
   - [ ] SQL Injection attempts
   - [ ] XSS injection in prompts
   - [ ] CSRF token bypass attempts
   - [ ] Authentication bypass attempts
   - [ ] Authorization escalation tests
   - [ ] Sensitive data exposure
   - [ ] XML/JSON entity injection
   - [ ] Broken access control
   - [ ] Security misconfiguration
   - [ ] Using components with known vulnerabilities

2. **API Security**
   - [ ] Rate limit bypass attempts
   - [ ] API key leakage tests
   - [ ] Webhook replay attacks
   - [ ] SSRF via image URLs

3. **Automated Security Scanning**

```bash
# Run OWASP ZAP automated scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://staging.yourapp.com \
  -r zap-report.html
```

**Timeline:** 3 days

---

### 3.6 Accessibility Tests ♿

**WCAG 2.1 AA Compliance:**

1. **Automated Testing**

```typescript
// tests/a11y/accessibility.spec.ts

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Image Studio has no accessibility violations', async ({ page }) => {
  await page.goto('/image-studio');

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

2. **Manual Testing**
   - [ ] Keyboard navigation (no mouse)
   - [ ] Screen reader testing (NVDA/JAWS)
   - [ ] Color contrast verification
   - [ ] Focus indicators visible
   - [ ] ARIA labels present

**Timeline:** 2 days

---

## P2 Testing Timeline Summary

- Unit tests: 5 days
- Integration tests: 4 days
- E2E tests: 4 days
- Performance tests: 2 days
- Security tests: 3 days
- Accessibility tests: 2 days

**Total P2: 20 days (~4 weeks)**

---

# 🟢 P3: NOVEL FEATURES (Competitive Differentiation)

## 4. Creative Enhancements 🎨

These features will make your platform **stand out** from competitors like Midjourney, Runway, or Replicate.

---

### 4.1 🌈 Cross-Modal Remix Engine

**Concept:** Seamlessly chain outputs across modalities with AI-assisted transformation.

**User Journey:**

1. Generate an image of a "cyberpunk city"
2. Click "Extract Audio Mood" → AI analyzes image and generates matching ambient soundtrack
3. Click "Animate" → Image + Audio combined into cinematic video
4. Click "Describe" → AI generates poetic description of the video

**Technical Implementation:**

```typescript
// src/lib/remix/cross-modal-engine.ts

export interface RemixChain {
  steps: RemixStep[];
  currentOutput: GeneratedAsset;
}

export interface RemixStep {
  from: 'image' | 'audio' | 'video' | 'text';
  to: 'image' | 'audio' | 'video' | 'text';
  transformation: string; // "extract_mood", "animate", "describe"
  model: string;
}

export async function executeRemixChain(chain: RemixChain): Promise<GeneratedAsset> {
  let currentAsset = chain.currentOutput;

  for (const step of chain.steps) {
    currentAsset = await transformAsset(currentAsset, step);
  }

  return currentAsset;
}
```

**UI Component:**

```typescript
// src/components/remix/RemixPanel.tsx

export function RemixPanel({ asset }: { asset: GeneratedAsset }) {
  const suggestions = useMemo(() => {
    if (asset.type === 'image') {
      return [
        { icon: '🎵', label: 'Extract Audio Mood', transform: 'image-to-audio' },
        { icon: '🎬', label: 'Animate', transform: 'image-to-video' },
        { icon: '✍️', label: 'Describe', transform: 'image-to-text' },
      ];
    }
    // ... other asset types
  }, [asset.type]);

  return (
    <Card>
      <CardHeader>Remix This {asset.type}</CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion.transform}
              onClick={() => startRemix(suggestion.transform)}
            >
              {suggestion.icon} {suggestion.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Value Proposition:**

- **Unique**: No other platform offers seamless cross-modal workflows
- **Creative**: Enables unexpected creative combinations
- **Efficient**: One-click transformations instead of manual export/import

**Timeline:** 5 days

---

### 4.2 🧬 Style DNA System

**Concept:** Extract and reuse visual/audio styles from user's favorite generations.

**Features:**

1. **Style Extraction**: Analyze user's top 10 favorite images → extract common patterns
2. **Style Fingerprint**: Generate a unique "Style DNA" code
3. **One-Click Application**: Apply saved styles to new prompts
4. **Style Mixing**: Combine multiple Style DNAs (e.g., 60% cyberpunk + 40% watercolor)

**Technical Implementation:**

```typescript
// src/lib/style-dna/extractor.ts

export interface StyleDNA {
  id: string;
  name: string;
  fingerprint: {
    colorPalette: string[]; // Dominant colors
    composition: string; // "rule-of-thirds", "centered", etc.
    lighting: string; // "dramatic", "soft", "neon"
    texture: string; // "smooth", "gritty", "painterly"
    mood: string[]; // ["dark", "energetic", "mysterious"]
  };
  sourceImages: string[]; // Asset IDs used for extraction
  createdAt: Date;
}

export async function extractStyleDNA(imageUrls: string[]): Promise<StyleDNA> {
  // Use vision model to analyze images
  const analyses = await Promise.all(imageUrls.map((url) => analyzeImageStyle(url)));

  // Aggregate common patterns
  const fingerprint = aggregateStylePatterns(analyses);

  return {
    id: uuidv4(),
    name: generateStyleName(fingerprint),
    fingerprint,
    sourceImages: imageUrls,
    createdAt: new Date(),
  };
}

export function applyStyleDNA(prompt: string, styleDNA: StyleDNA): string {
  // Augment prompt with style characteristics
  const styleModifiers = [
    `color palette: ${styleDNA.fingerprint.colorPalette.join(', ')}`,
    `${styleDNA.fingerprint.lighting} lighting`,
    `${styleDNA.fingerprint.texture} texture`,
    `mood: ${styleDNA.fingerprint.mood.join(', ')}`,
  ].join(', ');

  return `${prompt}, ${styleModifiers}`;
}
```

**UI Components:**

```typescript
// src/components/style-dna/StyleDNALibrary.tsx

export function StyleDNALibrary() {
  const { styleDNAs } = useStyleDNAStore();

  return (
    <div className="grid grid-cols-3 gap-4">
      {styleDNAs.map((dna) => (
        <StyleDNACard
          key={dna.id}
          dna={dna}
          onApply={(dna) => applyToCurrentPrompt(dna)}
          onMix={(dna) => openMixingPanel(dna)}
        />
      ))}
      <Button onClick={() => createNewStyleDNA()}>
        + Extract New Style
      </Button>
    </div>
  );
}
```

**Value Proposition:**

- **Consistency**: Maintain brand visual identity across generations
- **Efficiency**: Reuse successful styles without memorizing prompts
- **Creativity**: Discover unexpected combinations through style mixing

**Timeline:** 6 days

---

### 4.3 🤝 Collaborative Workspaces (Real-Time)

**Concept:** Multiple users work on the same canvas in real-time with cursor awareness.

**Features:**

1. **Live Cursors**: See collaborators' mouse positions and selections
2. **Shared Generation Queue**: All users see generation progress
3. **Voice Chat**: Built-in WebRTC voice for creative discussions
4. **Version Control**: Automatic branching when users make divergent changes

**Technical Implementation:**

```typescript
// src/lib/collaboration/websocket-server.ts (using Supabase Realtime)

import { createClient } from '@supabase/supabase-js';

export function useCollaborativeWorkspace(workspaceId: string) {
  const supabase = createClient(/* ... */);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel(`workspace:${workspaceId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setCollaborators(Object.values(state).flat());
      })
      .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
        updateCollaboratorCursor(payload.userId, payload.position);
      })
      .on('broadcast', { event: 'generation-started' }, ({ payload }) => {
        addToGenerationQueue(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  return { collaborators };
}
```

**UI Component:**

```typescript
// src/components/collaboration/CollaborativeCanvas.tsx

export function CollaborativeCanvas() {
  const { collaborators } = useCollaborativeWorkspace(workspaceId);

  return (
    <div className="relative">
      {/* Main canvas */}
      <Canvas />

      {/* Collaborator cursors */}
      {collaborators.map((collab) => (
        <RemoteCursor
          key={collab.userId}
          position={collab.cursor}
          color={collab.color}
          name={collab.name}
        />
      ))}

      {/* Voice chat widget */}
      <VoiceChat participants={collaborators} />
    </div>
  );
}
```

**Value Proposition:**

- **Unique**: Real-time collaboration not available in Midjourney/DALL-E
- **Team-Focused**: Perfect for creative agencies and design teams
- **Engagement**: Increases session time and platform stickiness

**Timeline:** 8 days (complex feature)

---

### 4.4 🌳 Prompt Evolution Trees

**Concept:** Visual branching of prompt iterations with side-by-side comparison.

**Features:**

1. **Tree Visualization**: See how prompts evolved over time
2. **Diff View**: Highlight what changed between iterations
3. **A/B Comparison**: Compare outputs side-by-side
4. **Branch Merging**: Combine best elements from different branches

**Technical Implementation:**

```typescript
// src/lib/prompt-evolution/tree.ts

export interface PromptNode {
  id: string;
  prompt: string;
  parentId: string | null;
  children: string[];
  output: GeneratedAsset;
  metadata: {
    model: string;
    timestamp: Date;
    userRating?: number;
  };
}

export class PromptTree {
  nodes: Map<string, PromptNode>;
  root: string;

  addBranch(parentId: string, newPrompt: string): PromptNode {
    const newNode: PromptNode = {
      id: uuidv4(),
      prompt: newPrompt,
      parentId,
      children: [],
      output: null!, // Will be filled after generation
      metadata: { model: 'default', timestamp: new Date() },
    };

    this.nodes.set(newNode.id, newNode);
    this.nodes.get(parentId)!.children.push(newNode.id);

    return newNode;
  }

  getAncestors(nodeId: string): PromptNode[] {
    const ancestors: PromptNode[] = [];
    let current = this.nodes.get(nodeId);

    while (current?.parentId) {
      const parent = this.nodes.get(current.parentId)!;
      ancestors.unshift(parent);
      current = parent;
    }

    return ancestors;
  }

  compareNodes(nodeA: string, nodeB: string): PromptDiff {
    const promptA = this.nodes.get(nodeA)!.prompt;
    const promptB = this.nodes.get(nodeB)!.prompt;

    return calculateDiff(promptA, promptB);
  }
}
```

**UI Component:**

```typescript
// src/components/prompt-evolution/TreeView.tsx

export function PromptTreeView({ treeId }: { treeId: string }) {
  const tree = usePromptTree(treeId);

  return (
    <div className="flex h-screen">
      {/* Tree visualization (using react-flow) */}
      <ReactFlow
        nodes={tree.nodes}
        edges={tree.edges}
        onNodeClick={(node) => selectNode(node.id)}
      />

      {/* Side panel with details */}
      <div className="w-96 border-l">
        <PromptDiffView
          original={tree.selectedNode?.parent}
          current={tree.selectedNode}
        />
        <Button onClick={() => createBranch()}>
          Create Branch
        </Button>
      </div>
    </div>
  );
}
```

**Value Proposition:**

- **Insight**: Understand what prompt changes lead to better results
- **Efficiency**: Never lose track of successful variations
- **Learning**: Visual feedback helps users learn prompt engineering

**Timeline:** 5 days

---

### 4.5 💰 AI Cost Optimizer

**Concept:** Suggest cheaper equivalent models/settings before generation.

**Features:**

1. **Cost Prediction**: Estimate cost before generating
2. **Smart Suggestions**: "This can be done 60% cheaper with GPT-4o-mini with similar quality"
3. **Quality Score**: Predict output quality based on historical data
4. **Budget Alerts**: Warn when approaching spending limits

**Technical Implementation:**

```typescript
// src/lib/cost-optimizer/optimizer.ts

export interface ModelOption {
  provider: string;
  model: string;
  estimatedCost: number;
  estimatedQuality: number; // 0-100
  estimatedTime: number; // seconds
}

export async function suggestCostOptimizations(
  prompt: string,
  currentModel: string,
): Promise<ModelOption[]> {
  // Analyze prompt complexity
  const complexity = await analyzePromptComplexity(prompt);

  // Find suitable models
  const suitableModels = MODELS.filter((m) =>
    m.capabilities.includes(complexity.requiredCapability),
  );

  // Score each model
  const scored = await Promise.all(
    suitableModels.map(async (model) => ({
      ...model,
      estimatedCost: calculateCost(model, prompt),
      estimatedQuality: await predictQuality(model, prompt),
      estimatedTime: estimateGenerationTime(model),
    })),
  );

  // Sort by cost-effectiveness (quality/cost ratio)
  return scored.sort((a, b) => {
    const ratioA = a.estimatedQuality / a.estimatedCost;
    const ratioB = b.estimatedQuality / b.estimatedCost;
    return ratioB - ratioA;
  });
}
```

**UI Component:**

```typescript
// src/components/cost-optimizer/CostOptimizerPanel.tsx

export function CostOptimizerPanel({ prompt, selectedModel }: Props) {
  const { suggestions, loading } = useCostOptimizer(prompt, selectedModel);

  if (!suggestions.length) return null;

  const bestAlternative = suggestions[0];
  const savings = selectedModel.cost - bestAlternative.estimatedCost;
  const savingsPercent = (savings / selectedModel.cost) * 100;

  return (
    <Alert>
      <AlertTitle>💡 Cost Optimization Available</AlertTitle>
      <AlertDescription>
        Using <strong>{bestAlternative.model}</strong> instead could save{' '}
        <strong>{savingsPercent.toFixed()}%</strong> (${savings.toFixed(2)})
        with similar quality.
      </AlertDescription>
      <Button onClick={() => switchToModel(bestAlternative)}>
        Switch to {bestAlternative.model}
      </Button>
    </Alert>
  );
}
```

**Value Proposition:**

- **Savings**: Users save money on API costs
- **Trust**: Transparent pricing builds user confidence
- **Education**: Helps users understand model capabilities

**Timeline:** 4 days

---

### 4.6 🎯 Quality Predictor

**Concept:** Predict output quality before generation to save API costs on bad prompts.

**Features:**

1. **Pre-Generation Score**: "This prompt has 85% chance of good results"
2. **Improvement Suggestions**: "Add more descriptive adjectives to improve quality"
3. **Historical Learning**: Learn from user's rating patterns
4. **Confidence Intervals**: "90% confident quality will be between 7-9/10"

**Technical Implementation:**

```typescript
// src/lib/quality-predictor/predictor.ts

export interface QualityPrediction {
  score: number; // 0-100
  confidence: number; // 0-100
  suggestions: string[];
  basedOn: {
    historicalPrompts: number;
    similarPrompts: number;
  };
}

export async function predictQuality(
  prompt: string,
  model: string,
  userId: string,
): Promise<QualityPrediction> {
  // Get user's historical ratings
  const userHistory = await getUserGenerationHistory(userId);

  // Find similar prompts
  const similarPrompts = await findSimilarPrompts(prompt, userHistory);

  // Calculate average rating of similar prompts
  const avgRating =
    similarPrompts.reduce((sum, p) => sum + (p.rating || 5), 0) / similarPrompts.length;

  // Analyze prompt quality indicators
  const indicators = analyzePromptIndicators(prompt);

  // Combine signals
  const score = calculatePredictionScore(avgRating, indicators);
  const confidence = calculateConfidence(similarPrompts.length, indicators.clarity);

  // Generate suggestions
  const suggestions = generateImprovementSuggestions(indicators);

  return {
    score,
    confidence,
    suggestions,
    basedOn: {
      historicalPrompts: userHistory.length,
      similarPrompts: similarPrompts.length,
    },
  };
}
```

**UI Component:**

```typescript
// src/components/quality-predictor/QualityPredictor.tsx

export function QualityPredictor({ prompt }: { prompt: string }) {
  const prediction = useQualityPrediction(prompt);

  const qualityColor = prediction.score > 70 ? 'green' : prediction.score > 40 ? 'yellow' : 'red';

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Quality Prediction</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Progress value={prediction.score} className="flex-1" />
          <span className={`text-${qualityColor}-500 font-bold`}>
            {prediction.score}/100
          </span>
        </div>

        {prediction.score < 60 && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Suggestions to improve:</p>
            <ul className="list-disc list-inside text-sm">
              {prediction.suggestions.map((suggestion, i) => (
                <li key={i}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Value Proposition:**

- **Cost Savings**: Avoid wasting money on low-quality generations
- **Learning**: Users improve prompt engineering skills
- **Efficiency**: Faster iteration with confident prompts

**Timeline:** 5 days

---

### 4.7 🔄 Automated A/B Testing

**Concept:** Generate variations, users pick winners, system learns preferences.

**Features:**

1. **Variation Generation**: Auto-generate 4 variations of a prompt
2. **Quick Vote**: Click to vote for best output
3. **Preference Learning**: ML model learns user's aesthetic preferences
4. **Auto-Refinement**: System suggests refined prompts based on winning patterns

**Technical Implementation:**

```typescript
// src/lib/ab-testing/variation-generator.ts

export interface PromptVariation {
  id: string;
  prompt: string;
  modifications: string[];
  output: GeneratedAsset | null;
}

export async function generateVariations(
  basePrompt: string,
  count: number = 4,
): Promise<PromptVariation[]> {
  // Use LLM to generate variations
  const response = await callLLM({
    model: 'gpt-4',
    prompt: `Generate ${count} variations of this prompt, each emphasizing different aspects:

Original: "${basePrompt}"

Return as JSON array with format:
[
  {
    "prompt": "variation text",
    "modifications": ["changed lighting", "added detail to background"]
  }
]`,
  });

  const variations = JSON.parse(response);

  return variations.map((v: any) => ({
    id: uuidv4(),
    prompt: v.prompt,
    modifications: v.modifications,
    output: null,
  }));
}

export async function learnFromVote(winnerPrompt: string, loserPrompts: string[], userId: string) {
  // Extract what made the winner different
  const differentiators = await analyzeDifferences(winnerPrompt, loserPrompts);

  // Update user preference model
  await updateUserPreferences(userId, {
    preferredStyles: differentiators.styles,
    preferredCompositions: differentiators.compositions,
    preferredMoods: differentiators.moods,
  });
}
```

**UI Component:**

```typescript
// src/components/ab-testing/ABTestingPanel.tsx

export function ABTestingPanel({ basePrompt }: { basePrompt: string }) {
  const [variations, setVariations] = useState<PromptVariation[]>([]);
  const [results, setResults] = useState<GeneratedAsset[]>([]);

  async function runABTest() {
    const vars = await generateVariations(basePrompt, 4);
    setVariations(vars);

    // Generate all in parallel
    const outputs = await Promise.all(
      vars.map((v) => generateImage(v.prompt))
    );

    setResults(outputs);
  }

  function voteForWinner(winnerId: string) {
    const winner = variations.find((v) => v.id === winnerId)!;
    const losers = variations.filter((v) => v.id !== winnerId);

    learnFromVote(winner.prompt, losers.map((l) => l.prompt), userId);

    // Use winner as new base for next iteration
    setBasePrompt(winner.prompt);
  }

  return (
    <div>
      <Button onClick={runABTest}>Generate 4 Variations</Button>

      <div className="grid grid-cols-2 gap-4 mt-4">
        {results.map((result, i) => (
          <Card key={i} onClick={() => voteForWinner(variations[i].id)}>
            <img src={result.url} alt={`Variation ${i + 1}`} />
            <CardFooter>
              <p className="text-xs">Modified: {variations[i].modifications.join(', ')}</p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

**Value Proposition:**

- **Discovery**: Users find unexpected winning combinations
- **Efficiency**: 4 variations generated with one click
- **Personalization**: System learns individual taste over time

**Timeline:** 6 days

---

### 4.8 🔗 Generation Inheritance & Lineage

**Concept:** Full provenance tracking with visual lineage graph.

**Features:**

1. **Lineage Graph**: See entire family tree of a generation
2. **Reproduction**: "Use this as input" button on any past generation
3. **Influence Score**: "This image is 60% derived from Generation #123"
4. **Export Lineage**: Export entire lineage as a shareable link

**Technical Implementation:**

```typescript
// src/lib/lineage/tracker.ts

export interface GenerationLineage {
  id: string;
  type: 'image' | 'video' | 'audio';
  parents: string[]; // IDs of input generations
  children: string[]; // IDs of generations derived from this
  metadata: {
    prompt: string;
    model: string;
    timestamp: Date;
    influenceScores?: Record<string, number>; // parentId -> influence %
  };
}

export class LineageTracker {
  async recordGeneration(generationId: string, parentIds: string[], metadata: any): Promise<void> {
    // Record in database
    await supabase.from('generation_lineage').insert({
      id: generationId,
      parents: parentIds,
      metadata,
    });

    // Update parent records
    for (const parentId of parentIds) {
      await supabase
        .from('generation_lineage')
        .update({
          children: sql`array_append(children, ${generationId})`,
        })
        .eq('id', parentId);
    }
  }

  async getFullLineage(generationId: string): Promise<GenerationLineage[]> {
    // Recursive query to get all ancestors and descendants
    const { data } = await supabase.rpc('get_generation_lineage', {
      root_id: generationId,
    });

    return data;
  }
}
```

**UI Component:**

```typescript
// src/components/lineage/LineageGraph.tsx

export function LineageGraph({ generationId }: { generationId: string }) {
  const lineage = useLineage(generationId);

  return (
    <ReactFlow
      nodes={lineage.nodes.map((gen) => ({
        id: gen.id,
        data: {
          label: (
            <div>
              <img src={gen.thumbnail} className="w-24 h-24" />
              <p className="text-xs">{gen.metadata.model}</p>
            </div>
          ),
        },
        position: calculatePosition(gen),
      }))}
      edges={lineage.edges.map((edge) => ({
        id: edge.id,
        source: edge.from,
        target: edge.to,
        label: edge.influenceScore ? `${edge.influenceScore}%` : undefined,
      }))}
    />
  );
}
```

**Value Proposition:**

- **Attribution**: Clear provenance for creative work
- **Learning**: Understand what inputs lead to good outputs
- **Collaboration**: Share entire creative process, not just final result

**Timeline:** 4 days

---

### 4.9 🧠 Smart Semantic Caching

**Concept:** Avoid duplicate generations using semantic similarity matching.

**Features:**

1. **Similarity Detection**: "This prompt is 95% similar to one you used 2 days ago"
2. **Cache Hit Preview**: Show cached result before generating
3. **Variation Options**: "Generate anyway" or "Modify to make more unique"
4. **Cost Savings Tracker**: "You've saved $47.82 with smart caching this month"

**Technical Implementation:**

```typescript
// src/lib/caching/semantic-cache.ts

import { embed } from '@/lib/embeddings';

export interface CacheEntry {
  promptEmbedding: number[];
  prompt: string;
  result: GeneratedAsset;
  timestamp: Date;
}

export class SemanticCache {
  private embeddings: Map<string, number[]> = new Map();

  async checkCache(prompt: string, threshold: number = 0.95): Promise<CacheEntry | null> {
    // Generate embedding for new prompt
    const queryEmbedding = await embed(prompt);

    // Search for similar prompts in database
    const { data } = await supabase.rpc('search_similar_prompts', {
      query_embedding: queryEmbedding,
      similarity_threshold: threshold,
      limit: 1,
    });

    if (data.length > 0) {
      return {
        promptEmbedding: data[0].embedding,
        prompt: data[0].prompt,
        result: data[0].result,
        timestamp: data[0].timestamp,
      };
    }

    return null;
  }

  async storeResult(prompt: string, result: GeneratedAsset): Promise<void> {
    const embedding = await embed(prompt);

    await supabase.from('semantic_cache').insert({
      prompt,
      embedding,
      result,
      timestamp: new Date(),
    });
  }
}
```

**Database Setup:**

```sql
-- Add pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE semantic_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimension
  result JSONB NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast similarity search
CREATE INDEX ON semantic_cache USING ivfflat (embedding vector_cosine_ops);

-- Function for similarity search
CREATE OR REPLACE FUNCTION search_similar_prompts(
  query_embedding vector(1536),
  similarity_threshold FLOAT,
  limit_count INT
)
RETURNS TABLE (
  prompt TEXT,
  embedding vector(1536),
  result JSONB,
  timestamp TIMESTAMPTZ,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.prompt,
    sc.embedding,
    sc.result,
    sc.timestamp,
    1 - (sc.embedding <=> query_embedding) AS similarity
  FROM semantic_cache sc
  WHERE 1 - (sc.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY similarity DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

**UI Component:**

```typescript
// src/components/caching/CacheHitNotification.tsx

export function CacheHitNotification({ cacheEntry }: { cacheEntry: CacheEntry }) {
  return (
    <Alert>
      <AlertTitle>🎯 Similar Generation Found</AlertTitle>
      <AlertDescription>
        <p>
          You used a similar prompt {formatDistanceToNow(cacheEntry.timestamp)} ago.
        </p>
        <div className="mt-2">
          <img src={cacheEntry.result.url} className="w-32 h-32" />
          <p className="text-xs mt-1">Original: "{cacheEntry.prompt}"</p>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={() => useCachedResult(cacheEntry)}>
            Use Cached Result (Save $0.04)
          </Button>
          <Button variant="outline" onClick={() => generateAnyway()}>
            Generate Anyway
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

**Value Proposition:**

- **Cost Savings**: Avoid duplicate API calls
- **Speed**: Instant results for similar prompts
- **Awareness**: Users see their pattern of reusing prompts

**Timeline:** 5 days

---

### 4.10 🎙️ Voice-Controlled Studio

**Concept:** Fully hands-free operation with natural language commands.

**Features:**

1. **Voice Commands**: "Generate an image of a sunset", "Make it more vibrant", "Download this"
2. **Multi-Modal Control**: Works across all studios (Image, Video, Audio)
3. **Context Awareness**: "Make it darker" knows which asset you're referring to
4. **Voice Feedback**: Audio confirmations for actions

**Technical Implementation:**

```typescript
// src/lib/voice/voice-controller.ts

export class VoiceController {
  private recognition: SpeechRecognition;
  private synthesis: SpeechSynthesis;

  constructor() {
    this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;

    this.synthesis = window.speechSynthesis;
  }

  start() {
    this.recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      this.handleCommand(transcript);
    };

    this.recognition.start();
  }

  async handleCommand(command: string) {
    // Parse natural language command
    const intent = await parseIntent(command);

    switch (intent.action) {
      case 'generate':
        await this.generate(intent.type, intent.prompt);
        this.speak('Generating your image now');
        break;

      case 'modify':
        await this.modify(intent.modification);
        this.speak('Applying modification');
        break;

      case 'download':
        await this.download();
        this.speak('Downloading');
        break;

      default:
        this.speak("I didn't understand that command");
    }
  }

  speak(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    this.synthesis.speak(utterance);
  }
}

// Intent parsing using LLM
async function parseIntent(command: string): Promise<VoiceIntent> {
  const response = await callLLM({
    model: 'gpt-4',
    prompt: `Parse this voice command into structured intent:

Command: "${command}"

Return JSON:
{
  "action": "generate" | "modify" | "download" | "navigate" | "unknown",
  "type": "image" | "video" | "audio" | null,
  "prompt": "extracted prompt" | null,
  "modification": "make it darker" | "add more detail" | null
}`,
  });

  return JSON.parse(response);
}
```

**UI Component:**

```typescript
// src/components/voice/VoiceControlWidget.tsx

export function VoiceControlWidget() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const voiceController = useRef(new VoiceController());

  function toggleListening() {
    if (isListening) {
      voiceController.current.stop();
    } else {
      voiceController.current.start();
    }
    setIsListening(!isListening);
  }

  return (
    <div className="fixed bottom-4 right-4">
      <Button
        size="lg"
        className={cn(
          'rounded-full w-16 h-16',
          isListening && 'animate-pulse bg-red-500'
        )}
        onClick={toggleListening}
      >
        {isListening ? <MicIcon /> : <MicOffIcon />}
      </Button>

      {transcript && (
        <div className="mt-2 p-2 bg-background/90 backdrop-blur rounded-lg">
          <p className="text-sm">{transcript}</p>
        </div>
      )}
    </div>
  );
}
```

**Value Proposition:**

- **Accessibility**: Enables users with motor disabilities
- **Efficiency**: Faster than typing for experienced users
- **Novelty**: No other AI generation platform has full voice control
- **Multitasking**: Control while reviewing other work

**Timeline:** 6 days

---

## P3 Novel Features Timeline Summary

- Cross-Modal Remix Engine: 5 days
- Style DNA System: 6 days
- Collaborative Workspaces: 8 days
- Prompt Evolution Trees: 5 days
- AI Cost Optimizer: 4 days
- Quality Predictor: 5 days
- Automated A/B Testing: 6 days
- Generation Inheritance: 4 days
- Smart Semantic Caching: 5 days
- Voice-Controlled Studio: 6 days

**Total P3: 54 days (~11 weeks)**

---

# Implementation Roadmap

## Phased Rollout Strategy

### Phase 1: Security & Stability (Weeks 1-3)

**Goal:** Production-ready security and core functionality

**Week 1: Critical Security**

- [ ] Fix cookie vulnerability
- [ ] API route security audit
- [ ] Input validation implementation
- [ ] Webhook signature validation

**Week 2: Production Infrastructure**

- [ ] Production environment setup (Supabase, Redis, NextAuth)
- [ ] Error handling & monitoring
- [ ] Database migrations & RLS verification
- [ ] Secrets management

**Week 3: Quality Assurance**

- [ ] Unit tests for critical paths
- [ ] Integration tests for API routes
- [ ] E2E tests for main user journeys
- [ ] Performance optimization
- [ ] Security penetration testing

**Deliverable:** ✅ Production-ready application with 80%+ test coverage

---

### Phase 2: Polish & Documentation (Weeks 4-5)

**Goal:** User-ready launch with excellent DX

**Week 4: User Experience**

- [ ] Accessibility audit and fixes
- [ ] Mobile responsiveness
- [ ] Loading states and error messages
- [ ] User settings management
- [ ] Documentation (user + developer)

**Week 5: DevOps & Launch Prep**

- [ ] CI/CD pipeline setup
- [ ] Staging environment testing
- [ ] Load testing
- [ ] Backup and recovery procedures
- [ ] Launch checklist verification

**Deliverable:** ✅ Polished, documented, launch-ready platform

---

### Phase 3: Differentiation (Weeks 6-16)

**Goal:** Stand out with novel features

**Weeks 6-7: Quick Wins**

- [ ] AI Cost Optimizer (4 days)
- [ ] Generation Inheritance (4 days)
- [ ] Quality Predictor (5 days)

**Weeks 8-9: Creative Tools**

- [ ] Cross-Modal Remix Engine (5 days)
- [ ] Prompt Evolution Trees (5 days)

**Weeks 10-11: Advanced Features**

- [ ] Style DNA System (6 days)
- [ ] Smart Semantic Caching (5 days)

**Weeks 12-13: Collaboration**

- [ ] Automated A/B Testing (6 days)
- [ ] Voice-Controlled Studio (6 days)

**Weeks 14-16: Premium Feature**

- [ ] Collaborative Workspaces (8 days + testing/polish)

**Deliverable:** ✅ Market-leading feature set

---

# Launch Readiness Checklist

## Final Pre-Launch Verification (Day Before)

### Security ✅

- [ ] All npm audit vulnerabilities resolved
- [ ] All API routes have auth middleware
- [ ] Input validation on all endpoints
- [ ] Webhook signatures verified
- [ ] CSRF protection enabled
- [ ] Secrets rotated
- [ ] RLS policies tested
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Rate limiting active

### Functionality ✅

- [ ] OAuth login works (Google + GitHub)
- [ ] Image generation works (all providers)
- [ ] Video generation works (all providers)
- [ ] Audio generation works
- [ ] Training pipeline works end-to-end
- [ ] Chat functionality works
- [ ] File uploads work
- [ ] Webhooks process correctly
- [ ] User settings persist

### Performance ✅

- [ ] P95 latency < 2s for API routes
- [ ] Images optimized (WebP format)
- [ ] Code splitting implemented
- [ ] Bundle size < 500KB (initial load)
- [ ] Database queries indexed
- [ ] Redis caching active

### Monitoring ✅

- [ ] Sentry error tracking configured
- [ ] Performance monitoring active
- [ ] Database metrics tracked
- [ ] API cost tracking enabled
- [ ] Alerts configured for critical errors

### Documentation ✅

- [ ] User guide published
- [ ] API documentation complete
- [ ] Environment variables documented
- [ ] Deployment guide written
- [ ] Troubleshooting guide available

### Legal & Compliance ✅

- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Cookie consent banner
- [ ] GDPR compliance verified
- [ ] User data export/delete functions

---

# Success Metrics

## KPIs to Track Post-Launch

### User Engagement

- Daily Active Users (DAU)
- Generations per user per day
- Session duration
- Feature adoption rate
- User retention (7-day, 30-day)

### Technical Health

- Error rate (target: <0.1%)
- P95 latency (target: <2s)
- Uptime (target: 99.9%)
- Cache hit rate (target: >60%)

### Business Metrics

- API cost per user
- Revenue per user (if monetized)
- Conversion rate (free → paid)
- Customer acquisition cost

### Quality Metrics

- User satisfaction score
- Generation success rate
- Support ticket volume
- Feature request frequency

---

# Conclusion

## Recommended MVP for First Production Deployment

**Priority Order:**

1. ✅ **Phase 1 (Weeks 1-3):** Security & Stability - MUST COMPLETE
2. ✅ **Phase 2 (Weeks 4-5):** Polish & Documentation - HIGHLY RECOMMENDED
3. 🎨 **Phase 3 (Weeks 6-8):** 2-3 Novel Features - COMPETITIVE EDGE

**Minimum Viable Launch:**

- All P0 security items complete
- All P1 functionality working
- Basic test coverage (P2)
- 2 novel features from P3 (suggested: Cost Optimizer + Cross-Modal Remix)

**Timeline to MVP:** 6-8 weeks

**Estimated Development Cost:**

- P0 Security: 12 developer-days
- P1 Functionality: 18 developer-days
- P2 Testing (basic): 10 developer-days
- P3 Novel Features (2): 9 developer-days

**Total:** ~50 developer-days (~2 months with 1 developer, or 1 month with 2 developers)

---

**Last Updated:** 2026-01-20
**Status:** Ready for team review and prioritization
