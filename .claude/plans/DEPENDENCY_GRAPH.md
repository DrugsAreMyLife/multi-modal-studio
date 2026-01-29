# Dependency Graph - Micro-Task Decomposition

## Visual Dependency Tree

```
BATCH 1: Foundation (Wave 1)
┌─────────────────────────────────────────────────────────────────┐
│ MT-1.1.1 │ MT-1.1.2 │ MT-1.1.3 │ MT-1.1.4 │ MT-1.1.5 │ MT-1.1.6 │
│ (Types)  │ (Results)│ (Health) │ (Segment)│ (Vector) │ (Redis)  │
│ MT-1.1.7 │ MT-1.1.8 │                                           │
│ (Verify) │ (Docs)   │         ALL 100% PARALLEL                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    (All dependencies resolved)
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
        v                                         v
    WAVE 2A                                   WAVE 2B & 2C
  Services                              Results Service & SAM2
  (Sequential)                          (Can Start Immediately!)
        │                                         │
        │ MT-1.2.1 ─┐                             │ MT-1.3.1 ─┐
        │ (Core)    │                             │ (Core)    │
        │           │                             │           │
        ├─ MT-1.2.2─┤ (Parallel within)          ├─ MT-1.3.2─┤ (Parallel)
        │ (Submit)  │                             │ (Wait)    │
        │           │                             │           │
        ├─ MT-1.2.3─┤                             ├─ MT-1.3.3─┤
        │ (Status)  │                             │ (Stream)  │
        │           │                             │           │
        ├─ MT-1.2.4─┤                             ├─ MT-1.3.4─┤
        │ (Ready)   │                             │ (Cleanup) │
        │           │                             │           │
        └─ MT-1.2.5─┘                             └─ MT-1.3.5─┘
        Test            │                             Test
                         │
        ┌────────────────┴────────────────────┬──────────────────┐
        │                                     │                  │
        v                                     v                  v
    WAVE 2C: SAM2 Worker (PARALLEL with 2A/2B)

    MT-1.4.1 (FastAPI) ─┐
                        ├─ MT-1.4.2 (Publish)
    (Parallel init)     │    └─ MT-1.4.3 (Progress)
                        │    └─ MT-1.4.4 (Errors)
                        └─ MT-1.4.5 (Outputs)
                           └─ MT-1.4.6 (Test)
```

---

## Critical Path Analysis

### Longest Sequential Dependency Chain (40 minutes)

```
Start
  │
  ├─ BATCH 1 (Types) .............. 10 min
  │         │
  │         ├─ BATCH 2 (Services + SAM2) .......... 10 min
  │         │         │
  │         │         ├─ BATCH 3 (Semantic + Background) . 12 min
  │         │         │         │
  │         │         │         ├─ BATCH 4 (SVG + Creative)  11 min
  │         │         │         │         │
  │         │         │         │         ├─ BATCH 5 (SSE + Hook) . 11 min
  │         │         │         │         │         │
  │         │         │         │         │         ├─ BATCH 6 (UI Wiring) ... 15 min
  │         │         │         │         │         │         │
  │         │         │         │         │         │         └─ BATCH 7 (Tests) .. 11 min
  │         │         │         │         │         │
  │         │         │         │         │         └─ BATCH 9 (Final Val) 10 min
  │         │         │         │         │
  │         │         │         │         └─ BATCH 8 (Docs) ... 9 min
  │         │         │         │
  │         │         │         └─ BATCH 7 (Tests - Parallel)
  │         │         │
  │         │         └─ BATCH 7 (Tests - Parallel)
  │         │
  │         └─ BATCH 7 (Tests - Parallel)
  │
  └─ BATCH 9 (Final Validation)
```

**Critical Path: 40 minutes (Types → Services → Semantic → Adobe → UI → Tests)**

---

## Parallelization Opportunities

### Ultra-High Parallelism Points (10-15 agents)

#### Point 1: BATCH 2, Waves 2/2b/2c

```
Wave 2:  Job Submission (2-3 agents)
Wave 2b: Job Results (2-3 agents)  ← PARALLEL
Wave 2c: SAM2 Worker (2-3 agents)  ← PARALLEL

Total: 6-9 agents, 0 blocking
Result: 3 tasks running in true parallel
```

#### Point 2: BATCH 3, Waves 5/5b/5c

```
Wave 5:  SemanticProcessor (2-3 agents)
Wave 5b: Semantic API (2-3 agents)  ← PARALLEL
Wave 5c: Background Removal (2-3 agents)  ← PARALLEL

Total: 6-9 agents, 0 blocking
Result: 3 task streams in true parallel
```

#### Point 3: BATCH 6, Waves 11/11b/11c/12/13 (MAXIMUM PARALLELISM)

```
Wave 11:  DimensionStudio (2-3 agents)
Wave 11b: CreativeStudio (2-3 agents)     ← PARALLEL
Wave 11c: ForgeFabrication (2-3 agents)   ← PARALLEL
Wave 12:  LexiconStudio + AssetNexus (3-4 agents)  ← PARALLEL
Wave 13:  WorkerStatusBar (2-3 agents)    ← PARALLEL

Total: 12-16 agents, 0 blocking
Result: 5 UI streams in true parallel
```

---

## Dependency Matrix

### Legend

- **→** Strict dependency (must wait)
- **‖** Can run parallel with (independent)
- **⊙** Blocking point (all depends wait)

### Batch 1 Dependencies

```
MT-1.1.1 ─┐
MT-1.1.2 ─┤
MT-1.1.3 ─┤
MT-1.1.4 ─┤ All Parallel (0 blocking)
MT-1.1.5 ─┤
MT-1.1.6 ─┤
MT-1.1.7 ─┤
MT-1.1.8 ─┘

Blocks: Everything in Batch 2
```

### Batch 2 Dependencies

```
MT-1.1.1 ─→ MT-1.2.1 ─→ MT-1.2.2 ─┐
                                   ├─ Blocking point for Batch 3
MT-1.1.6 ─→ MT-1.2.1             │
                                   ├─ Sequential chain 3 tasks
            MT-1.2.3 ──────────────┤
            MT-1.2.4 ──────────────┤
            MT-1.2.5 (Test) ────────┘

‖ MT-1.1.1 ─→ MT-1.3.1 ─→ MT-1.3.2 ─┐
‖ MT-1.1.2 ─→ MT-1.3.1 ─┬            ├─ Independent of Wave 2
                         ├ MT-1.3.3 ─┤  Parallel with Wave 2
                         ├ MT-1.3.4 ─┤
                         └ MT-1.3.5 ─┘

‖ MT-1.4.1 ─→ MT-1.4.2 ─→ MT-1.4.3 ─┐
             ├ MT-1.4.4 ─────────────┤ Completely independent
             └ MT-1.4.5 ─────────────┤ Can start immediately
                 └ MT-1.4.6 (Test) ──┘
```

### Batch 3 Dependencies

```
MT-1.2.1 ─→ MT-1.6.1 ─→ MT-1.6.2 ─→ MT-1.6.3 ─┐
MT-1.3.1 ─┘                                    ├─ SegmentationAPI
                                               ├─ Sequential chain 4
            MT-1.6.4 (Auth) ─────────────────────┤
            MT-1.6.5 (Logging) ───────────────────┤
            MT-1.6.6 (Test) ──────────────────────┘

(No deps) → MT-2.1.1 ─→ MT-2.1.2 ─┐
                      ├ MT-2.1.3 ─┤ LLMProvider
                      ├ MT-2.1.4 ─┤ Can start in parallel
                      └ MT-2.1.5 ─┤ with SegmentationAPI
                           └─ MT-2.1.6
                           └─ MT-2.1.7 (Test)

MT-2.1.1 → MT-2.2.1 → MT-2.2.2 ─┐
                      ├ MT-2.2.3 ─┤ Prompts
                      ├ MT-2.2.4 ─┤ Sequential but light
                      └ MT-2.2.5 ─┘

MT-2.1.5 → MT-2.3.1 → MT-2.3.2 ─┬─ SemanticProcessor
MT-2.2.2 ─┘              └─ MT-2.3.3
MT-2.2.4 ─┘                 └─ MT-2.3.4 (Cache)
                            └─ MT-2.3.5 (Compat)
                            └─ MT-2.3.6 (Test)

MT-2.3.1 → MT-2.4.1 → MT-2.4.2 ─┬─ SemanticAnalysisAPI
                      ├ MT-2.4.3 ─┤ Depends on SemanticProcessor
                      ├ MT-2.4.4 ─┤
                      └ MT-2.4.5 ─┘

MT-1.6.1 → MT-3.1.1 ─→ MT-3.1.2 ─┬─ BackgroundRemoval
MT-1.2.1 ─┘              ├ MT-3.1.3 ─┤
                         ├ MT-3.1.4 ─┤
                         ├ MT-3.1.5 ─┤
                         └ MT-3.1.6 ─┘

MT-3.1.2 → MT-3.2.1 ─┬─ AdobeAdapter
MT-2.3.1 ─┘          ├ MT-3.2.2 ─┐
                     ├ MT-3.2.3 ─┤ Integrates background removal
                     ├ MT-3.2.4 ─┤ and semantic processing
                     └ MT-3.2.5 ─┘
```

---

## Blocking Points

Only 2 major blocking points in entire dependency graph:

### Blocking Point 1: Wave 1 Completion

```
🛑 WAVE 1 (Types)
   ↓ (All 8 tasks must complete)
✓ BATCH 2 can begin (all 14 tasks unblock)
```

### Blocking Point 2: JobSubmissionService Core (MT-1.2.1)

```
🛑 MT-1.2.1 (Job Submission core)
   ├─→ MT-1.2.2, 1.2.3, 1.2.4, 1.2.5 (wait)
   ├─→ MT-1.6.1 (SegmentationAPI waits)
   ├─→ MT-3.1.1 (BackgroundRemoval waits)
   └─→ All downstream API routes wait
```

**Impact**: Medium (blocks API routes, not LLM or semantic)

---

## Fast-Path vs. Slow-Path Analysis

### Fast Path (No Blocking)

```
Types (Wave 1)
  └→ LLM Provider (MT-2.1.x) ─→ Semantic (MT-2.3.x) ─→ API (MT-2.4.x)
    Duration: 10 + 7 + 8 + 6 = 31 minutes
    Blocking: Only dependency is Type completion (Wave 1)
```

### Slow Path (Maximum Blocking)

```
Types (Wave 1)
  └→ Job Service (MT-1.2.1) ─→ Segmentation API (MT-1.6.x)
    └→ Background Removal (MT-3.1.x) ─→ UI Wiring (MT-4.x.x)
    Duration: 10 + 8 + 7 + 15 = 40 minutes
    Blocking: Every step waits for previous
```

### Optimal Path (Smart Scheduling)

```
Wave 1 (Types) .......................... 10 min
  ├─ Batch 2 (Services + Workers) ....... 10 min (parallel)
  │  ├─ Batch 3 (Semantic + Adobe) ..... 12 min
  │  └─ PARALLEL: Batch 4 (SVG) ....... 11 min
  │
  └─ PARALLEL: Batch 5 (SSE) ........... 11 min
     └─ Batch 6 (UI Wiring) ............ 15 min
        └─ Batch 7 (Tests) ............ 11 min

Critical Path: 1:39 (but many agents running in parallel)
```

---

## Dependency Severity Levels

### Level 1: Foundational (Must Complete First)

- Wave 1 (Types): All 8 tasks
- **Critical**: Blocks everything

### Level 2: Service Infrastructure (Unblocks APIs)

- MT-1.2.1 (Job Service core)
- MT-1.3.1 (Result Service core)
- MT-1.4.1 (SAM2 worker init)
- **Impact**: Blocks API routes and downstream services

### Level 3: API Routes & LLM (Unlocks UI)

- MT-1.6.x (Segmentation route)
- MT-2.1.x (LLM provider)
- MT-2.3.x (SemanticProcessor upgrade)
- **Impact**: Blocks UI component wiring

### Level 4: UI Components (Unlocks Testing)

- MT-4.x.x (All studio wiring)
- **Impact**: Blocks E2E tests

### Level 5: Non-Blocking (Can Run Anytime)

- MT-7.x.x (Documentation)
- MT-6.x.x (Tests with mocks)
- **Impact**: None - fully independent

---

## Parallel Execution Opportunities

### High-Parallelism Zones (>10 agents can run)

#### Zone 1: Batch 2, Waves 2/2b/2c

```
Agents can start: 8-10
Blocking: None between groups
Opportunity: Run Wave 2, 2b, 2c completely in parallel
```

#### Zone 2: Batch 3, Waves 5/5b/5c

```
Agents can start: 8-10
Blocking: None between groups
Opportunity: Run all three waves in parallel
```

#### Zone 3: Batch 6, Waves 11-13

```
Agents can start: 14-18
Blocking: None between studio components
Opportunity: Run all UI wiring in parallel (MAX PARALLELISM)
```

#### Zone 4: Batch 7, Waves 14-15

```
Agents can start: 10-12
Blocking: None between tests
Opportunity: Run all tests in parallel with mocks
```

---

## Dependency Resolution Order

### Recommended Agent Allocation Order

1. **Start with Batch 1, Wave 1**: 8 agents (types)
2. **After Wave 1, spawn Batch 2**: 10 agents (services + workers)
3. **After Batch 2, spawn Batch 3**: 10 agents (semantic + adobe)
4. **After Batch 2, spawn Batch 4**: 8 agents (SVG - can overlap)
5. **After Batch 3, spawn Batch 5**: 7 agents (SSE)
6. **After Batch 5, spawn Batch 6**: 15 agents (UI - max parallelism)
7. **After Batch 6, spawn Batch 7**: 12 agents (tests)
8. **After Batch 7, spawn Batch 8**: 7 agents (docs)
9. **After Batch 8, spawn Batch 9**: 5 agents (final validation)

---

## Estimated Execution Timeline with Agent Spawning

```
Timeline     Batch  Duration  Agents  Total in Flight
0:00 - 0:10  B1     10 min    8       8
0:10 - 0:20  B2     10 min    10      10
0:20 - 0:32  B3     12 min    10      15 (B2 overlap)
0:32 - 0:43  B4     11 min    8       18 (B2+B3 end, B4 starts)
0:43 - 0:54  B5     11 min    7       15 (B3 end, B5 starts)
0:54 - 1:09  B6     15 min    15      22 (MAX FLIGHT)
1:09 - 1:20  B7     11 min    12      12 (B6 + tests)
1:20 - 1:29  B8     9 min     7       7 (docs)
1:29 - 1:39  B9     10 min    5       5 (final validation)
```

**Key Insight**: Maximum agents in flight = 22 during Batch 6
**Optimal sweet spot**: 15-18 agents for comfortable execution

---

**Document Generated**: 2026-01-28
**Status**: Ready for reference during execution
