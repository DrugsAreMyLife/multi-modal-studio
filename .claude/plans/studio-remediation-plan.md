# Studio Remediation Plan - High-Level Decomposition

**Created**: 2026-01-28
**Status**: Completed
**Total Tasks**: 27 high-level tasks across 5 phases
**Estimated Duration**: 48-60 hours
**Parallel Opportunities**: 65% of tasks can run concurrently

---

## Executive Summary

This plan wires the remaining 11 simulated studio components to real worker infrastructure, completing the transition from `setTimeout` simulations to production-ready async pipelines.

### Current State

- **4 of 22 studios fully wired** (CreativeStudio, LexiconStudio, DimensionStudio, ForgeFabrication)
- **11 studios still use setTimeout simulations**
- Jest tests exist but aren't configured to run
- Some API routes are missing

### Target State

- All 22 studios wired to real worker backends
- Full test coverage with working Jest configuration
- Complete API documentation
- No mock data fallbacks

---

## Phase 1: Infrastructure Foundation

**Duration**: 8-10 hours | **Dependencies**: None | **Parallelizable**: Yes (100%)

| Task | Description                                     | Agent          | Priority | Est. Time |
| ---- | ----------------------------------------------- | -------------- | -------- | --------- |
| 1.1  | Create `/api/depth/estimate` route              | typescript-dev | High     | 2h        |
| 1.2  | Create `/api/audio/demix` route                 | typescript-dev | High     | 2h        |
| 1.3  | Create `/api/vfx/composite` route               | typescript-dev | High     | 2h        |
| 1.4  | Create `/api/grading/apply` route               | typescript-dev | Medium   | 2h        |
| 1.5  | Create `/api/retouch/inpaint` route             | typescript-dev | Medium   | 2h        |
| 1.6  | Extend JobSubmissionService with new worker IDs | typescript-dev | High     | 1.5h      |

**Deliverables**:

- 5 new API routes following existing `/api/segment` pattern
- Updated `job-submission-service.ts` with new worker mappings
- Type definitions for all new payloads

---

## Phase 2: Core Creative Studios

**Duration**: 12-16 hours | **Dependencies**: Phase 1 | **Parallelizable**: Partial

| Task | Description                           | Agent          | Priority | Depends On |
| ---- | ------------------------------------- | -------------- | -------- | ---------- |
| 2.1  | Wire RemixStudio to semantic LLM      | typescript-dev | High     | None       |
| 2.2  | Create StemStudio Zustand store       | typescript-dev | High     | None       |
| 2.3  | Wire StemStudio to `/api/audio/demix` | typescript-dev | High     | 1.2, 2.2   |
| 2.4  | Wire VFXStudio to SAM2/compositor     | typescript-dev | High     | 1.3        |

**Deliverables**:

- RemixStudio: Real VLM semantic transformation
- StemStudio: Audio stem separation with Demucs
- VFXStudio: Real compositing with SAM2 alpha matting

---

## Phase 3: Specialized Tools

**Duration**: 14-18 hours | **Dependencies**: Phase 1 | **Parallelizable**: Yes (100%)

| Task | Description                          | Agent          | Priority | Depends On |
| ---- | ------------------------------------ | -------------- | -------- | ---------- |
| 3.1  | Wire DepthStudio to depth API        | typescript-dev | Medium   | 1.1        |
| 3.2  | Wire GradingStudio to grading API    | typescript-dev | Medium   | 1.4        |
| 3.3  | Wire RetouchStudio to inpainting API | typescript-dev | Medium   | 1.5        |
| 3.4  | Wire NodeStudio to ComfyUI execution | typescript-dev | Medium   | None       |

**Deliverables**:

- DepthStudio: Real depth estimation with MiDaS/Depth-Anything
- GradingStudio: LUT application and upscaling
- RetouchStudio: Inpainting with mask drawing
- NodeStudio: ComfyUI workflow execution

---

## Phase 4: Supporting Tools

**Duration**: 12-16 hours | **Dependencies**: None | **Parallelizable**: Yes (with chains)

| Task | Description                          | Agent          | Priority | Depends On |
| ---- | ------------------------------------ | -------------- | -------- | ---------- |
| 4.1  | Create `/api/audio/master` route     | typescript-dev | Low      | None       |
| 4.2  | Wire AcousticStudio to mastering API | typescript-dev | Low      | 4.1        |
| 4.3  | Create `/api/audio/tts` route        | typescript-dev | Low      | None       |
| 4.4  | Wire AcousticForge to TTS API        | typescript-dev | Low      | 4.3        |
| 4.5  | Create `/api/video/stabilize` route  | typescript-dev | Low      | None       |
| 4.6  | Wire DirectorStudio to stabilization | typescript-dev | Low      | 4.5        |
| 4.7  | Wire ForgeStudio to training API     | typescript-dev | Low      | None       |

**Deliverables**:

- AcousticStudio: Audio mastering with LUFS normalization
- AcousticForge: TTS with voice cloning
- DirectorStudio: Video stabilization
- ForgeStudio: LoRA/Dreambooth training

---

## Phase 5: Testing & Cleanup

**Duration**: 8-12 hours | **Dependencies**: Phases 1-4 | **Parallelizable**: Partial

| Task | Description                         | Agent            | Priority | Depends On |
| ---- | ----------------------------------- | ---------------- | -------- | ---------- |
| 5.1  | Configure Jest/Vitest               | test-engineer    | High     | None       |
| 5.2  | Create API route unit tests         | test-engineer    | High     | 5.1        |
| 5.3  | Create integration tests            | test-engineer    | High     | 5.1        |
| 5.4  | Remove FALLBACK_MOCK_ASSETS         | typescript-dev   | Medium   | Phases 2-4 |
| 5.5  | Add worker health check integration | devops-engineer  | Medium   | None       |
| 5.6  | Documentation update                | quality-reviewer | Low      | Phases 1-4 |

**Deliverables**:

- Working Jest configuration with 80%+ coverage
- Unit tests for all new API routes
- Integration tests for all studio components
- Clean codebase with no mock fallbacks
- Complete API and component documentation

---

## Dependency Graph

```
Phase 1: [1.1] [1.2] [1.3] [1.4] [1.5] [1.6] (All Parallel)
           |     |     |     |     |
           v     v     v     v     v
Phase 2:        2.3   2.4              (after 1.2, 1.3)
          2.1   2.2                    (parallel, no deps)

Phase 3: [3.1] [3.2] [3.3] [3.4]       (All Parallel after Phase 1)

Phase 4: [4.1]->[4.2]  [4.3]->[4.4]  [4.5]->[4.6]  [4.7]
         (chains can run in parallel with each other)

Phase 5: [5.1]->[5.2]    [5.4] [5.5] [5.6] (Mixed)
              \->[5.3]
```

---

## Critical Path

**Total: 22 hours**

```
1.2 (2h) -> 2.2 (1.5h) -> 2.3 (3h) -> 5.1 (2h) -> 5.2 (4h) -> 5.3 (4h)
```

**Optimization**: Start test configuration (5.1) early while Phase 4 completes.

---

## Risk Assessment

| Risk                       | Impact                  | Probability | Mitigation                                 |
| -------------------------- | ----------------------- | ----------- | ------------------------------------------ |
| Python workers not running | API routes fail         | Medium      | Health checks with retry logic             |
| Redis unavailable          | No real-time progress   | Low         | Polling fallback in useJobProgress         |
| ComfyUI schema changes     | NodeStudio breaks       | Medium      | Version-lock API calls, schema validation  |
| LLM rate limiting          | Semantic analysis fails | Medium      | Existing rate limiter, exponential backoff |

---

## Agent Assignment Matrix

| Agent            | Tasks                   | Load  |
| ---------------- | ----------------------- | ----- |
| typescript-dev-1 | 1.1, 1.2, 1.6, 2.1      | 8.5h  |
| typescript-dev-2 | 1.3, 1.4, 2.2, 2.3      | 8.5h  |
| typescript-dev-3 | 1.5, 2.4, 3.1, 3.2      | 11h   |
| typescript-dev-4 | 3.3, 3.4, 4.1, 4.2      | 12.5h |
| typescript-dev-5 | 4.3, 4.4, 4.5, 4.6, 4.7 | 12.5h |
| typescript-dev-6 | 5.4                     | 1.5h  |
| test-engineer-1  | 5.1, 5.2                | 6h    |
| test-engineer-2  | 5.3                     | 4h    |
| devops-engineer  | 5.5                     | 2h    |
| quality-reviewer | 5.6                     | 2h    |

---

## Next Steps

1. Review this plan and the micro-task breakdown
2. Approve or request modifications
3. Begin parallel execution of Phase 1 tasks
4. Monitor progress via task tracking
