# PRODUCTION API AUDIT REPORT

**Multi-Modal Generation Studio - Comprehensive API Route Security & Quality Review**

**Date**: 2026-01-26  
**Audited by**: Code Quality Reviewer Agent (Sonnet 4.5)  
**Scope**: All API routes in src/app/api/

---

## EXECUTIVE SUMMARY

**Overall Status**: 🟡 **PRODUCTION-READY WITH CRITICAL FIXES REQUIRED**

- **Total Routes Audited**: 35+ endpoints
- **Critical Issues**: 8
- **High Priority Issues**: 12
- **Medium Priority Issues**: 15
- **Low Priority Issues**: 8

**Recommendation**: Address all CRITICAL and HIGH priority issues before production deployment. MEDIUM issues should be resolved within first maintenance cycle.

---

## CRITICAL ISSUES (BLOCKING)

### 1. **CSRF Token Bypass in Webhook Routes**

**Severity**: 🔴 CRITICAL  
**Files**:

- `/src/app/api/webhooks/replicate/route.ts:7-23`
- `/src/app/api/webhooks/video/route.ts:40-54`

**Issue**: Webhook endpoints accept POST requests without CSRF protection, but also lack proper signature validation in development mode.

**Current Code** (webhooks/video/route.ts:16-17):

```typescript
if (process.env.NODE_ENV === 'development' && !signature) {
  return true;
}
```

**Risk**: Development bypass could accidentally remain in production config, allowing unauthenticated webhook injection.

**Fix Required**:

1. Remove development bypass or gate it behind explicit env var (ALLOW_UNSIGNED_WEBHOOKS=true)
2. Always validate signatures in production
3. Add IP allowlist for known webhook sources
4. Log all webhook attempts with source IP

**Expected Code**:

```typescript
// NEVER bypass in production
if (!signature) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[Security] Webhook signature missing in production');
    return false;
  }
  if (process.env.ALLOW_UNSIGNED_WEBHOOKS !== 'true') {
    return false;
  }
}
```

---

### 2. **Missing Input Validation on JSON Parse**

**Severity**: 🔴 CRITICAL  
**Files**:

- `/src/app/api/webhooks/replicate/route.ts:8-9`
- `/src/app/api/webhooks/video/route.ts:42-43`

**Issue**: Direct JSON.parse without try-catch or size validation. Attackers can send malformed/huge JSON payloads to crash the server.

**Current Code**:

```typescript
const bodyText = await req.text();
const body = JSON.parse(bodyText); // No validation!
```

**Risk**:

- DoS via large payloads (>100MB JSON)
- Process crash on malformed JSON
- Memory exhaustion

**Fix Required**:

```typescript
const bodyText = await req.text();

// Size validation (prevent DoS)
if (bodyText.length > ValidationRules.json.maxPayloadSize) {
  return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
}

// Safe JSON parse
let body: unknown;
try {
  body = JSON.parse(bodyText);
} catch (error) {
  console.error('[Webhook] Invalid JSON:', error);
  return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
}
```

---

### 3. **Unhandled Blob Conversion in Image Generation**

**Severity**: 🔴 CRITICAL  
**Files**:

- `/src/app/api/generate/image/route.ts:72-78`

**Issue**: Base64 to Blob conversion can fail silently or cause memory issues with large images.

**Current Code** (line 72):

```typescript
const imageBlob = await fetch(options.image).then((res) => res.blob());
```

**Risk**:

- Unvalidated base64 strings crash the process
- No size limits on image blobs (OOM attacks)
- No timeout on fetch (infinite hang)
- Data URIs can embed malicious content

**Fix Required**:

```typescript
// Validate data URI format
if (!options.image.startsWith('data:image/')) {
  return { success: false, error: 'Invalid image format' };
}

// Add size limit and timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

try {
  const imageBlob = await fetch(options.image, { signal: controller.signal }).then((res) => {
    if (res.size > ValidationRules.file.maxSizeBytes) {
      throw new Error('Image exceeds size limit');
    }
    return res.blob();
  });
  clearTimeout(timeoutId);
} catch (error) {
  clearTimeout(timeoutId);
  return { success: false, error: 'Invalid or oversized image' };
}
```

---

### 4. **Missing Rate Limit on Training Status Polling**

**Severity**: 🔴 CRITICAL  
**Files**:

- `/src/app/api/training/status/route.ts:31`

**Issue**: Status endpoint has no rate limiting but uses `requireAuth` instead of `requireAuthAndRateLimit`.

**Current Code** (line 31):

```typescript
const authResult = await requireAuth(req); // No rate limit!
```

**Risk**:

- Client can poll every 100ms indefinitely
- Database connection exhaustion
- DoS via status endpoint spam

**Fix Required**:

```typescript
// Add rate limiting
const authResult = await requireAuthAndRateLimit(
  req,
  '/api/training/status',
  { maxRequests: 120, windowMs: 60 * 1000 }, // 120/min (2/sec)
);
```

---

### 5. **Stream Response Without Timeout**

**Severity**: 🔴 CRITICAL  
**Files**:

- `/src/app/api/generate/audio/route.ts:291-298`
- `/src/app/api/chat/route.ts:59-83`

**Issue**: Streaming responses from third-party APIs (ElevenLabs, OpenAI) have no timeout, causing connection leaks.

**Current Code** (audio/route.ts:291):

```typescript
return new Response(response.body, {
  headers: {
    'Content-Type': 'audio/mpeg',
    'Transfer-Encoding': 'chunked',
    // No timeout!
  },
});
```

**Risk**:

- Hung connections consume worker threads
- Memory leaks from unclosed streams
- Client receives no error after 30+ seconds

**Fix Required**:

```typescript
// Add stream timeout wrapper
const timeoutMs = 30000; // 30 seconds
const timeoutController = new AbortController();
const timeoutId = setTimeout(() => {
  timeoutController.abort();
  console.error('[Audio] Stream timeout exceeded');
}, timeoutMs);

// Wrap stream with timeout
const timeoutStream = new TransformStream({
  start(controller) {
    const reader = response.body?.getReader();
    if (!reader) {
      controller.error(new Error('No response body'));
      return;
    }

    const pump = async () => {
      try {
        while (!timeoutController.signal.aborted) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        clearTimeout(timeoutId);
        reader.releaseLock();
      }
    };
    pump();
  },
});

return new Response(response.body.pipeThrough(timeoutStream), {
  headers: {
    'Content-Type': 'audio/mpeg',
    'Transfer-Encoding': 'chunked',
    'X-Timeout-Ms': timeoutMs.toString(),
  },
});
```

---

### 6. **SQL Injection Risk via Job ID**

**Severity**: 🔴 CRITICAL  
**Files**:

- `/src/app/api/training/status/route.ts:38-40`
- `/src/app/api/webhooks/video/route.ts:86`

**Issue**: Job IDs from query params are passed to database functions without validation. If UUID validation is missing in the DB layer, this is exploitable.

**Current Code** (training/status/route.ts:38-40):

```typescript
const jobId = searchParams.get('job_id');
// ... minimal validation
const job = await getTrainingJob(jobId, authResult.userId); // Potential SQL injection
```

**Risk**:

- SQL injection if `getTrainingJob` doesn't use parameterized queries
- NoSQL injection if using MongoDB

**Fix Required**:

```typescript
const jobId = searchParams.get('job_id');

// Validate UUID format BEFORE database call
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!jobId || !uuidRegex.test(jobId)) {
  return NextResponse.json({ error: 'Invalid job_id format (expected UUID)' }, { status: 400 });
}

// Now safe to query
const job = await getTrainingJob(jobId, authResult.userId);
```

---

### 7. **Unvalidated File Upload Size**

**Severity**: 🔴 CRITICAL  
**Files**:

- `/src/app/api/generate/audio/stems/route.ts:12-17`

**Issue**: FormData file upload accepts files without size validation before processing.

**Current Code** (stems/route.ts:14-17):

```typescript
const file = formData.get('file');
if (!file || !(file instanceof File)) {
  return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
}
// No size check! Proceeds to forward to worker
```

**Risk**:

- Upload 10GB audio file → OOM crash
- Worker process crashes processing huge files
- Disk space exhaustion on worker server

**Fix Required**:

```typescript
const file = formData.get('file');

if (!file || !(file instanceof File)) {
  return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
}

// Validate file size
if (file.size > ValidationRules.file.maxSizeBytes) {
  return NextResponse.json(
    {
      error: 'File too large',
      maxSize: ValidationRules.file.maxSizeBytes,
      receivedSize: file.size,
    },
    { status: 413 },
  );
}

// Validate file type
const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac'];
if (!allowedTypes.includes(file.type)) {
  return NextResponse.json({ error: 'Invalid file type', allowedTypes }, { status: 400 });
}
```

---

### 8. **Missing Error Response on Worker Connection Failure**

**Severity**: 🔴 CRITICAL  
**Files**:

- `/src/app/api/generate/audio/heart/route.ts:93-116`
- `/src/app/api/generate/audio/stems/route.ts:77-92`

**Issue**: GET status endpoints have no authentication and minimal error handling.

**Current Code** (heart/route.ts:93-98):

```typescript
export async function GET(req: NextRequest) {
  // Check status of a job
  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }
  // NO AUTH CHECK!
```

**Risk**:

- Unauthenticated users can poll anyone's job status
- Information disclosure (job metadata, prompts)
- Resource exhaustion via status polling

**Fix Required**:

```typescript
export async function GET(req: NextRequest) {
  // Require auth with rate limiting
  const authResult = await requireAuthAndRateLimit(req, '/api/generate/audio/heart', {
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }

  // Verify job belongs to user
  const job = await getJobByIdAndUser(jobId, authResult.userId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Now fetch status...
}
```

---

## HIGH PRIORITY ISSUES

### 9. **Inconsistent Error Response Format**

**Severity**: 🟠 HIGH  
**Files**: Multiple routes

**Issue**: Error responses use different structures across routes:

- Some: `{ error: string }`
- Some: `{ success: false, error: string }`
- Some: `{ error: string, message: string }`

**Examples**:

- `/src/app/api/generate/image/route.ts:281`: `{ success: false, error: ... }`
- `/src/app/api/chat/route.ts:26`: Just plain text string
- `/src/app/api/title/route.ts:17`: Plain text string

**Impact**: Frontend error handling is fragile and inconsistent.

**Fix**: Standardize on a single error format:

```typescript
interface ApiErrorResponse {
  success: false;
  error: string; // Error type/code
  message: string; // Human-readable message
  details?: unknown; // Optional structured details
  timestamp: string; // ISO timestamp
}
```

---

### 10. **No Request ID Tracing**

**Severity**: 🟠 HIGH  
**Files**: All routes

**Issue**: No correlation ID across API calls, webhooks, and logs. Debugging production issues is nearly impossible.

**Impact**:

- Can't trace request flow through system
- Webhook callbacks can't be matched to original requests
- Log aggregation is useless

**Fix**: Add middleware to inject request IDs:

```typescript
// middleware.ts
export function middleware(req: NextRequest) {
  const requestId = crypto.randomUUID();
  req.headers.set('x-request-id', requestId);

  console.log(`[${requestId}] ${req.method} ${req.url}`);

  return NextResponse.next({
    headers: {
      'x-request-id': requestId,
    },
  });
}
```

---

### 11. **Missing Health Check Dependencies**

**Severity**: 🟠 HIGH  
**Files**: `/src/app/api/health/ready/route.ts:7-17`

**Issue**: Readiness probe only returns static response, doesn't check critical dependencies (DB, Redis, workers).

**Current Code**:

```typescript
export async function GET() {
  return NextResponse.json(
    {
      status: 'ready',
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
```

**Impact**: K8s will route traffic to unhealthy pods, causing cascading failures.

**Fix**:

```typescript
export async function GET() {
  const checks = {
    database: false,
    redis: false,
    workers: false,
  };

  try {
    // Check database connection
    await db.raw('SELECT 1');
    checks.database = true;

    // Check Redis
    if (redis) {
      await redis.ping();
      checks.redis = true;
    }

    // Check critical workers
    const workerStatus = await ensureWorkerReady('heart');
    checks.workers = workerStatus.ready;

    const allHealthy = Object.values(checks).every((v) => v);

    return NextResponse.json(
      {
        status: allHealthy ? 'ready' : 'unhealthy',
        checks,
        timestamp: new Date().toISOString(),
      },
      { status: allHealthy ? 200 : 503 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        checks,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
```

---

### 12. **Prompt Validation Too Lenient**

**Severity**: 🟠 HIGH  
**Files**: `/src/lib/validation/input-validation.ts:31-39`

**Issue**: Prompt validation only checks length and non-empty. No protection against:

- Prompt injection attacks
- Extremely long single words (no spaces)
- Unicode exploits
- Null byte injection

**Current Code**:

```typescript
export function validatePrompt(prompt: string): { valid: boolean; error?: string } {
  if (!prompt || typeof prompt !== 'string') {
    return { valid: false, error: 'Prompt must be a non-empty string' };
  }
  if (prompt.length > ValidationRules.prompt.maxLength) {
    return { valid: false, error: `Prompt exceeds maximum length` };
  }
  return { valid: true };
}
```

**Fix**:

```typescript
export function validatePrompt(prompt: string): { valid: boolean; error?: string } {
  if (!prompt || typeof prompt !== 'string') {
    return { valid: false, error: 'Prompt must be a non-empty string' };
  }

  // Trim whitespace
  prompt = prompt.trim();

  if (prompt.length === 0) {
    return { valid: false, error: 'Prompt cannot be empty' };
  }

  if (prompt.length > ValidationRules.prompt.maxLength) {
    return { valid: false, error: `Prompt exceeds maximum length` };
  }

  // Check for null bytes
  if (prompt.includes('\0')) {
    return { valid: false, error: 'Prompt contains invalid characters' };
  }

  // Check for extremely long words (no spaces)
  const words = prompt.split(/\s+/);
  const maxWordLength = 100;
  if (words.some((word) => word.length > maxWordLength)) {
    return { valid: false, error: 'Prompt contains excessively long words' };
  }

  // Check for suspicious patterns (prompt injection)
  const suspiciousPatterns = [
    /ignore\s+previous\s+instructions/i,
    /system:\s*you\s+are/i,
    /\[INST\]/i,
    /<\|system\|>/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(prompt)) {
      console.warn('[Validation] Suspicious prompt pattern detected:', prompt);
      // Don't block entirely, just log for monitoring
    }
  }

  return { valid: true };
}
```

---

### 13. **Cost Tracking Race Condition**

**Severity**: 🟠 HIGH  
**Files**: Multiple generation routes

**Issue**: Cost tracking happens in `onFinish` callback which is async and not awaited. If response is sent before tracking completes, costs are lost.

**Example** (chat/route.ts:62-79):

```typescript
onFinish: async ({ usage }) => {
    // This is fire-and-forget! No await
    await trackApiUsage({...}).catch((err) => console.error(...));
}
```

**Impact**:

- Missing cost data for billing
- Race condition with response sending
- Silent failures in cost tracking

**Fix**: Track usage before streaming OR use a background job queue:

```typescript
// Option 1: Track before streaming
const estimatedCost = calculateEstimatedCost(messages, modelId);
await trackApiUsage({
  user_id: userId,
  provider: providerId,
  endpoint: '/api/chat',
  cost_cents: estimatedCost,
  status: 'pending',
});

const result = await streamText({
  model: createUniversalModel(providerId, modelId),
  messages,
  onFinish: async ({ usage }) => {
    // Update with actual usage
    await updateApiUsageWithActual(userId, requestId, usage);
  },
});

// Option 2: Use background queue
onFinish: async ({ usage }) => {
  await usageQueue.add({
    userId,
    usage,
    requestId,
    timestamp: Date.now(),
  });
};
```

---

### 14. **No Circuit Breaker for External APIs**

**Severity**: 🟠 HIGH  
**Files**: All provider integration files

**Issue**: No circuit breaker pattern for third-party API calls. If Replicate/OpenAI/ElevenLabs goes down, all requests will hang/timeout.

**Impact**:

- Cascading failures
- Thread pool exhaustion
- 30-second timeouts for every request

**Fix**: Implement circuit breaker:

```typescript
import CircuitBreaker from 'opossum';

const replicateBreaker = new CircuitBreaker(async (params) => {
    return await fetch('https://api.replicate.com/...', params);
}, {
    timeout: 10000, // 10s timeout
    errorThresholdPercentage: 50,
    resetTimeout: 30000, // Try again after 30s
});

replicateBreaker.on('open', () => {
    console.error('[CircuitBreaker] Replicate API is down');
});

// Use in routes
const response = await replicateBreaker.fire({ method: 'POST', ... });
```

---

### 15. **Webhook Replay Attack Vulnerability**

**Severity**: 🟠 HIGH  
**Files**:

- `/src/app/api/webhooks/replicate/route.ts`
- `/src/app/api/webhooks/video/route.ts`

**Issue**: Webhook timestamp validation exists but isn't consistently applied. Replicate webhook has it, video webhook doesn't.

**Current Code** (webhooks/video/route.ts):

```typescript
function validateWebhookSignature(req: NextRequest, body: string, provider?: string): boolean {
  // ... signature validation
  // NO TIMESTAMP CHECK!
}
```

**Impact**: Attacker can replay old webhook payloads to manipulate job status.

**Fix**: Always validate timestamps:

```typescript
function validateWebhookSignature(req: NextRequest, body: string, provider?: string): boolean {
  const timestamp = req.headers.get('x-webhook-timestamp') || req.headers.get('x-timestamp');

  // Validate timestamp first (prevent replay)
  if (!validateWebhookTimestamp(timestamp)) {
    console.error('[Webhook] Invalid or expired timestamp');
    return false;
  }

  // Then validate signature...
}
```

---

### 16. **Missing CORS Headers in Production**

**Severity**: 🟠 HIGH  
**Files**: Multiple routes with OPTIONS handlers

**Issue**: CORS OPTIONS responses use `*` for `Access-Control-Allow-Origin`, which is insecure for authenticated APIs.

**Example** (training/submit/route.ts:230-239):

```typescript
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*', // INSECURE!
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    },
  );
}
```

**Impact**: CSRF attacks, credentials exposure

**Fix**:

```typescript
export async function OPTIONS(req: NextRequest): Promise<NextResponse> {
  const origin = req.headers.get('origin');
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'https://app.multimodal.studio',
    'https://studio.example.com',
  ].filter(Boolean);

  const allowOrigin = allowedOrigins.includes(origin || '') ? origin : allowedOrigins[0];

  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': allowOrigin || 'null',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
      },
    },
  );
}
```

---

### 17. **No Idempotency Key Support**

**Severity**: 🟠 HIGH  
**Files**: All POST generation endpoints

**Issue**: No idempotency key support. Users retrying failed requests create duplicate generations and double charges.

**Impact**:

- Duplicate jobs on network errors
- Double billing
- Wasted compute resources

**Fix**: Add idempotency key header:

```typescript
export async function POST(req: NextRequest) {
    const authResult = await requireAuthAndRateLimit(...);
    if (!authResult.authenticated) return authResult.response;

    // Check for idempotency key
    const idempotencyKey = req.headers.get('idempotency-key');
    if (idempotencyKey) {
        // Check if this request was already processed
        const existingResult = await redis?.get(`idempotency:${idempotencyKey}`);
        if (existingResult) {
            console.log('[Idempotency] Returning cached result');
            return NextResponse.json(JSON.parse(existingResult));
        }
    }

    // Process request...
    const result = await generateImage(...);

    // Cache result for 24 hours
    if (idempotencyKey && result.success) {
        await redis?.set(
            `idempotency:${idempotencyKey}`,
            JSON.stringify(result),
            'EX',
            86400
        );
    }

    return NextResponse.json(result);
}
```

---

### 18. **Sensitive Data in Logs**

**Severity**: 🟠 HIGH  
**Files**: Multiple routes

**Issue**: Prompts, API keys, and user data logged in console.log statements.

**Examples**:

- `/src/app/api/generate/video/route.ts:378`: Logs truncated prompt
- `/src/app/api/chat/route.ts`: Logs full messages array

**Impact**:

- PII exposure in log aggregators
- Prompt leakage to log viewers
- Compliance violations (GDPR, CCPA)

**Fix**: Sanitize logs:

```typescript
function sanitizeForLogging(data: any): any {
  if (typeof data === 'string') {
    // Truncate long strings
    return data.length > 50 ? data.substring(0, 50) + '...' : data;
  }
  if (Array.isArray(data)) {
    return `Array(${data.length})`;
  }
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (['apiKey', 'password', 'secret', 'token'].some((k) => key.toLowerCase().includes(k))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeForLogging(value);
      }
    }
    return sanitized;
  }
  return data;
}

// Usage
console.log(
  '[VideoGeneration] Started job',
  sanitizeForLogging({
    modelId: resolvedModelId,
    provider,
    prompt, // Will be truncated
  }),
);
```

---

### 19. **Missing Database Connection Pooling Limits**

**Severity**: 🟠 HIGH  
**Files**: `/src/lib/db/server.ts` (not shown, but referenced)

**Issue**: High-traffic endpoints (status polling, webhook callbacks) can exhaust DB connection pool.

**Impact**:

- Connection timeout errors
- Database overload
- Cascading failures

**Fix**: Implement connection limits and queuing:

```typescript
// Ensure pool limits are set
const pool = new Pool({
  max: 20, // Maximum 20 connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Add queue for high-traffic endpoints
const dbQueue = new PQueue({ concurrency: 10 });

export async function getTrainingJob(jobId: string, userId: string) {
  return dbQueue.add(async () => {
    return await pool.query('SELECT * FROM training_jobs WHERE id = $1 AND user_id = $2', [
      jobId,
      userId,
    ]);
  });
}
```

---

### 20. **No OpenTelemetry Tracing**

**Severity**: 🟠 HIGH  
**Files**: All routes

**Issue**: No distributed tracing for performance monitoring and debugging.

**Impact**:

- Can't identify slow endpoints
- Can't trace cross-service calls
- No visibility into worker latencies

**Fix**: Add OpenTelemetry instrumentation:

```typescript
import { trace, context } from '@opentelemetry/api';

export async function POST(req: NextRequest) {
    const tracer = trace.getTracer('api-generate-image');

    return tracer.startActiveSpan('generate-image', async (span) => {
        span.setAttribute('user.id', authResult.userId);
        span.setAttribute('model.id', modelId);

        try {
            const result = await generateImage(...);
            span.setStatus({ code: SpanStatusCode.OK });
            return NextResponse.json(result);
        } catch (error) {
            span.recordException(error);
            span.setStatus({ code: SpanStatusCode.ERROR });
            throw error;
        } finally {
            span.end();
        }
    });
}
```

---

## MEDIUM PRIORITY ISSUES

### 21. **Inconsistent Model ID Resolution**

**Severity**: 🟡 MEDIUM  
**Files**: All generation routes

**Issue**: Some routes resolve model IDs, others use legacy provider strings. Inconsistent behavior across endpoints.

**Impact**: Confusion in logs, metrics grouped incorrectly

**Fix**: Enforce model ID usage everywhere, deprecate legacy provider param.

---

### 22. **Missing Response Time Logging**

**Severity**: 🟡 MEDIUM  
**Files**: All routes

**Issue**: No timing metrics for endpoint performance.

**Fix**: Add response time middleware:

```typescript
export function middleware(req: NextRequest) {
  const start = Date.now();
  const response = NextResponse.next();

  response.headers.set('X-Response-Time', `${Date.now() - start}ms`);
  return response;
}
```

---

### 23. **Hardcoded API URLs**

**Severity**: 🟡 MEDIUM  
**Files**: Multiple provider files

**Issue**: API endpoints are hardcoded strings, should be environment variables for testing.

**Example**:

```typescript
const endpoint = 'https://api.openai.com/v1/images/generations'; // Should be env var
```

**Fix**: Use config:

```typescript
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
const endpoint = `${OPENAI_API_BASE}/images/generations`;
```

---

### 24. **No API Versioning**

**Severity**: 🟡 MEDIUM  
**Files**: All API routes

**Issue**: No versioning strategy for API routes. Breaking changes will break all clients.

**Fix**: Add version prefix:

```
/api/v1/generate/image
/api/v1/chat
```

---

### 25. **Weak UUID Validation**

**Severity**: 🟡 MEDIUM  
**Files**: Training status route

**Issue**: UUID validation regex doesn't validate version/variant fields.

**Fix**: Use proper UUID library:

```typescript
import { validate as isUuid } from 'uuid';

if (!isUuid(jobId)) {
  return NextResponse.json({ error: 'Invalid UUID' }, { status: 400 });
}
```

---

### 26. **Missing Content-Type Validation**

**Severity**: 🟡 MEDIUM  
**Files**: All POST routes

**Issue**: Routes don't validate Content-Type header before parsing JSON.

**Fix**:

```typescript
const contentType = req.headers.get('content-type');
if (!contentType || !contentType.includes('application/json')) {
  return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
}
```

---

### 27. **No Rate Limit Response Headers**

**Severity**: 🟡 MEDIUM  
**Files**: Auth middleware

**Issue**: Rate limit responses include retry headers, but successful responses don't include limit info.

**Fix**: Always include rate limit headers:

```typescript
response.headers.set('X-RateLimit-Limit', limit.toString());
response.headers.set('X-RateLimit-Remaining', remaining.toString());
response.headers.set('X-RateLimit-Reset', reset.toString());
```

---

### 28. **Weak Type Safety in Validation**

**Severity**: 🟡 MEDIUM  
**Files**: ComfyUI workflow validation

**Issue**: Type assertions (`as ComfyUIWorkflow`) bypass type checking.

**Fix**: Use proper type guards:

```typescript
function isValidWorkflow(obj: unknown): obj is ComfyUIWorkflow {
  if (typeof obj !== 'object' || obj === null) return false;
  // ... detailed checks
  return true;
}
```

---

### 29. **No Graceful Degradation for Redis**

**Severity**: 🟡 MEDIUM  
**Files**: Auth middleware

**Issue**: If Redis fails, rate limiting fails open in dev but closed in prod. Should have fallback.

**Fix**: Implement in-memory fallback for Redis failures:

```typescript
const memoryCache = new Map();
if (!redis) {
    // Fallback to in-memory rate limiting
    const key = `${userId}:${endpoint}`;
    const count = memoryCache.get(key) || 0;
    if (count >= config.maxRequests) {
        return { allowed: false, ... };
    }
    memoryCache.set(key, count + 1);
    setTimeout(() => memoryCache.delete(key), config.windowMs);
}
```

---

### 30. **Provider API Keys Not Validated on Startup**

**Severity**: 🟡 MEDIUM  
**Files**: All provider integration files

**Issue**: API keys are validated on first request, causing user-facing errors. Should validate on startup.

**Fix**: Add startup health check:

```typescript
// startup.ts
export async function validateProviders() {
  const providers = {
    openai: process.env.OPENAI_API_KEY,
    replicate: process.env.REPLICATE_API_TOKEN,
    elevenlabs: process.env.ELEVENLABS_API_KEY,
  };

  for (const [name, key] of Object.entries(providers)) {
    if (!key) {
      console.warn(`[Startup] ${name} API key not configured`);
    }
  }
}
```

---

### 31. **Missing Webhook Event Types**

**Severity**: 🟡 MEDIUM  
**Files**: Webhook routes

**Issue**: Webhook handlers don't validate event types, could process wrong events.

**Fix**:

```typescript
const { event, jobId, status } = body;

const allowedEvents = ['video.completed', 'video.failed', 'video.processing'];
if (!allowedEvents.includes(event)) {
  return NextResponse.json({ error: 'Unsupported event type' }, { status: 400 });
}
```

---

### 32. **No Metrics Collection**

**Severity**: 🟡 MEDIUM  
**Files**: All routes

**Issue**: No Prometheus/StatsD metrics for monitoring.

**Fix**: Add metrics middleware:

```typescript
import { Counter, Histogram } from 'prom-client';

const apiRequests = new Counter({
  name: 'api_requests_total',
  help: 'Total API requests',
  labelNames: ['method', 'route', 'status'],
});

const apiDuration = new Histogram({
  name: 'api_request_duration_seconds',
  help: 'API request duration',
  labelNames: ['method', 'route'],
});
```

---

### 33. **Inconsistent Status Codes**

**Severity**: 🟡 MEDIUM  
**Files**: Multiple routes

**Issue**: Some routes return 500 for validation errors, should be 400.

**Examples**:

- `/src/app/api/generate/image/route.ts:456`: Returns 500 on non-success result

**Fix**: Use correct HTTP status codes:

- 400: Bad request (validation errors)
- 401: Unauthorized
- 403: Forbidden (CSRF, permissions)
- 404: Not found
- 429: Too many requests
- 500: Internal server error (unexpected)
- 503: Service unavailable (worker down)

---

### 34. **No Request Body Size Limit**

**Severity**: 🟡 MEDIUM  
**Files**: All POST routes

**Issue**: Next.js has default body size limit, but not explicitly enforced in routes.

**Fix**: Add explicit validation:

```typescript
// middleware.ts or per-route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
```

---

### 35. **Missing Database Transaction Wrapping**

**Severity**: 🟡 MEDIUM  
**Files**: Video webhook, training submit

**Issue**: Multiple database operations in webhook handlers aren't wrapped in transactions.

**Example** (webhooks/video/route.ts:74-98):

```typescript
await updateVideoJob(jobId, {...});
await updateGenerationResult(generation.id, {...});
// If second call fails, data is inconsistent!
```

**Fix**: Use transactions:

```typescript
await db.transaction(async (trx) => {
    await updateVideoJob(jobId, {...}, trx);
    await updateGenerationResult(generation.id, {...}, trx);
});
```

---

## LOW PRIORITY ISSUES

### 36. **Console.log in Production**

**Severity**: 🟢 LOW  
**Files**: All routes

**Issue**: Using console.log instead of structured logging library.

**Fix**: Use winston/pino:

```typescript
import logger from '@/lib/logger';
logger.info('Image generation completed', { modelId, userId });
```

---

### 37. **Magic Numbers in Code**

**Severity**: 🟢 LOW  
**Files**: Multiple files

**Issue**: Hardcoded values like `10000` (timeout), `86400` (1 day) should be constants.

**Fix**: Define constants:

```typescript
const TIMEOUTS = {
  API_REQUEST: 10000,
  STREAM: 30000,
  WORKER_STARTUP: 60000,
};

const CACHE_TTL = {
  ONE_HOUR: 3600,
  ONE_DAY: 86400,
  ONE_WEEK: 604800,
};
```

---

### 38. **Unused Imports**

**Severity**: 🟢 LOW  
**Files**: Multiple files

**Issue**: Some files import types/functions that aren't used.

**Fix**: Run ESLint with unused imports check:

```bash
npm run lint -- --fix
```

---

### 39. **Missing JSDoc Comments**

**Severity**: 🟢 LOW  
**Files**: Provider integration functions

**Issue**: Complex provider integration functions lack documentation.

**Fix**: Add JSDoc:

```typescript
/**
 * Generates an image using OpenAI's DALL-E API
 * @param prompt - Text description of the image
 * @param options - Generation options (size, quality, etc.)
 * @param providedKey - Optional API key override
 * @returns Promise resolving to generation response with image URLs
 * @throws Error if API key is missing or API call fails
 */
async function generateWithOpenAI(...) { }
```

---

### 40. **Inconsistent Variable Naming**

**Severity**: 🟢 LOW  
**Files**: Multiple files

**Issue**: Mix of camelCase and snake_case in JavaScript code.

**Example**:

```typescript
const { user_id, provider_job_id } = body; // snake_case from DB
const modelId = resolveModelId(); // camelCase
```

**Fix**: Standardize on camelCase for JS, use transform layer for DB:

```typescript
const { userId, providerJobId } = toCamelCase(body);
```

---

### 41. **No API Documentation**

**Severity**: 🟢 LOW  
**Files**: N/A

**Issue**: No OpenAPI/Swagger docs for API consumers.

**Fix**: Generate OpenAPI spec:

```typescript
// Use next-swagger-doc or similar
import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  return createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
      openapi: '3.0.0',
      info: { title: 'Multi-Modal Studio API', version: '1.0.0' },
    },
  });
};
```

---

### 42. **Missing Favicon for Health Endpoints**

**Severity**: 🟢 LOW  
**Files**: Health check routes

**Issue**: Health check endpoints don't handle favicon.ico requests.

**Fix**: Add favicon handler or ignore in middleware.

---

### 43. **Timestamp Format Inconsistency**

**Severity**: 🟢 LOW  
**Files**: Multiple routes

**Issue**: Some use ISO strings, some use Unix timestamps, some use Date objects.

**Fix**: Standardize on ISO 8601 strings:

```typescript
const timestamp = new Date().toISOString();
```

---

## SUMMARY OF FINDINGS BY CATEGORY

| Category           | Critical | High   | Medium | Low   | Total  |
| ------------------ | -------- | ------ | ------ | ----- | ------ |
| **Security**       | 6        | 6      | 3      | 0     | 15     |
| **Validation**     | 2        | 2      | 4      | 0     | 8      |
| **Error Handling** | 0        | 3      | 2      | 0     | 5      |
| **Performance**    | 0        | 3      | 2      | 0     | 5      |
| **Observability**  | 0        | 3      | 3      | 3     | 9      |
| **Code Quality**   | 0        | 0      | 1      | 5     | 6      |
| **TOTAL**          | **8**    | **12** | **15** | **8** | **43** |

---

## PRIORITY RESOLUTION ORDER

### PHASE 1 (PRE-PRODUCTION) - MUST FIX

**Deadline**: Before any production deployment

1. Issue #1: CSRF Bypass in Webhooks
2. Issue #2: Missing JSON Parse Validation
3. Issue #3: Unhandled Blob Conversion
4. Issue #4: Missing Rate Limit on Status
5. Issue #5: Stream Response Without Timeout
6. Issue #6: SQL Injection Risk
7. Issue #7: Unvalidated File Upload Size
8. Issue #8: Missing Auth on GET Status Endpoints

**Estimated Effort**: 16-24 hours

---

### PHASE 2 (LAUNCH WEEK) - SHOULD FIX

**Deadline**: Within 7 days of production launch

9. Issue #9: Inconsistent Error Response Format
10. Issue #10: No Request ID Tracing
11. Issue #11: Missing Health Check Dependencies
12. Issue #12: Prompt Validation Too Lenient
13. Issue #13: Cost Tracking Race Condition
14. Issue #14: No Circuit Breaker
15. Issue #15: Webhook Replay Attack
16. Issue #16: Missing CORS Headers
17. Issue #17: No Idempotency Key Support
18. Issue #18: Sensitive Data in Logs
19. Issue #19: Missing DB Connection Pooling

**Estimated Effort**: 24-32 hours

---

### PHASE 3 (FIRST MONTH) - NICE TO HAVE

**Deadline**: Within 30 days of production launch

20-35: All MEDIUM priority issues

**Estimated Effort**: 40-60 hours

---

### PHASE 4 (ONGOING) - POLISH

**Deadline**: Ongoing maintenance

36-43: All LOW priority issues

**Estimated Effort**: 8-12 hours

---

## RECOMMENDED IMMEDIATE ACTIONS

### 1. Emergency Security Patch

Create a hotfix branch and address issues #1, #2, #6, #8 immediately:

```bash
git checkout -b hotfix/critical-security-fixes
# Fix CSRF bypass, JSON validation, SQL injection, auth on GET
npm run test
git commit -m "fix: critical security patches (issues #1,2,6,8)"
```

### 2. Add Request Validation Middleware

Create a shared validation middleware to standardize input handling:

```typescript
// src/lib/middleware/validation.ts
export async function validateJsonRequest(req: NextRequest, maxSize = 1024 * 1024) {
  const contentType = req.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    throw new Error('Content-Type must be application/json');
  }

  const body = await req.text();
  if (body.length > maxSize) {
    throw new Error('Request body too large');
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error('Invalid JSON');
  }
}
```

### 3. Implement Error Response Standard

Create a standard error response helper:

```typescript
// src/lib/utils/api-responses.ts
export function errorResponse(
  error: string,
  message: string,
  status: number = 500,
  details?: unknown,
) {
  return NextResponse.json(
    {
      success: false,
      error,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

// Usage
return errorResponse('validation_error', 'Invalid prompt', 400);
```

### 4. Add Monitoring and Alerting

Set up monitoring for:

- Rate limit exceeded events
- Webhook signature failures
- API error rates by endpoint
- Worker connection failures
- Database connection pool saturation

### 5. Create Runbook for Common Issues

Document recovery procedures for:

- Redis connection loss
- Worker unavailability
- Database connection exhaustion
- Third-party API outages

---

## TESTING RECOMMENDATIONS

### Security Testing

- [ ] Penetration test webhook endpoints
- [ ] Fuzz test all JSON parsing
- [ ] Test rate limiting under load
- [ ] Validate CSRF protection
- [ ] Test prompt injection scenarios

### Load Testing

- [ ] Status endpoint polling (1000 req/s)
- [ ] Concurrent generation requests
- [ ] Webhook callback storms
- [ ] Database connection pooling limits
- [ ] Stream timeout behavior

### Integration Testing

- [ ] End-to-end generation flows
- [ ] Webhook delivery and retry
- [ ] Worker failure recovery
- [ ] Cost tracking accuracy
- [ ] Idempotency key behavior

---

## CONCLUSION

The Multi-Modal Generation Studio API codebase demonstrates good architectural patterns but requires significant security hardening before production deployment. The identified critical issues pose real security risks and must be addressed immediately.

**GO/NO-GO Assessment**: 🔴 **NO-GO** until all CRITICAL issues are resolved.

**Post-Fix Assessment**: After addressing all CRITICAL and HIGH priority issues, the system will be suitable for production deployment with proper monitoring and incident response procedures in place.

**Recommended Review Cycle**:

- Weekly security review for first month
- Monthly code quality audit ongoing
- Quarterly penetration testing

---

**Report Generated**: 2026-01-26  
**Next Review Date**: 2026-02-26  
**Quality Reviewer**: Sonnet 4.5 Agent
