# Multi-Modal Generation Studio

# Production Audit Remediation Plan

**Created:** 2026-01-26
**Total Critical Issues:** 26
**Estimated Total Effort:** 120-160 hours (3-4 weeks with 2-3 engineers)

---

## Phase Overview

```
Phase 0: Emergency Security Fixes (Day 1)
    ↓
Phase 1: API Security Hardening (Days 2-3)
    ↓
Phase 2: Worker Stability (Days 4-7)        ←→  Phase 2B: State Management (Days 4-5)
    ↓                                                    ↓
Phase 3: Database & Performance (Days 8-10) ←→  Phase 3B: UI/UX Critical (Days 8-10)
    ↓
Phase 4: Testing Infrastructure (Days 11-14)
    ↓
Phase 5: Integration Testing & Validation (Days 15-17)
```

---

## PHASE 0: EMERGENCY SECURITY FIXES

**Timeline:** Day 1 (4-6 hours)
**Dependencies:** None
**Blocking:** All other phases

### Task 0.1: Fix Command Injection Vulnerability

**Agent:** `security-reviewer` + `typescript-dev`
**File:** `src/app/api/training/jobs/[id]/cancel/route.ts`
**Lines:** 84-106
**Effort:** 1 hour

#### Micro-tasks:

- [ ] 0.1.1 Read current implementation (10 min)
- [ ] 0.1.2 Create UUID validation helper function (15 min)
  ```typescript
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  function isValidUUID(id: string): boolean {
    return UUID_REGEX.test(id);
  }
  ```
- [ ] 0.1.3 Add validation before shell commands (15 min)
- [ ] 0.1.4 Write unit test for UUID validation (15 min)
- [ ] 0.1.5 Manual test with malicious jobId (5 min)

**Verification:**

```bash
# Should fail with 400
curl -X POST localhost:3000/api/training/jobs/"; rm -rf /"/cancel
```

**Rollback:** Revert commit if any issues

---

### Task 0.2: Remove Webhook Development Bypass

**Agent:** `security-reviewer` + `typescript-dev`
**Files:**

- `src/app/api/webhooks/replicate/route.ts:20-21`
- `src/app/api/webhooks/video/route.ts:16-17`
  **Effort:** 1 hour

#### Micro-tasks:

- [ ] 0.2.1 Read both webhook files (10 min)
- [ ] 0.2.2 Remove `NODE_ENV === 'development'` bypass in replicate (15 min)
- [ ] 0.2.3 Remove `NODE_ENV === 'development'` bypass in video (15 min)
- [ ] 0.2.4 Create separate `/api/webhooks/test/*` endpoints for dev (20 min)
- [ ] 0.2.5 Update local development docs (10 min)

**Verification:**

```bash
# Should fail with 401 (no bypass)
NODE_ENV=development curl -X POST localhost:3000/api/webhooks/replicate
```

---

### Task 0.3: Scrub Secrets from .env.example

**Agent:** `security-reviewer`
**File:** `.env.example`
**Lines:** 71-73
**Effort:** 30 min

#### Micro-tasks:

- [ ] 0.3.1 Replace Supabase keys with obvious placeholders (10 min)
  ```
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
  SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
  ```
- [ ] 0.3.2 Check for other potential secrets in file (10 min)
- [ ] 0.3.3 Add comment about never committing real keys (5 min)
- [ ] 0.3.4 Verify no secrets in git history (5 min)
  ```bash
  git log -p .env.example | grep -i "sb_secret\|sb_publishable"
  ```

**⚠️ HUMAN REVIEW REQUIRED:** If real keys found in git history, coordinate key rotation with DevOps

---

### Task 0.4: Fix SQL Injection in Training Status

**Agent:** `security-reviewer` + `typescript-dev`
**File:** `src/app/api/training/status/route.ts:38-40`
**Effort:** 45 min

#### Micro-tasks:

- [ ] 0.4.1 Read current query construction (10 min)
- [ ] 0.4.2 Add UUID validation before query (15 min)
- [ ] 0.4.3 Verify parameterized query usage (10 min)
- [ ] 0.4.4 Add test for malformed jobId (10 min)

---

### Phase 0 Verification Checklist

- [ ] All shell commands use validated UUIDs
- [ ] Webhook signature always validated
- [ ] No secrets in .env.example
- [ ] All DB queries parameterized
- [ ] Security smoke tests pass

---

## PHASE 1: API SECURITY HARDENING

**Timeline:** Days 2-3 (16-20 hours)
**Dependencies:** Phase 0 complete
**Parallel:** None (security-critical path)

### Task 1.1: Add JSON Parse Validation to Webhooks

**Agent:** `typescript-dev`
**Files:** All files in `src/app/api/webhooks/`
**Effort:** 3 hours

#### Micro-tasks:

- [ ] 1.1.1 Create shared webhook body parser utility (30 min)

  ```typescript
  // src/lib/webhooks/body-parser.ts
  const MAX_BODY_SIZE = 1024 * 1024; // 1MB

  export async function parseWebhookBody<T>(req: Request): Promise<T> {
    const contentLength = parseInt(req.headers.get('content-length') || '0');
    if (contentLength > MAX_BODY_SIZE) {
      throw new WebhookError('Body too large', 413);
    }
    try {
      const text = await req.text();
      return JSON.parse(text) as T;
    } catch (e) {
      throw new WebhookError('Invalid JSON', 400);
    }
  }
  ```

- [ ] 1.1.2 Update replicate webhook route (20 min)
- [ ] 1.1.3 Update video webhook route (20 min)
- [ ] 1.1.4 Add Zod schema validation for webhook bodies (45 min)
- [ ] 1.1.5 Write unit tests for body parser (30 min)
- [ ] 1.1.6 Integration test with oversized payload (15 min)

---

### Task 1.2: Add Stream Response Timeouts

**Agent:** `typescript-dev`
**Files:**

- `src/app/api/generate/audio/route.ts:291`
- `src/app/api/chat/route.ts:59-83`
  **Effort:** 2 hours

#### Micro-tasks:

- [ ] 1.2.1 Create timeout wrapper for streams (30 min)
  ```typescript
  function createTimeoutStream(stream: ReadableStream, timeoutMs: number) {
    let lastActivity = Date.now();
    const checkInterval = setInterval(() => {
      if (Date.now() - lastActivity > timeoutMs) {
        controller.abort();
        clearInterval(checkInterval);
      }
    }, 1000);
    // ...
  }
  ```
- [ ] 1.2.2 Apply to audio generation route (20 min)
- [ ] 1.2.3 Apply to chat route (20 min)
- [ ] 1.2.4 Add cleanup on client disconnect (30 min)
- [ ] 1.2.5 Test timeout behavior (20 min)

---

### Task 1.3: Add File Upload Validation

**Agent:** `typescript-dev`
**File:** `src/app/api/generate/audio/stems/route.ts:14-17`
**Effort:** 1.5 hours

#### Micro-tasks:

- [ ] 1.3.1 Create file validation middleware (30 min)

  ```typescript
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg'];

  function validateUpload(file: File) {
    if (file.size > MAX_FILE_SIZE) throw new Error('File too large');
    if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Invalid type');
  }
  ```

- [ ] 1.3.2 Apply to stems route (15 min)
- [ ] 1.3.3 Apply to other audio upload routes (15 min)
- [ ] 1.3.4 Add size limit tests (20 min)
- [ ] 1.3.5 Add type validation tests (10 min)

---

### Task 1.4: Add Rate Limiting to Status Endpoints

**Agent:** `typescript-dev`
**File:** `src/app/api/training/status/route.ts:31`
**Effort:** 45 min

#### Micro-tasks:

- [ ] 1.4.1 Change `requireAuth` to `requireAuthAndRateLimit` (10 min)
- [ ] 1.4.2 Configure appropriate rate limit (100 req/min for polling) (10 min)
- [ ] 1.4.3 Add test for rate limit behavior (15 min)
- [ ] 1.4.4 Update client to handle 429 responses (10 min)

---

### Task 1.5: Add Authentication to GET Endpoints

**Agent:** `typescript-dev`
**Files:**

- `src/app/api/generate/audio/heart/route.ts:93`
- `src/app/api/generate/audio/stems/route.ts:77`
  **Effort:** 1 hour

#### Micro-tasks:

- [ ] 1.5.1 Add `requireAuth` to heart GET (15 min)
- [ ] 1.5.2 Add `requireAuth` to stems GET (15 min)
- [ ] 1.5.3 Verify job ownership check exists (15 min)
- [ ] 1.5.4 Add tests for unauthorized access (15 min)

---

### Task 1.6: Fix Blob Conversion Error Handling

**Agent:** `typescript-dev`
**File:** `src/app/api/generate/image/route.ts:72`
**Effort:** 1 hour

#### Micro-tasks:

- [ ] 1.6.1 Wrap blob conversion in try-catch (15 min)
- [ ] 1.6.2 Add size validation before conversion (15 min)
- [ ] 1.6.3 Add timeout for conversion operation (15 min)
- [ ] 1.6.4 Return proper error response on failure (15 min)

---

### Task 1.7: Fix CORS Configuration

**Agent:** `security-reviewer` + `typescript-dev`
**File:** `src/app/api/training/submit/route.ts:233-239`
**Effort:** 1.5 hours

#### Micro-tasks:

- [ ] 1.7.1 Create centralized CORS config (30 min)
  ```typescript
  // src/lib/cors.ts
  const ALLOWED_ORIGINS = [process.env.NEXT_PUBLIC_APP_URL, 'https://studio.example.com'].filter(
    Boolean,
  );
  ```
- [ ] 1.7.2 Replace wildcard with origin whitelist (20 min)
- [ ] 1.7.3 Apply to all training routes (20 min)
- [ ] 1.7.4 Test cross-origin requests (20 min)

---

### Phase 1 Verification Checklist

- [ ] All webhooks validate body size and JSON
- [ ] Streams have 5-minute timeout
- [ ] File uploads limited to 50MB
- [ ] Status endpoints rate-limited
- [ ] All GET endpoints authenticated
- [ ] Blob conversion handles errors
- [ ] CORS properly configured

---

## PHASE 2: WORKER STABILITY

**Timeline:** Days 4-7 (32-40 hours)
**Dependencies:** Phase 1 complete
**Parallel:** Can run with Phase 2B

### Task 2.1: Implement Graceful Worker Shutdown

**Agent:** `typescript-dev` + `python-dev`
**File:** `src/lib/workers/local-worker-manager.ts:379-391`
**Effort:** 4 hours

#### Micro-tasks:

- [ ] 2.1.1 Design shutdown sequence (30 min)
- [ ] 2.1.2 Add SIGTERM handler with timeout (45 min)
- [ ] 2.1.3 Add in-flight request tracking (45 min)
- [ ] 2.1.4 Implement drain mode (30 min)
- [ ] 2.1.5 Add SIGKILL fallback after 30s (20 min)
- [ ] 2.1.6 Update Python workers to handle SIGTERM (30 min)
- [ ] 2.1.7 Test graceful shutdown scenario (20 min)

---

### Task 2.2: Add VRAM Management

**Agent:** `python-dev` + `typescript-dev`
**File:** `src/lib/workers/local-worker-manager.ts:454-461`
**Effort:** 6 hours

#### Micro-tasks:

- [ ] 2.2.1 Create nvidia-smi wrapper (45 min)

  ```python
  # scripts/vram-monitor.py
  import subprocess
  import json

  def get_available_vram():
      result = subprocess.run(
          ['nvidia-smi', '--query-gpu=memory.free', '--format=csv,noheader,nounits'],
          capture_output=True, text=True
      )
      return int(result.stdout.strip().split('\n')[0])
  ```

- [ ] 2.2.2 Add VRAM check before worker start (45 min)
- [ ] 2.2.3 Implement worker queue for VRAM-limited scenarios (1 hour)
- [ ] 2.2.4 Add VRAM pool allocation tracking (45 min)
- [ ] 2.2.5 Prevent concurrent high-VRAM workers (45 min)
- [ ] 2.2.6 Add OOM detection and recovery (45 min)
- [ ] 2.2.7 Integration test with VRAM limits (45 min)

---

### Task 2.3: Fix Worker Error Recovery

**Agent:** `python-dev`
**Files:**

- `scripts/personaplex-worker.py:461-483`
- `scripts/qwen-tts-worker.py:107-142`
  **Effort:** 4 hours

#### Micro-tasks:

- [ ] 2.3.1 Wrap generation endpoints in try-except (30 min)
- [ ] 2.3.2 Add error response format (20 min)
- [ ] 2.3.3 Implement exponential backoff for retries (30 min)
- [ ] 2.3.4 Add circuit breaker pattern (45 min)
- [ ] 2.3.5 Reset attempt counter after success window (20 min)
- [ ] 2.3.6 Add health check self-healing (30 min)
- [ ] 2.3.7 Test recovery scenarios (45 min)

---

### Task 2.4: Implement Model Unloading

**Agent:** `python-dev`
**File:** `scripts/qwen-tts-worker.py:107-142`
**Effort:** 3 hours

#### Micro-tasks:

- [ ] 2.4.1 Implement LRU cache for models (45 min)
- [ ] 2.4.2 Add model last-used timestamp (20 min)
- [ ] 2.4.3 Implement unload after 5-minute idle (30 min)
- [ ] 2.4.4 Add `torch.cuda.empty_cache()` on unload (15 min)
- [ ] 2.4.5 Limit to max 2 models loaded (30 min)
- [ ] 2.4.6 Test memory recovery (20 min)

---

### Task 2.5: Add Provider Timeouts

**Agent:** `typescript-dev`
**Files:** `src/lib/providers/video/*.ts` (sora, kling, veo, pika, etc.)
**Effort:** 3 hours

#### Micro-tasks:

- [ ] 2.5.1 Create axios instance with default timeout (30 min)
  ```typescript
  const providerAxios = axios.create({
    timeout: 60000,
    headers: { 'Content-Type': 'application/json' },
  });
  ```
- [ ] 2.5.2 Apply to sora.ts (15 min)
- [ ] 2.5.3 Apply to kling.ts (15 min)
- [ ] 2.5.4 Apply to veo.ts (15 min)
- [ ] 2.5.5 Apply to pika.ts (15 min)
- [ ] 2.5.6 Apply to remaining providers (30 min)
- [ ] 2.5.7 Add retry logic with backoff (30 min)
- [ ] 2.5.8 Test timeout behavior (30 min)

---

### Task 2.6: Implement Dead Letter Queue

**Agent:** `typescript-dev`
**File:** `src/lib/queue/batch-queue.ts:19`
**Effort:** 3 hours

#### Micro-tasks:

- [ ] 2.6.1 Configure job retention (20 min)
  ```typescript
  removeOnComplete: {
    age: 3600, // Keep for 1 hour
    count: 1000 // Keep last 1000
  }
  ```
- [ ] 2.6.2 Add failed job handler (30 min)
- [ ] 2.6.3 Create DLQ storage table (30 min)
- [ ] 2.6.4 Implement job replay from DLQ (45 min)
- [ ] 2.6.5 Add admin endpoint for DLQ inspection (30 min)
- [ ] 2.6.6 Test failed job capture (25 min)

---

### Task 2.7: Fix Global Model Lock

**Agent:** `python-dev`
**File:** `scripts/personaplex-worker.py:54-56`
**Effort:** 4 hours

#### Micro-tasks:

- [ ] 2.7.1 Design async queue architecture (45 min)
- [ ] 2.7.2 Implement request queue with asyncio (1 hour)
- [ ] 2.7.3 Add batch inference support (1 hour)
- [ ] 2.7.4 Configure concurrency limits per GPU (30 min)
- [ ] 2.7.5 Test concurrent requests (45 min)

---

### Phase 2 Verification Checklist

- [ ] Workers survive parent process restart
- [ ] Graceful shutdown completes in-flight requests
- [ ] VRAM checked before worker start
- [ ] Failed workers auto-recover
- [ ] Idle models get unloaded
- [ ] All provider calls have timeouts
- [ ] Failed jobs stored in DLQ
- [ ] Concurrent requests handled properly

---

## PHASE 2B: STATE MANAGEMENT (Parallel with Phase 2)

**Timeline:** Days 4-5 (8-10 hours)
**Dependencies:** Phase 1 complete
**Parallel:** Run with Phase 2

### Task 2B.1: Fix Training Store Memory Leak

**Agent:** `typescript-dev`
**File:** `src/lib/store/training-store.ts:14, 226-291`
**Effort:** 4 hours

#### Micro-tasks:

- [ ] 2B.1.1 Store timeout IDs as numbers, not objects (30 min)
- [ ] 2B.1.2 Mark pollingIntervals as non-persisted (20 min)
  ```typescript
  partialize: (state) => ({
    // Exclude pollingIntervals from persistence
    ...state,
    pollingIntervals: undefined,
  });
  ```
- [ ] 2B.1.3 Add visibility change listener for background tabs (30 min)
- [ ] 2B.1.4 Implement React hook for cleanup (45 min)
  ```typescript
  // useTrainingPolling.ts
  useEffect(() => {
    startPolling(jobId);
    return () => stopPolling(jobId);
  }, [jobId]);
  ```
- [ ] 2B.1.5 Add max poll duration (45 min)
- [ ] 2B.1.6 Test memory with DevTools (30 min)

---

### Task 2B.2: Fix Chat Store Race Condition

**Agent:** `typescript-dev`
**File:** `src/lib/store/chat-store.ts:111-127`
**Effort:** 3 hours

#### Micro-tasks:

- [ ] 2B.2.1 Analyze race condition window (20 min)
- [ ] 2B.2.2 Refactor to single atomic set() call (45 min)

  ```typescript
  addMessage: (partialMsg) => {
    set((state) => {
      const id = uuidv4();
      let threadId = state.activeThreadId;

      // Create thread inside set() if needed
      if (!threadId) {
        threadId = uuidv4();
        // Create thread in same state update
      }

      return {
        ...state,
        threads: {
          /* updated threads */
        },
        messages: {
          /* updated messages */
        },
      };
    });
  };
  ```

- [ ] 2B.2.3 Add unit tests for concurrent adds (45 min)
- [ ] 2B.2.4 Stress test with rapid message sending (30 min)

---

### Phase 2B Verification Checklist

- [ ] No NodeJS.Timeout in persisted state
- [ ] Polling stops on component unmount
- [ ] Background tabs pause polling
- [ ] Messages always go to correct thread
- [ ] No duplicate thread creation

---

## PHASE 3: DATABASE & PERFORMANCE

**Timeline:** Days 8-10 (16-20 hours)
**Dependencies:** Phase 2 and 2B complete
**Parallel:** Can run with Phase 3B

### Task 3.1: Enable Connection Pooling

**Agent:** `db-engineer` + `typescript-dev`
**File:** `src/lib/db/client.ts`
**Effort:** 3 hours

#### Micro-tasks:

- [ ] 3.1.1 Research Supabase connection pooling options (30 min)
- [ ] 3.1.2 Configure PgBouncer or equivalent (45 min)
- [ ] 3.1.3 Update client configuration (30 min)
- [ ] 3.1.4 Add connection health checks (30 min)
- [ ] 3.1.5 Load test with 100 concurrent users (45 min)

---

### Task 3.2: Document Backup Strategy

**Agent:** `db-engineer`
**Effort:** 2 hours

#### Micro-tasks:

- [ ] 3.2.1 Create backup documentation (30 min)
- [ ] 3.2.2 Configure Supabase Point-in-Time Recovery (30 min)
- [ ] 3.2.3 Set up daily backup exports (30 min)
- [ ] 3.2.4 Document recovery procedures (30 min)

**⚠️ HUMAN REVIEW REQUIRED:** Backup strategy approval

---

### Task 3.3: Lazy-Load Mermaid (65MB)

**Agent:** `perf-engineer` + `typescript-dev`
**Effort:** 2 hours

#### Micro-tasks:

- [ ] 3.3.1 Find Mermaid import locations (15 min)
- [ ] 3.3.2 Convert to dynamic import (30 min)
  ```typescript
  const mermaid = await import('mermaid');
  ```
- [ ] 3.3.3 Add loading state for diagram components (30 min)
- [ ] 3.3.4 Verify bundle size reduction (15 min)
- [ ] 3.3.5 Test diagram rendering still works (30 min)

---

### Task 3.4: Remove Playwright from Production

**Agent:** `perf-engineer`
**Effort:** 1 hour

#### Micro-tasks:

- [ ] 3.4.1 Move Playwright to devDependencies (15 min)
- [ ] 3.4.2 Update imports to conditionally load (20 min)
- [ ] 3.4.3 Verify test suite still works (15 min)
- [ ] 3.4.4 Check production bundle (10 min)

---

### Task 3.5: Fix Rate Limiter Instantiation

**Agent:** `typescript-dev`
**File:** `src/lib/middleware/auth.ts`
**Effort:** 1.5 hours

#### Micro-tasks:

- [ ] 3.5.1 Create singleton rate limiter instances (30 min)
  ```typescript
  // Create once at module level
  const rateLimiters = {
    default: new RateLimiter({ limit: 100, window: 60 }),
    status: new RateLimiter({ limit: 200, window: 60 }),
    generation: new RateLimiter({ limit: 10, window: 60 }),
  };
  ```
- [ ] 3.5.2 Update middleware to use singletons (20 min)
- [ ] 3.5.3 Benchmark before/after (20 min)
- [ ] 3.5.4 Add memory usage monitoring (20 min)

---

### Task 3.6: Fix ChatOrchestrator Re-renders

**Agent:** `typescript-dev`
**File:** `src/components/chat/ChatOrchestrator.tsx`
**Effort:** 3 hours

#### Micro-tasks:

- [ ] 3.6.1 Profile with React DevTools (30 min)
- [ ] 3.6.2 Add React.memo to child components (45 min)
- [ ] 3.6.3 Add useCallback for event handlers (30 min)
- [ ] 3.6.4 Optimize selector usage (30 min)
- [ ] 3.6.5 Verify render count reduction (30 min)
- [ ] 3.6.6 Before/after performance comparison (15 min)

---

### Task 3.7: Fix SSE Memory Leak

**Agent:** `typescript-dev`
**Effort:** 2 hours

#### Micro-tasks:

- [ ] 3.7.1 Add connection cleanup on client disconnect (30 min)
- [ ] 3.7.2 Implement connection tracking (30 min)
- [ ] 3.7.3 Add periodic cleanup of stale connections (30 min)
- [ ] 3.7.4 Test with connection drops (30 min)

---

### Phase 3 Verification Checklist

- [ ] 100 concurrent users don't exhaust connections
- [ ] Backup runs daily
- [ ] Mermaid loads lazily
- [ ] Production bundle excludes Playwright
- [ ] Rate limiters instantiated once
- [ ] Chat re-renders reduced by 80%
- [ ] SSE connections clean up properly

---

## PHASE 3B: UI/UX CRITICAL (Parallel with Phase 3)

**Timeline:** Days 8-10 (16-20 hours)
**Dependencies:** Phase 2 and 2B complete
**Parallel:** Run with Phase 3

### Task 3B.1: Fix useState Hook Misuse

**Agent:** `typescript-dev`
**File:** `src/components/audio-studio/AudioStudio.tsx:68-70`
**Effort:** 1 hour

#### Micro-tasks:

- [ ] 3B.1.1 Identify hooks violation (15 min)
- [ ] 3B.1.2 Refactor to follow Rules of Hooks (30 min)
- [ ] 3B.1.3 Test component renders correctly (15 min)

---

### Task 3B.2: Fix Type Casting to any

**Agent:** `typescript-dev`
**File:** `src/components/workflow/WorkflowStudio.tsx:39-40`
**Effort:** 1.5 hours

#### Micro-tasks:

- [ ] 3B.2.1 Identify proper types for cast (30 min)
- [ ] 3B.2.2 Create proper interface if missing (30 min)
- [ ] 3B.2.3 Remove `as any` cast (15 min)
- [ ] 3B.2.4 Verify TypeScript compiles (15 min)

---

### Task 3B.3: Add Polling Timeouts

**Agent:** `typescript-dev`
**Files:** Image/Video/Workflow status polling
**Effort:** 3 hours

#### Micro-tasks:

- [ ] 3B.3.1 Create polling utility with timeout (45 min)
  ```typescript
  async function pollWithTimeout<T>(
    fn: () => Promise<T>,
    options: { maxAttempts: number; interval: number; timeout: number },
  ) {
    const startTime = Date.now();
    let attempts = 0;
    while (attempts < options.maxAttempts && Date.now() - startTime < options.timeout) {
      const result = await fn();
      if (result) return result;
      await sleep(options.interval);
      attempts++;
    }
    throw new Error('Polling timeout');
  }
  ```
- [ ] 3B.3.2 Apply to image polling (30 min)
- [ ] 3B.3.3 Apply to video polling (30 min)
- [ ] 3B.3.4 Apply to workflow polling (30 min)
- [ ] 3B.3.5 Add user feedback on timeout (30 min)
- [ ] 3B.3.6 Test timeout scenarios (25 min)

---

### Task 3B.4: Add Critical ARIA Labels

**Agent:** `typescript-dev`
**Effort:** 4 hours

#### Micro-tasks:

- [ ] 3B.4.1 Audit all interactive elements (45 min)
- [ ] 3B.4.2 Add aria-label to buttons (45 min)
- [ ] 3B.4.3 Add aria-label to inputs (45 min)
- [ ] 3B.4.4 Add aria-live regions for status (30 min)
- [ ] 3B.4.5 Add role attributes where needed (30 min)
- [ ] 3B.4.6 Test with screen reader (45 min)

---

### Task 3B.5: Add Keyboard Navigation

**Agent:** `typescript-dev`
**Effort:** 4 hours

#### Micro-tasks:

- [ ] 3B.5.1 Add focus management to modals (45 min)
- [ ] 3B.5.2 Add keyboard shortcuts for common actions (45 min)
- [ ] 3B.5.3 Ensure tab order is logical (45 min)
- [ ] 3B.5.4 Add skip links for main content (30 min)
- [ ] 3B.5.5 Test keyboard-only navigation (45 min)
- [ ] 3B.5.6 Document keyboard shortcuts (30 min)

---

### Phase 3B Verification Checklist

- [ ] No React hooks violations
- [ ] No `as any` type casts
- [ ] Polling has 10-minute max timeout
- [ ] All interactive elements have ARIA labels
- [ ] Full keyboard navigation possible
- [ ] WCAG 2.1 Level A compliance

---

## PHASE 4: TESTING INFRASTRUCTURE

**Timeline:** Days 11-14 (24-32 hours)
**Dependencies:** Phases 3 and 3B complete
**Parallel:** None

### Task 4.1: Set Up Test Framework

**Agent:** `test-engineer`
**Effort:** 4 hours

#### Micro-tasks:

- [ ] 4.1.1 Configure Jest/Vitest for unit tests (1 hour)
- [ ] 4.1.2 Configure React Testing Library (45 min)
- [ ] 4.1.3 Set up test database (1 hour)
- [ ] 4.1.4 Add coverage reporting (30 min)
- [ ] 4.1.5 Add CI/CD test pipeline (45 min)

---

### Task 4.2: Write Critical Unit Tests

**Agent:** `test-engineer`
**Effort:** 8 hours

#### Micro-tasks:

- [ ] 4.2.1 UUID validation tests (30 min)
- [ ] 4.2.2 Webhook signature tests (45 min)
- [ ] 4.2.3 File upload validation tests (45 min)
- [ ] 4.2.4 Rate limiter tests (45 min)
- [ ] 4.2.5 Chat store tests (1 hour)
- [ ] 4.2.6 Training store tests (1 hour)
- [ ] 4.2.7 Worker manager tests (1 hour)
- [ ] 4.2.8 Provider timeout tests (1 hour)
- [ ] 4.2.9 Queue DLQ tests (1 hour)

---

### Task 4.3: Write Integration Tests

**Agent:** `test-engineer`
**Effort:** 6 hours

#### Micro-tasks:

- [ ] 4.3.1 Auth flow integration test (1 hour)
- [ ] 4.3.2 Image generation E2E (1 hour)
- [ ] 4.3.3 Video generation E2E (1 hour)
- [ ] 4.3.4 Audio generation E2E (1 hour)
- [ ] 4.3.5 Training job lifecycle (1 hour)
- [ ] 4.3.6 Webhook processing (1 hour)

---

### Task 4.4: Write Performance Tests

**Agent:** `perf-engineer` + `test-engineer`
**Effort:** 4 hours

#### Micro-tasks:

- [ ] 4.4.1 Set up k6 or similar (45 min)
- [ ] 4.4.2 API endpoint load tests (1 hour)
- [ ] 4.4.3 Concurrent user simulation (1 hour)
- [ ] 4.4.4 Memory leak detection tests (45 min)
- [ ] 4.4.5 Document performance baselines (30 min)

---

### Phase 4 Verification Checklist

- [ ] Test framework configured
- [ ] > 60% coverage on critical paths
- [ ] Integration tests pass
- [ ] Performance baselines established
- [ ] CI/CD runs tests on PRs

---

## PHASE 5: INTEGRATION TESTING & VALIDATION

**Timeline:** Days 15-17 (16-20 hours)
**Dependencies:** Phase 4 complete
**Parallel:** None (final validation)

### Task 5.1: Security Penetration Test

**Agent:** `security-reviewer`
**Effort:** 4 hours

#### Micro-tasks:

- [ ] 5.1.1 Run automated security scan (1 hour)
- [ ] 5.1.2 Manual injection testing (1 hour)
- [ ] 5.1.3 Webhook forgery attempts (45 min)
- [ ] 5.1.4 Auth bypass attempts (45 min)
- [ ] 5.1.5 Document findings (30 min)

**⚠️ HUMAN REVIEW REQUIRED:** Penetration test results

---

### Task 5.2: Load Testing

**Agent:** `perf-engineer`
**Effort:** 4 hours

#### Micro-tasks:

- [ ] 5.2.1 Simulate 100 concurrent users (1 hour)
- [ ] 5.2.2 Test database connection limits (45 min)
- [ ] 5.2.3 Test worker VRAM limits (45 min)
- [ ] 5.2.4 Measure response times under load (45 min)
- [ ] 5.2.5 Document bottlenecks (45 min)

---

### Task 5.3: Accessibility Audit

**Agent:** `typescript-dev`
**Effort:** 3 hours

#### Micro-tasks:

- [ ] 5.3.1 Run axe-core automated scan (30 min)
- [ ] 5.3.2 Manual screen reader testing (1 hour)
- [ ] 5.3.3 Keyboard navigation test (45 min)
- [ ] 5.3.4 Color contrast verification (30 min)
- [ ] 5.3.5 Document WCAG compliance (15 min)

---

### Task 5.4: Final Validation

**Agent:** All
**Effort:** 4 hours

#### Micro-tasks:

- [ ] 5.4.1 Run full test suite (30 min)
- [ ] 5.4.2 Manual smoke test all features (1.5 hours)
- [ ] 5.4.3 Review all audit items resolved (45 min)
- [ ] 5.4.4 Create release notes (30 min)
- [ ] 5.4.5 Final security sign-off (45 min)

**⚠️ HUMAN REVIEW REQUIRED:** Production deployment approval

---

## RISK MITIGATION

### Rollback Strategies

| Phase    | Rollback Strategy                  |
| -------- | ---------------------------------- |
| Phase 0  | Git revert; no data changes        |
| Phase 1  | Git revert; no data changes        |
| Phase 2  | Stop new workers; revert code      |
| Phase 2B | Git revert; clear localStorage     |
| Phase 3  | Revert Supabase config; git revert |
| Phase 3B | Git revert                         |
| Phase 4  | N/A (tests only)                   |
| Phase 5  | N/A (validation only)              |

### Monitoring During Rollout

- [ ] Error rate dashboard
- [ ] Response time monitoring
- [ ] Memory usage alerts
- [ ] Database connection alerts
- [ ] Worker health checks

---

## TEAM ASSIGNMENTS

| Agent Type          | Tasks                                                                   |
| ------------------- | ----------------------------------------------------------------------- |
| `security-reviewer` | 0.1, 0.2, 0.3, 0.4, 1.7, 5.1                                            |
| `typescript-dev`    | 0.1-0.4, 1.1-1.7, 2.1, 2.5-2.6, 2B.1-2B.2, 3.1, 3.3, 3.5-3.7, 3B.1-3B.5 |
| `python-dev`        | 2.1, 2.2, 2.3, 2.4, 2.7                                                 |
| `db-engineer`       | 3.1, 3.2                                                                |
| `perf-engineer`     | 3.3, 3.4, 4.4, 5.2                                                      |
| `test-engineer`     | 4.1-4.4                                                                 |

---

## SIGN-OFF REQUIREMENTS

- [ ] **Phase 0:** Security team lead approval
- [ ] **Phase 1:** API team lead approval
- [ ] **Phase 2:** Infrastructure team approval
- [ ] **Phase 3:** Performance baseline acceptance
- [ ] **Phase 4:** QA team sign-off
- [ ] **Phase 5:** CTO production approval

---

## APPENDIX: Parallel Execution Matrix

```
Day 1:     [Phase 0 - Emergency Security]
Day 2-3:   [Phase 1 - API Security Hardening]
Day 4-5:   [Phase 2 - Workers] || [Phase 2B - State]
Day 6-7:   [Phase 2 continued]
Day 8-10:  [Phase 3 - DB/Perf] || [Phase 3B - UI/UX]
Day 11-14: [Phase 4 - Testing]
Day 15-17: [Phase 5 - Validation]
```

**Total Calendar Time:** 17 days
**Total Engineering Hours:** 120-160 hours
**Recommended Team Size:** 2-3 engineers
