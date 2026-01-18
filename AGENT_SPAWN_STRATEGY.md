# Agent Spawn Strategy & Parallel Execution Guide

## Multi-Modal Generation Studio - 287 Micro-Tasks

**Purpose**: Guide for autonomous-orchestrator to spawn Haiku agents optimally
**Document Date**: January 17, 2026
**Total Agents to Spawn**: 5-10 per wave (recommended)
**Max Parallelization**: 20 tasks simultaneously

---

# Quick Reference: Phases at a Glance

| Phase            | Waves | Total Tasks | Recommended Agents     | Duration |
| ---------------- | ----- | ----------- | ---------------------- | -------- |
| 1: Observability | 4     | 48          | 2 DevOps + 1 DevTools  | 1h       |
| 2: Performance   | 3     | 27          | 2 Performance          | 45min    |
| 3: Security      | 3     | 30          | 2 Security             | 45min    |
| 4: Code Quality  | 3     | 36          | 2 Code Quality         | 1.5h     |
| 5: E2E Testing   | 4     | 35          | 2 QA + 1 Test Engineer | 1h       |
| 6: Documentation | 3     | 20          | 1 DevOps + 1 Writer    | 40min    |

---

# PHASE 1: Observability Foundation

## Wave Execution Strategy

### Wave 1.1: Installations & Configurations (Parallel Safe)

**Duration**: 10 min | **Max Concurrency**: 5 agents | **Tasks**: 5

```yaml
Batch 1 (Spawn 5 agents in parallel):
  - Agent 1: Task 1.1.1 (Sentry dependencies)
  - Agent 2: Task 1.2.1 (Web Vitals)
  - Agent 3: Task 1.3.1 (Health endpoint)
  - Agent 4: Task 1.4.1 (Bundle analyzer)
  - Agent 5: Task 1.5.1 (Winston logger)

Wait for all: ~5 min completion time
Continue to Wave 1.2
```

### Wave 1.2: Configuration Files (Sequential-Safe Parallelization)

**Duration**: 12 min | **Max Concurrency**: 6 agents | **Tasks**: 6

```yaml
Batch 2 (Spawn after Wave 1.1):
  - Agent 1: Task 1.1.2 (Sentry config)
  - Agent 2: Task 1.1.3 (Next.js Sentry)
  - Agent 3: Task 1.2.3 (Vercel Speed Insights)
  - Agent 4: Task 1.4.2 (Bundle script)
  - Agent 5: Task 1.5.2 (Logger config)
  - Agent 6: Task 1.5.3 (Logger functions)

Dependencies: All require Wave 1.1 completion
Wait for all: ~10 min completion time
Continue to Wave 1.3
```

### Wave 1.3: Integration & Middleware (Sequential Dependencies)

**Duration**: 14 min | **Max Concurrency**: 9 agents | **Tasks**: 9

```yaml
Batch 3 (Spawn after Wave 1.2):
  - Agent 1: Task 1.1.4 (SentryBoundary component)
  - Agent 2: Task 1.1.5 (Wrap layout)
  - Agent 3: Task 1.1.6 (API error middleware)
  - Agent 4: Task 1.2.2 (Web Vitals hook)
  - Agent 5: Task 1.3.2 (Health checks)
  - Agent 6: Task 1.4.4 (Integrate analyzer)
  - Agent 7: Task 1.5.4 (Request logger)
  - Agent 8: Task 1.5.5 (Add to middleware)
  - Agent 9: Task 1.5.6 (useLogger hook)

Dependencies: All require Wave 1.2 completion
Critical Path: 1.1.4 → 1.1.5 (same agent handles sequentially)
Wait for all: ~12 min completion time
Continue to Wave 1.4
```

### Wave 1.4: Testing, Docs, Verification (Final Wave)

**Duration**: 12 min | **Max Concurrency**: 12 agents | **Tasks**: 12

```yaml
Batch 4 (Spawn after Wave 1.3):
  - Agent 1: Task 1.1.7 (Env vars)
  - Agent 2: Task 1.1.8 (Test Sentry)
  - Agent 3: Task 1.2.4 (Analytics env)
  - Agent 4: Task 1.2.5 (Test analytics)
  - Agent 5: Task 1.3.3 (Monitor integration)
  - Agent 6: Task 1.3.4 (Health docs)
  - Agent 7: Task 1.4.3 (npm script)
  - Agent 8: Task 1.4.5 (Generate report)
  - Agent 9: Task 1.4.6 (Size targets doc)
  - Agent 10: Task 1.5.7 (Add to components)
  - Agent 11: Task 1.5.8 (Logs dashboard)
  - Agent 12: Task 1.5.9 (Env vars doc)

Dependencies: All require Wave 1.3 completion
Parallel Safe: No interdependencies between tasks
Wait for all: ~10 min completion time
→ PHASE 1 COMPLETE
```

---

# PHASE 2: Performance Optimization

## Wave Execution Strategy

**Dependency**: Can start once Phase 1 Wave 1 completes (no blocking requirements)

### Wave 2.1: Library Audits & Dynamic Wrappers (Parallel Safe)

**Duration**: 12 min | **Max Concurrency**: 8 agents | **Tasks**: 8

```yaml
Batch 1 (Spawn immediately after Phase 1 Wave 1):
  - Agent 1: Task 2.1.1 (Audit Mermaid)
  - Agent 2: Task 2.1.2 (Mermaid wrapper)
  - Agent 3: Task 2.2.1 (Audit Konva)
  - Agent 4: Task 2.2.2 (Konva wrapper)
  - Agent 5: Task 2.3.1 (Audit WaveSurfer)
  - Agent 6: Task 2.3.2 (WaveSurfer wrapper)
  - Agent 7: Task 2.4.1 (Audit Recharts)
  - Agent 8: Task 2.4.2 (Recharts wrapper)

Parallel Safe: All audits independent, all wrappers independent
Wait for all: ~10 min completion time
Continue to Wave 2.2
```

### Wave 2.2: Implementation & Loading States (Sequential within Layer)

**Duration**: 15 min | **Max Concurrency**: 9 agents | **Tasks**: 9

```yaml
Batch 2 (Spawn after Wave 2.1):
  - Agent 1: Task 2.1.3 (Replace Mermaid imports)
  - Agent 2: Task 2.1.4 (Mermaid skeleton)
  - Agent 3: Task 2.2.3 (Replace Konva imports)
  - Agent 4: Task 2.2.4 (Konva loading state)
  - Agent 5: Task 2.3.3 (Replace WaveSurfer imports)
  - Agent 6: Task 2.3.4 (WaveSurfer placeholder)
  - Agent 7: Task 2.4.3 (Replace Recharts imports)
  - Agent 8: Task 2.4.4 (Charts skeleton)
  - Agent 9: Task 2.4.5 (Error boundary)

Dependencies: Each agent needs its Wave 2.1 counterpart done
Note: Agents 2, 4, 6 can wait slightly for Agents 1, 3, 5
Actual Concurrency: Can run all 9 in parallel (staggered)
Wait for all: ~13 min completion time
Continue to Wave 2.3
```

### Wave 2.3: Verification & CI (Final Wave)

**Duration**: 12 min | **Max Concurrency**: 8 agents | **Tasks**: 8

```yaml
Batch 3 (Spawn after Wave 2.2):
  - Agent 1: Task 2.1.5 (Test Mermaid lazy load)
  - Agent 2: Task 2.2.5 (Test Konva lazy load)
  - Agent 3: Task 2.3.5 (Test WaveSurfer lazy load)
  - Agent 4: Task 2.4.6 (Test Recharts lazy load)
  - Agent 5: Task 2.5.1 (Run bundle analysis)
  - Agent 6: Task 2.5.2 (Verify impact)
  - Agent 7: Task 2.5.3 (Check size targets)
  - Agent 8: Task 2.5.4 (Add CI check)

Dependencies: 2.5.5-2.5.8 require Wave 2.2 complete
Critical: 2.5.1 should run before 2.5.2-2.5.3
Parallel Strategy: Tasks 1-4 parallel, then 5-8 (bundle analysis first)
Wait for all: ~10 min completion time
→ PHASE 2 COMPLETE
```

---

# PHASE 3: Security Hardening

## Wave Execution Strategy

**Dependency**: Can start alongside Phase 2, no hard dependencies

### Wave 3.1: Audits & Utility Modules (Parallel Safe)

**Duration**: 10 min | **Max Concurrency**: 4 agents | **Tasks**: 4

```yaml
Batch 1:
  - Agent 1: Task 3.1.1 (Audit CORS)
  - Agent 2: Task 3.2.1 (Create CSP middleware)
  - Agent 3: Task 3.3.1 (Audit external requests)
  - Agent 4: Task 3.4.1 (Create env schema)

Parallel Safe: All completely independent
Wait for all: ~8 min completion time
Continue to Wave 3.2
```

### Wave 3.2: Implementation & Integration (Sequential within Layer)

**Duration**: 18 min | **Max Concurrency**: 13 agents | **Tasks**: 13

```yaml
Batch 2 (Spawn after Wave 3.1):
  - Agent 1: Task 3.1.2 (CORS utility)
  - Agent 2: Task 3.1.3 (Apply CORS to routes)
  - Agent 3: Task 3.1.4 (Config allowed origins)
  - Agent 4: Task 3.2.2 (Define CSP directives)
  - Agent 5: Task 3.2.3 (Add CSP to headers)
  - Agent 6: Task 3.2.4 (Allow third-parties)
  - Agent 7: Task 3.3.2 (URL validator)
  - Agent 8: Task 3.3.3 (Block patterns)
  - Agent 9: Task 3.3.4 (Secure fetch)
  - Agent 10: Task 3.3.5 (Replace fetch calls)
  - Agent 11: Task 3.4.2 (Env validator)
  - Agent 12: Task 3.4.3 (Import at startup)
  - Agent 13: Task 3.4.4 (Sanitize logs)

Dependencies: Sequence within groups (CORS: 1→2→3→4, CSP: 4→5→6, etc.)
Actual Concurrency: ~8-10 parallel (staggered groups)
Wait for all: ~16 min completion time
Continue to Wave 3.3
```

### Wave 3.3: Testing & Documentation (Final Wave)

**Duration**: 12 min | **Max Concurrency**: 10 agents | **Tasks**: 10

```yaml
Batch 3 (Spawn after Wave 3.2):
  - Agent 1: Task 3.1.5 (CORS env var)
  - Agent 2: Task 3.1.6 (Test CORS)
  - Agent 3: Task 3.1.7 (CORS docs)
  - Agent 4: Task 3.2.5 (Test CSP)
  - Agent 5: Task 3.2.6 (CSP docs)
  - Agent 6: Task 3.2.7 (CSP report endpoint)
  - Agent 7: Task 3.2.8 (Test CSP reports)
  - Agent 8: Task 3.3.6 (Test SSRF)
  - Agent 9: Task 3.3.7 (Rate limit)
  - Agent 10: Task 3.4.5 (Env docs)

Dependencies: Each group somewhat sequential
Parallel Strategy: Run all 10 agents, some wait on previous batches
Wait for all: ~10 min completion time
→ PHASE 3 COMPLETE
```

---

# PHASE 4: Code Quality

## Wave Execution Strategy

**Dependency**: Can start in parallel with Phases 2-3, but ideally after Phase 1

### Wave 4.1: Audits & Planning (Parallel Safe)

**Duration**: 10 min | **Max Concurrency**: 5 agents | **Tasks**: 5

```yaml
Batch 1:
  - Agent 1: Task 4.1.1 (Audit API console)
  - Agent 2: Task 4.2.1 (Audit component console)
  - Agent 3: Task 4.3.1 (Audit lib console)
  - Agent 4: Task 4.4.1 (Audit any types)
  - Agent 5: Task 4.5.1 (Audit ESLint)

Parallel Safe: All analysis, no conflicts
Wait for all: ~8 min completion time
Continue to Wave 4.2
```

### Wave 4.2: Implementation (Large Sequential Batches)

**Duration**: 35 min | **Max Concurrency**: 13 agents | **Tasks**: 13

```yaml
Batch 2 (Spawn after Wave 4.1):
  - Agent 1: Task 4.1.2 (Add logger to API routes) [LARGE]
  - Agent 2: Task 4.1.3 (Replace console.log in APIs) [LARGE]
  - Agent 3: Task 4.1.4 (Replace console.warn in APIs) [LARGE]
  - Agent 4: Task 4.1.5 (Replace console.error in APIs) [LARGE]
  - Agent 5: Task 4.2.2 (Add logger hook to components) [LARGE]
  - Agent 6: Task 4.2.3 (Replace console.log in components) [LARGE]
  - Agent 7: Task 4.2.4 (Replace console.warn in components) [LARGE]
  - Agent 8: Task 4.2.5 (Replace console.error in components) [LARGE]
  - Agent 9: Task 4.3.2 (Replace console in stores) [MEDIUM]
  - Agent 10: Task 4.3.3 (Replace console in utils) [MEDIUM]
  - Agent 11: Task 4.4.2 (Create common types) [MEDIUM]
  - Agent 12: Task 4.4.3 (Replace any in APIs) [LARGE]
  - Agent 13: Task 4.4.4 (Replace any in components) [LARGE]

Dependencies: Groups are mostly independent
Parallelization: Can run all 13 simultaneously (different layers)
Note: Tasks 4.1.2 and 4.2.2 are large, expect 12-15min each
Wait for all: ~30 min completion time (longest tasks)
Continue to Wave 4.3
```

### Wave 4.3: Verification & Finalization (Final Wave)

**Duration**: 10 min | **Max Concurrency**: 7 agents | **Tasks**: 7

```yaml
Batch 3 (Spawn after Wave 4.2):
  - Agent 1: Task 4.1.6 (Verify no console in APIs)
  - Agent 2: Task 4.2.6 (Verify no console in components)
  - Agent 3: Task 4.3.4 (Verify no console in lib)
  - Agent 4: Task 4.4.5 (Replace any in stores)
  - Agent 5: Task 4.4.6 (Replace any in utils)
  - Agent 6: Task 4.4.7 (Verify no any types)
  - Agent 7: Task 4.4.8 (Run type check)

Parallel Safe: All independent checks/validations
Wait for all: ~8 min completion time
→ PHASE 4 COMPLETE
```

---

# PHASE 5: E2E Testing

## Wave Execution Strategy

**Dependency**: Can start once Phase 4 completes (needs clean codebase)

### Wave 5.1: Test Infrastructure (Sequential)

**Duration**: 12 min | **Max Concurrency**: 1 agent | **Tasks**: 7

```yaml
Batch 1 (Sequential - Must be in order):
  1. Agent 1: Task 5.1.1 (Verify Playwright)
  2. Agent 1: Task 5.1.2 (Create config)
  3. Agent 1: Task 5.1.3 (Create fixtures)
  4. Agent 1: Task 5.1.4 (Create POMs)
  5. Agent 1: Task 5.1.5 (Create utils)
  6. Agent 1: Task 5.1.6 (Template)
  7. Agent 1: Task 5.1.7 (npm scripts)

Sequential Requirement: Each task depends on previous infrastructure
Single Agent: Infrastructure tasks should be done by one QA engineer
Wait for all: ~12 min completion time
Continue to Wave 5.2
```

### Wave 5.2: Test Suite Implementation (Parallel per Suite)

**Duration**: 25 min | **Max Concurrency**: 12 agents | **Tasks**: 20

```yaml
Batch 2a (Auth Tests - Spawn after Wave 5.1):
  - Agent 1: Task 5.2.1 (Create auth suite)
  - Agent 2: Task 5.2.2 (Test registration)
  - Agent 3: Task 5.2.3 (Test validation)
  - Agent 4: Task 5.2.4 (Test login)
  - Agent 5: Task 5.2.5 (Test error handling)
  - Agent 6: Task 5.2.6 (Test persistence)
  - Agent 7: Task 5.2.7 (Test logout)

Batch 2b (Image Gen Tests - Spawn concurrently):
  - Agent 8: Task 5.3.1 (Create image suite)
  - Agent 9: Task 5.3.2 (Test generation)
  - Agent 10: Task 5.3.3 (Test models)
  - Agent 11: Task 5.3.4 (Test settings)
  - Agent 12: Task 5.3.5 (Test errors)

Batch 2c (Chat/Smoke - Spawn after 2a/2b start):
  - Agent 1 (from 2a): Task 5.4.1 (Create chat suite)
  - Agent 2 (from 2a): Task 5.4.2 (Test messaging)
  - Agent 3 (from 2a): Task 5.4.3 (Test models)
  - Agent 4 (from 2a): Task 5.4.4 (Test threads)
  - Agent 5 (from 2a): Task 5.4.5 (Test editing)
  - Agent 6 (from 2a): Task 5.4.6 (Test history)
  - Agent 8 (from 2b): Task 5.5.1 (Create smoke suite)
  - Agent 9 (from 2b): Task 5.5.2 (Test loads)
  - Agent 10 (from 2b): Task 5.5.3 (Test nav)
  - Agent 11 (from 2b): Task 5.5.4 (Test responsive)
  - Agent 12 (from 2b): Task 5.5.5 (Test no errors)

Strategy: Run all 12 agents in parallel (different test suites)
Wave Duration: 20-25min (longest suite implementation)
Continue to Wave 5.3
```

### Wave 5.3: Final Tests & Reporting (Sequential Execution)

**Duration**: 8 min | **Max Concurrency**: 2 agents | **Tasks**: 2

```yaml
Batch 3:
  - Agent 1: Task 5.5.6 (Run all tests)
  - Agent 2: Task 5.5.7 (Generate report)

Sequential: Task 5.5.6 must complete before 5.5.7
Wait time: ~10 min (test execution itself)
Then: ~1 min for report generation
→ PHASE 5 COMPLETE
```

---

# PHASE 6: Documentation & Deployment

## Wave Execution Strategy

**Dependency**: Can start once Phase 5 completes (final phase)

### Wave 6.1: Documentation & Env Setup (Parallel)

**Duration**: 12 min | **Max Concurrency**: 6 agents | **Tasks**: 6

```yaml
Batch 1:
  - Agent 1: Task 6.1.1 (Audit env vars)
  - Agent 2: Task 6.1.2 (Doc LLM keys)
  - Agent 3: Task 6.1.3 (Doc services)
  - Agent 4: Task 6.1.4 (Doc monitoring)
  - Agent 5: Task 6.1.5 (Doc database)
  - Agent 6: Task 6.1.6 (Create .env.local)

Parallel Safe: All independent documentation
Wait for all: ~8 min completion time
Continue to Wave 6.2
```

### Wave 6.2: Deployment Configuration (Sequential within Phase)

**Duration**: 15 min | **Max Concurrency**: 12 agents | **Tasks**: 12

```yaml
Batch 2 (Spawn after Wave 6.1):
  - Agent 1: Task 6.2.1 (Create guide)
  - Agent 2: Task 6.2.2 (Pre-deployment)
  - Agent 3: Task 6.2.3 (Vercel steps)
  - Agent 4: Task 6.2.4 (Env setup)
  - Agent 5: Task 6.2.5 (Post-deploy)
  - Agent 6: Task 6.2.6 (Rollback)
  - Agent 7: Task 6.3.1 (GitHub Actions dir)
  - Agent 8: Task 6.3.2 (Build workflow)
  - Agent 9: Task 6.3.3 (Deploy workflow)
  - Agent 10: Task 6.3.4 (Security scan)
  - Agent 11: Task 6.3.5 (Bundle size check)
  - Agent 12: Task 6.3.6 (Type check)

Dependencies: 6.2.1-6.2.6 can be parallel, 6.3.1-6.3.6 can be parallel
Actual Concurrency: Can run all 12 simultaneously
Wait for all: ~13 min completion time
Continue to Wave 6.3
```

### Wave 6.3: Production Verification (Final Wave)

**Duration**: 15 min | **Max Concurrency**: 7 agents | **Tasks**: 7

```yaml
Batch 3 (Spawn after Wave 6.2):
  - Agent 1: Task 6.4.1 (Create checklist)
  - Agent 2: Task 6.4.2 (Verify APIs)
  - Agent 3: Task 6.4.3 (Verify database)
  - Agent 4: Task 6.4.4 (Verify integrations)
  - Agent 5: Task 6.4.5 (Verify monitoring)
  - Agent 6: Task 6.4.6 (Load test)
  - Agent 7: Task 6.4.7 (Deployment report)

Dependencies: 6.4.2-6.4.6 should run after 6.4.1
Parallel Strategy: Run checklist creation, then verification in parallel
Actual: 6.4.1 blocks slightly, then 2-7 can run parallel
Wait for all: ~13 min completion time
→ PHASE 6 COMPLETE
→ ALL PHASES COMPLETE
```

---

# Optimal Spawn Schedule

## Day 1: Phases 1-2 (2-2.5 hours)

```
09:00 - Phase 1 Wave 1 [5 agents]  ← 10 min
09:15 - Phase 1 Wave 2 [6 agents]  ← 12 min
09:30 - Phase 1 Wave 3 [9 agents]  ← 14 min (while Wave 2 running)
09:45 - Phase 2 Wave 1 [8 agents]  ← 12 min (while Phase 1 Wave 3 running)
10:00 - Phase 1 Wave 4 [12 agents] ← 12 min (parallel with Phase 2 Wave 1)
10:15 - Phase 2 Wave 2 [9 agents]  ← 15 min
10:45 - Phase 2 Wave 3 [8 agents]  ← 12 min
11:00 - PHASES 1-2 COMPLETE
```

## Day 2: Phases 3-4 (2.5-3 hours)

```
09:00 - Phase 3 Wave 1 [4 agents]  ← 10 min
09:15 - Phase 3 Wave 2 [13 agents] ← 18 min
09:40 - Phase 4 Wave 1 [5 agents]  ← 10 min (while Phase 3 Wave 2 running)
09:50 - Phase 3 Wave 3 [10 agents] ← 12 min (parallel with Phase 4 Wave 1)
10:05 - Phase 4 Wave 2 [13 agents] ← 35 min
10:45 - Phase 4 Wave 3 [7 agents]  ← 10 min
11:00 - PHASES 3-4 COMPLETE
```

## Day 3: Phase 5 (1-1.5 hours)

```
09:00 - Phase 5 Wave 1 [1 agent]   ← 12 min (Sequential setup)
09:15 - Phase 5 Wave 2 [12 agents] ← 25 min (Parallel test creation)
09:45 - Phase 5 Wave 3 [2 agents]  ← 8 min (Test execution & report)
10:00 - PHASE 5 COMPLETE
```

## Day 4: Phase 6 + Verification (1.5-2 hours)

```
09:00 - Phase 6 Wave 1 [6 agents]  ← 12 min
09:15 - Phase 6 Wave 2 [12 agents] ← 15 min
09:35 - Phase 6 Wave 3 [7 agents]  ← 15 min
10:00 - PHASE 6 COMPLETE
10:00 - Final Verification (Manual)  ← 15-30 min
10:30 - ALL PHASES COMPLETE ✓
```

---

# Agent Resource Requirements

## Compute Resources Per Agent

- **Memory**: 2GB minimum, 4GB recommended
- **CPU**: 1 core (Haiku agents are lightweight)
- **Network**: Standard (API calls to OpenAI, file I/O)
- **Duration**: 5-10 minutes per micro-task average

## Recommended Team Composition

```
Phase 1: DevOps Engineer (2 agents max)
Phase 2: Performance Engineer (2 agents max)
Phase 3: Security Engineer (2 agents max)
Phase 4: Code Quality Lead (2 agents max)
Phase 5: QA Engineer + Test Engineer (3 agents max)
Phase 6: DevOps + Technical Writer (2 agents max)

Total Concurrent: 10-15 agents recommended
Peak Concurrency: 13 agents (Phase 4 Wave 2)
```

## Cost Estimation

- Haiku 4.5: $0.80 per 1M input tokens, $4 per 1M output tokens
- Average task: ~500 input tokens, ~200 output tokens
- Cost per task: ~$0.001-0.002
- Total 287 tasks: ~$0.40-0.60 for all agent executions
- Overhead (retries, analysis): ~$0.50-1.00 total

**Total Estimated Cost**: $1-2 for full parallel execution

---

# Spawn Command Template

```bash
# Spawn multiple agents in single batch (recommended)
spawn-agents \
  --batch \
  --count 5 \
  --tasks "1.1.1,1.2.1,1.3.1,1.4.1,1.5.1" \
  --timeout 600 \
  --retry 2 \
  --log-level INFO

# Monitor execution
watch-agents --batch-id <batch-id> --interval 10s

# After batch completes
report-batch --batch-id <batch-id> --format json
```

---

# Success Metrics

- **Execution Time**: < 8 hours total (vs 28-36 hours sequential)
- **Success Rate**: > 95% tasks pass first attempt
- **Build Status**: `npm run build` succeeds
- **Test Status**: All E2E tests pass (5.5.6)
- **Code Quality**: No TypeScript errors, ESLint passes
- **Deployment**: Production verification checklist complete

---

**Status**: READY FOR IMPLEMENTATION
**Recommended Start**: Monday 09:00
**Estimated Completion**: Friday 10:30 (4 days)
**Priority**: Execute in wave order (phases can overlap after Wave 1s)
