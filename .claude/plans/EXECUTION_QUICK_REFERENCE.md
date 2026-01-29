# Execution Quick Reference - Micro-Task Decomposition

## Start Here: Batch 1, Wave 1 (Immediate Launch)

These 8 tasks are fully parallelizable and form the foundation. **Launch all simultaneously:**

```yaml
Wave 1 Tasks (Launch Together):
  - MT-1.1.1: Create JobSubmission types
  - MT-1.1.2: Create JobResult types
  - MT-1.1.3: Create Worker Health types
  - MT-1.1.4: Create Segmentation types
  - MT-1.1.5: Create Vectorization types
  - MT-1.1.6: Create Redis channel constants
  - MT-1.1.7: Verify Redis connection
  - MT-1.1.8: Create job queue schema docs

Duration: 10 minutes
Agents: 8 typescript-dev agents
Parallelism: 100%
Blocking: None - fully independent
```

---

## Then: Wave 2 (Jobs Service), Wave 2b (Results Service), Wave 2c (SAM2 Worker)

**After Wave 1 completes, launch all three groups simultaneously (zero blocking between groups):**

### Wave 2: Job Submission Service (5 tasks)

```
Depends: MT-1.1.1, MT-1.1.6
Duration: ~8 minutes
Agents: 2 typescript-dev + 1 test-engineer
```

### Wave 2b: Job Result Service (5 tasks) ← PARALLEL with Wave 2

```
Depends: MT-1.1.1, MT-1.1.2
Duration: ~8 minutes
Agents: 2 typescript-dev + 1 test-engineer
```

### Wave 2c: SAM2 Worker Upgrade (6 tasks) ← PARALLEL with Wave 2

```
Depends: None (starts immediately)
Duration: ~8 minutes
Agents: 2 python-dev + 1 test-engineer
```

**Wave 2 Summary**: 14 tasks, 3 groups, ~8 minutes, 5 agents running parallel

---

## After Batch 1 Complete: Launch Batch 2 (Waves 3-4)

**Optimal: Start Wave 3, 3b, 3c simultaneously (zero blocking):**

### Wave 3: FastAPI Endpoints (5 tasks)

```
Depends: MT-1.4.5 (SAM2 outputs ready)
Duration: ~6 minutes
Agents: 2 python-dev + 1 test-engineer
```

### Wave 3b: Segmentation API Route (6 tasks) ← PARALLEL

```
Depends: MT-1.2.1, MT-1.3.1 (job services)
Duration: ~7 minutes
Agents: 2 typescript-dev + 1 test-engineer
```

### Wave 3c: LLM Provider Abstraction (7 tasks) ← PARALLEL

```
Depends: None
Duration: ~7 minutes
Agents: 3 typescript-dev + 1 test-engineer
```

### Wave 4: System Prompts (5 tasks)

```
Depends: MT-2.1.1 (LLM provider exists)
Duration: ~6 minutes
Agents: 2 typescript-dev
```

**Batch 2 Summary**: 23 tasks, ~10 minutes, 11 agents maximum parallelism

---

## Batch 3: Semantic Processing & Adobe (Waves 5-6)

**After Batch 2, launch Waves 5, 5b, 5c simultaneously:**

### Wave 5: SemanticProcessor + LLM (6 tasks)

```
Depends: MT-2.1.5 (LLM provider)
Duration: ~8 minutes
Agents: 2 typescript-dev + 1 test-engineer
```

### Wave 5b: Semantic API Route (5 tasks) ← PARALLEL

```
Depends: MT-2.3.1 (SemanticProcessor)
Duration: ~6 minutes
Agents: 2 typescript-dev + 1 test-engineer
```

### Wave 5c: Background Removal Service (6 tasks) ← PARALLEL

```
Depends: MT-1.6.1, MT-1.2.1 (segmentation API)
Duration: ~7 minutes
Agents: 2 typescript-dev + 1 test-engineer
```

### Wave 6: AdobeAdapter Real Operations (5 tasks)

```
Depends: MT-3.1.2, MT-2.3.1
Duration: ~6 minutes
Agents: 2 typescript-dev + 1 test-engineer
```

**Batch 3 Summary**: 17 tasks, ~12 minutes, 10 agents maximum

---

## Batch 4: SVG & Creative Operations (Waves 7-8)

**After Batch 3, launch Waves 7 and 7b simultaneously:**

### Wave 7: SVG-Turbo Worker (6 tasks)

```
Depends: None (can start after Batch 1)
Duration: ~7 minutes
Agents: 2 python-dev + 1 test-engineer
```

### Wave 7b: Creative Operations API (6 tasks) ← PARALLEL

```
Depends: MT-3.2.1 (AdobeAdapter)
Duration: ~7 minutes
Agents: 2 typescript-dev + 1 test-engineer
```

**Batch 4 Summary**: 12 tasks, ~11 minutes, 8 agents

---

## Batch 5: Real-time Progress (Waves 9-10)

### Wave 9: Server-Sent Events (7 tasks)

```
Depends: MT-1.3.1 (JobResultService)
Duration: ~7 minutes
Agents: 2 typescript-dev + 1 test-engineer
```

### Wave 10: useJobProgress Hook (6 tasks)

```
Depends: MT-5.1.2 (SSE endpoint)
Duration: ~7 minutes
Agents: 2 typescript-dev + 1 test-engineer
```

**Batch 5 Summary**: 13 tasks, ~11 minutes, 7 agents

---

## Batch 6: UI Wiring - HIGH PARALLELISM

**After Batch 5, launch ALL studio wiring in parallel (11, 11b, 11c, 12, 13):**

### Wave 11: DimensionStudio (7 tasks)

```
Depends: MT-5.2.1 (useJobProgress)
Duration: ~8 minutes
Agents: 2 typescript-dev + 1 test-engineer
```

### Wave 11b: CreativeStudio (6 tasks) ← PARALLEL

```
Depends: MT-5.2.1
Duration: ~7 minutes
Agents: 2 typescript-dev + 1 test-engineer
```

### Wave 11c: ForgeFabrication (6 tasks) ← PARALLEL

```
Depends: MT-2.3.1 (SemanticProcessor)
Duration: ~7 minutes
Agents: 2 typescript-dev + 1 test-engineer
```

### Wave 12: LexiconStudio (5 tasks) + AssetNexus (6 tasks) ← PARALLEL

```
Depends: MT-2.4.1, MT-3.1.1
Duration: ~7 minutes
Agents: 3 typescript-dev + 2 test-engineer
```

### Wave 13: WorkerStatusBar (6 tasks) ← PARALLEL

```
Depends: MT-1.2.1 (JobSubmissionService)
Duration: ~7 minutes
Agents: 2 typescript-dev + 1 test-engineer
```

**Batch 6 Summary**: 28 tasks, ~15 minutes, 15 agents maximum (highest parallelism!)

---

## Batch 7: Testing - FULLY PARALLEL

**After each component completes, tests can run. But optimal to batch all after Batch 6:**

### Wave 14: Unit Tests (8 tasks)

```
All tests run independently with mocks
Duration: ~7 minutes
Agents: 4 test-engineer agents
```

### Wave 15: Integration & E2E Tests (12 tasks) ← PARALLEL

```
All tests run independently with mocks
Duration: ~8 minutes
Agents: 6 test-engineer agents
```

**Batch 7 Summary**: 20 tasks, ~11 minutes, 12 agents

---

## Batch 8: Documentation & DevOps

### Wave 16: Documentation (4 tasks)

```
All independent
Duration: ~6 minutes
Agents: 2 devops-engineer
```

### Wave 16b: Docker & API Docs (9 tasks) ← PARALLEL

```
All independent
Duration: ~8 minutes
Agents: 3 devops-engineer
```

**Batch 8 Summary**: 12 tasks, ~9 minutes, 7 agents

---

## Batch 9: Final Validation

**After all previous batches complete:**

```
5 validation tasks (all parallel)
Duration: ~10 minutes
Agents: 3 test-engineer
```

---

## Total Execution Timeline

| Batch     | Duration    | Start Time | End Time | Max Agents |
| --------- | ----------- | ---------- | -------- | ---------- |
| 1         | 10 min      | 0:00       | 0:10     | 8          |
| 2         | 10 min      | 0:10       | 0:20     | 11         |
| 3         | 12 min      | 0:20       | 0:32     | 10         |
| 4         | 11 min      | 0:32       | 0:43     | 8          |
| 5         | 11 min      | 0:43       | 0:54     | 7          |
| 6         | 15 min      | 0:54       | 1:09     | 15         |
| 7         | 11 min      | 1:09       | 1:20     | 12         |
| 8         | 9 min       | 1:20       | 1:29     | 7          |
| 9         | 10 min      | 1:29       | 1:39     | 5          |
| **TOTAL** | **~90 min** | **0:00**   | **1:39** | **18-20**  |

---

## Agent Allocation Strategy

### Option 1: Max Throughput (25-30 agents)

- Use all available agents
- Run 15-20 agents in Batches 2-6
- Reduces timeline but requires more concurrent capacity
- **Estimated: 85-95 minutes**

### Option 2: Balanced (15-18 agents)

- Recommend for most setups
- Never exceed 15 concurrent agents
- Comfortable parallelism without bottleneck
- **Estimated: 90-100 minutes**

### Option 3: Conservative (8-10 agents)

- Lower concurrency, more sequential
- Good for resource-constrained environments
- **Estimated: 150-180 minutes**

---

## Critical Success Checklist

Before starting, verify:

- [ ] Redis is running (`redis-cli ping` returns PONG)
- [ ] Node.js environment ready
- [ ] Python 3.10+ with PyTorch available
- [ ] GPU detected (RTX 5090, 4090, or equivalent)
- [ ] All source directories exist:
  - [ ] `src/lib/types/`
  - [ ] `src/lib/services/`
  - [ ] `src/lib/llm/`
  - [ ] `src/lib/orchestration/`
  - [ ] `src/app/api/`
  - [ ] `src/components/`
  - [ ] `src/hooks/`
  - [ ] `scripts/`

---

## Monitoring & Checkpoints

### After Batch 1 (10 min)

- All type files created
- Redis connection verified
- Ready to proceed: Go / No-Go decision point

### After Batch 3 (32 min)

- All services implemented
- SAM2 worker upgraded and tested
- Semantic layer online
- Ready for API integration

### After Batch 6 (1:09)

- All UI components wired
- Real-time progress system working
- Worker status dashboard operational
- All manual testing complete

### After Batch 9 (1:39)

- All automated tests passing
- Documentation complete
- Docker configuration ready
- Ready for deployment

---

## Troubleshooting Quick Guide

### Task Takes Longer Than 10 min

- Check task granularity
- Verify dependencies are actually complete
- Consider splitting task further

### Dependency Not Met

- Check if prerequisite task actually completed
- Verify generated files exist
- Look for console errors from blocking task

### Agent Crashes

- Check for out-of-memory (OOM)
- Verify VRAM available
- Ensure Redis connectivity
- Check file permissions

### Redis Connection Fails

- Verify Redis is running: `redis-cli ping`
- Check Redis URL in environment
- Default: `redis://localhost:6379`

---

**Document Generated**: 2026-01-28
**Status**: Ready for orchestrator execution
