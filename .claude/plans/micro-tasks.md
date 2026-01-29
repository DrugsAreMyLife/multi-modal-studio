# Micro-Task Execution Plan: Semantic Layer to Worker Infrastructure Integration

**Created**: 2026-01-28
**Total Micro-Tasks**: 87
**Estimated Sequential Time**: 38-48 hours
**Estimated Parallel Time**: 4-5 hours (12x parallelization)
**Maximum Concurrent Agents**: 18-20

---

## PARALLEL BATCH 1: Phase 1 Foundation - Communication Layer (Waves 1-2)

### Wave 1: Type Definitions, Interfaces & Redis Setup (Start Immediately)

These 8 tasks establish all type definitions and can run fully in parallel.

- [ ] MT-1.1.1: Create JobSubmission and JobStatus TypeScript types - Agent: typescript-dev - File: `src/lib/types/job-submission.ts` - **Duration: 6 min** - [parallel: types_group_1]
- [ ] MT-1.1.2: Create JobResult and ProgressUpdate TypeScript types - Agent: typescript-dev - File: `src/lib/types/job-result.ts` - **Duration: 5 min** - [parallel: types_group_1]
- [ ] MT-1.1.3: Create Worker Health and Status response types - Agent: typescript-dev - File: `src/lib/types/worker-status.ts` - **Duration: 5 min** - [parallel: types_group_1]
- [ ] MT-1.1.4: Create SegmentationPayload and SegmentationResult types - Agent: typescript-dev - File: `src/lib/types/segmentation.ts` - **Duration: 6 min** - [parallel: types_group_1]
- [ ] MT-1.1.5: Create VectorizationPayload and VectorizationResult types - Agent: typescript-dev - File: `src/lib/types/vectorization.ts` - **Duration: 5 min** - [parallel: types_group_1]
- [ ] MT-1.1.6: Create Redis channel constants and helper utilities - Agent: typescript-dev - File: `src/lib/redis/channels.ts` - **Duration: 6 min** - [parallel: types_group_1]
- [ ] MT-1.1.7: Verify Redis connection in test environment - Agent: typescript-dev - File: `src/lib/redis/test-connection.ts` - **Duration: 5 min** - [parallel: types_group_1]
- [ ] MT-1.1.8: Create job queue schema documentation - Agent: typescript-dev - File: `.claude/schemas/job-queue-schema.md` - **Duration: 5 min** - [parallel: types_group_1]

### Wave 2: Job Submission Service (Depends: MT-1.1.1-1.1.6)

- [ ] MT-1.2.1: Create JobSubmissionService core class with constructor - Agent: typescript-dev - File: `src/lib/services/job-submission-service.ts` - **Duration: 7 min** - [depends: MT-1.1.1, MT-1.1.6]
- [ ] MT-1.2.2: Implement submitJob method with VRAM validation logic - Agent: typescript-dev - File: `src/lib/services/job-submission-service.ts` - **Duration: 8 min** - [depends: MT-1.2.1]
- [ ] MT-1.2.3: Implement getJobStatus method with Redis polling - Agent: typescript-dev - File: `src/lib/services/job-submission-service.ts` - **Duration: 6 min** - [depends: MT-1.2.1]
- [ ] MT-1.2.4: Add ensureWorkerReady integration to JobSubmissionService - Agent: typescript-dev - File: `src/lib/services/job-submission-service.ts` - **Duration: 5 min** - [depends: MT-1.2.1]
- [ ] MT-1.2.5: Write unit tests for JobSubmissionService - Agent: test-engineer - File: `__tests__/services/job-submission-service.test.ts` - **Duration: 8 min** - [depends: MT-1.2.1, MT-1.2.2, MT-1.2.3]

### Wave 2b: Job Result Service (Parallel with Wave 2)

- [ ] MT-1.3.1: Create JobResultService core class with Redis subscription - Agent: typescript-dev - File: `src/lib/services/job-result-service.ts` - **Duration: 8 min** - [parallel: job_result_group, depends: MT-1.1.1, MT-1.1.2]
- [ ] MT-1.3.2: Implement waitForResult method with timeout handling - Agent: typescript-dev - File: `src/lib/services/job-result-service.ts` - **Duration: 7 min** - [depends: MT-1.3.1]
- [ ] MT-1.3.3: Implement streamProgress method as AsyncIterator - Agent: typescript-dev - File: `src/lib/services/job-result-service.ts` - **Duration: 7 min** - [depends: MT-1.3.1]
- [ ] MT-1.3.4: Add subscription cleanup and memory leak prevention - Agent: typescript-dev - File: `src/lib/services/job-result-service.ts` - **Duration: 6 min** - [depends: MT-1.3.1]
- [ ] MT-1.3.5: Write unit tests for JobResultService - Agent: test-engineer - File: `__tests__/services/job-result-service.test.ts` - **Duration: 8 min** - [depends: MT-1.3.1, MT-1.3.2, MT-1.3.3]

### Wave 2c: SAM2 Worker Upgrade (Parallel with Wave 2)

- [ ] MT-1.4.1: Add FastAPI import and dependencies to sam2-worker.py - Agent: python-dev - File: `scripts/sam2-worker.py` - **Duration: 5 min** - [parallel: python_workers_group]
- [ ] MT-1.4.2: Refactor SAM2 worker to publish job-results to Redis channel - Agent: python-dev - File: `scripts/sam2-worker.py` - **Duration: 8 min** - [depends: MT-1.4.1]
- [ ] MT-1.4.3: Add progress event publishing (0%, 25%, 50%, 75%, 100%) to SAM2 worker - Agent: python-dev - File: `scripts/sam2-worker.py` - **Duration: 7 min** - [depends: MT-1.4.2]
- [ ] MT-1.4.4: Add error handling and error payload publishing in SAM2 worker - Agent: python-dev - File: `scripts/sam2-worker.py` - **Duration: 6 min** - [depends: MT-1.4.2]
- [ ] MT-1.4.5: Create outputs directory structure and save mask files in SAM2 worker - Agent: python-dev - File: `scripts/sam2-worker.py` - **Duration: 5 min** - [depends: MT-1.4.1]
- [ ] MT-1.4.6: Test SAM2 worker Redis publishing with mock job - Agent: test-engineer - File: `__tests__/workers/sam2-worker.test.py` - **Duration: 7 min** - [depends: MT-1.4.2, MT-1.4.3]

---

## PARALLEL BATCH 2: Phase 1 API Routes + Phase 2 LLM Layer (Waves 3-4)

### Wave 3: FastAPI Health/Status Endpoints for SAM2 (Depends: MT-1.4.5)

- [ ] MT-1.5.1: Create FastAPI boilerplate for SAM2 service on port 8006 - Agent: python-dev - File: `scripts/sam2-worker.py` - **Duration: 6 min** - [depends: MT-1.4.5]
- [ ] MT-1.5.2: Implement /health endpoint returning status, models_loaded, vram_used_mb - Agent: python-dev - File: `scripts/sam2-worker.py` - **Duration: 6 min** - [depends: MT-1.5.1]
- [ ] MT-1.5.3: Implement /segment POST endpoint for direct HTTP segmentation - Agent: python-dev - File: `scripts/sam2-worker.py` - **Duration: 7 min** - [depends: MT-1.5.1]
- [ ] MT-1.5.4: Implement /batch POST endpoint for job queue submission - Agent: python-dev - File: `scripts/sam2-worker.py` - **Duration: 6 min** - [depends: MT-1.5.1]
- [ ] MT-1.5.5: Test all SAM2 FastAPI endpoints with curl/Postman - Agent: test-engineer - File: `__tests__/workers/sam2-api.test.ts` - **Duration: 6 min** - [depends: MT-1.5.2, MT-1.5.3, MT-1.5.4]

### Wave 3b: API Route for Segmentation Operations (Parallel with Wave 3)

- [ ] MT-1.6.1: Create segmentation API route file and setup - Agent: typescript-dev - File: `src/app/api/segment/route.ts` - **Duration: 6 min** - [parallel: api_routes_group, depends: MT-1.2.1, MT-1.3.1]
- [ ] MT-1.6.2: Implement POST endpoint accepting imageUrl, points, labels, mode - Agent: typescript-dev - File: `src/app/api/segment/route.ts` - **Duration: 7 min** - [depends: MT-1.6.1]
- [ ] MT-1.6.3: Add async/sync mode selection and JobSubmissionService integration - Agent: typescript-dev - File: `src/app/api/segment/route.ts` - **Duration: 7 min** - [depends: MT-1.6.1]
- [ ] MT-1.6.4: Add authentication middleware to segmentation route - Agent: typescript-dev - File: `src/app/api/segment/route.ts` - **Duration: 5 min** - [depends: MT-1.6.1]
- [ ] MT-1.6.5: Add logging to generation history in segmentation endpoint - Agent: typescript-dev - File: `src/app/api/segment/route.ts` - **Duration: 6 min** - [depends: MT-1.6.1]
- [ ] MT-1.6.6: Write integration tests for /api/segment endpoint - Agent: test-engineer - File: `__tests__/api/segment.test.ts` - **Duration: 8 min** - [depends: MT-1.6.2, MT-1.6.3]

### Wave 3c: LLM Provider Abstraction (Parallel with Wave 3)

- [ ] MT-2.1.1: Create LLM provider interface supporting OpenAI, Anthropic, Ollama - Agent: typescript-dev - File: `src/lib/llm/semantic-llm-provider.ts` - **Duration: 8 min** - [parallel: llm_group]
- [ ] MT-2.1.2: Implement OpenAI GPT-4o provider backend - Agent: typescript-dev - File: `src/lib/llm/semantic-llm-provider.ts` - **Duration: 7 min** - [depends: MT-2.1.1]
- [ ] MT-2.1.3: Implement Anthropic Claude provider backend - Agent: typescript-dev - File: `src/lib/llm/semantic-llm-provider.ts` - **Duration: 7 min** - [depends: MT-2.1.1]
- [ ] MT-2.1.4: Implement local Ollama provider backend - Agent: typescript-dev - File: `src/lib/llm/semantic-llm-provider.ts` - **Duration: 6 min** - [depends: MT-2.1.1]
- [ ] MT-2.1.5: Export analyzeConstraints method with JSON mode structured output - Agent: typescript-dev - File: `src/lib/llm/semantic-llm-provider.ts` - **Duration: 6 min** - [depends: MT-2.1.2, MT-2.1.3, MT-2.1.4]
- [ ] MT-2.1.6: Add environment variable configuration (API keys, model selection) - Agent: typescript-dev - File: `src/lib/llm/semantic-llm-provider.ts` - **Duration: 5 min** - [depends: MT-2.1.1]
- [ ] MT-2.1.7: Write unit tests for LLM provider with mocks - Agent: test-engineer - File: `__tests__/llm/semantic-llm-provider.test.ts` - **Duration: 8 min** - [depends: MT-2.1.5]

### Wave 4: System Prompts for Domains (Depends: MT-2.1.1)

- [ ] MT-2.2.1: Create semantic prompts file with domain constants - Agent: typescript-dev - File: `src/lib/llm/prompts/semantic-prompts.ts` - **Duration: 5 min** - [depends: MT-2.1.1]
- [ ] MT-2.2.2: Write geometric domain system prompt (pitch, tolerances, dimensions) - Agent: typescript-dev - File: `src/lib/llm/prompts/semantic-prompts.ts` - **Duration: 6 min** - [depends: MT-2.2.1]
- [ ] MT-2.2.3: Write material domain system prompt (polymers, densities, thermal) - Agent: typescript-dev - File: `src/lib/llm/prompts/semantic-prompts.ts` - **Duration: 6 min** - [depends: MT-2.2.1]
- [ ] MT-2.2.4: Write creative domain system prompt (Adobe operations, filters) - Agent: typescript-dev - File: `src/lib/llm/prompts/semantic-prompts.ts` - **Duration: 6 min** - [depends: MT-2.2.1]
- [ ] MT-2.2.5: Write structural domain system prompt (load, safety factors) - Agent: typescript-dev - File: `src/lib/llm/prompts/semantic-prompts.ts` - **Duration: 5 min** - [depends: MT-2.2.1]

---

## PARALLEL BATCH 3: Phase 2 Semantic Processing + Phase 3 Background Removal (Waves 5-6)

### Wave 5: SemanticProcessor LLM Integration (Depends: MT-2.1.5, MT-2.2.5)

- [ ] MT-2.3.1: Modify SemanticProcessor.parseScript to call LLM backend - Agent: typescript-dev - File: `src/lib/orchestration/SemanticProcessor.ts` - **Duration: 7 min** - [depends: MT-2.1.5, MT-2.2.2]
- [ ] MT-2.3.2: Modify SemanticProcessor.parseCreativeIntent to call LLM for parsing - Agent: typescript-dev - File: `src/lib/orchestration/SemanticProcessor.ts` - **Duration: 7 min** - [depends: MT-2.1.5, MT-2.2.4]
- [ ] MT-2.3.3: Add confidence scores from LLM responses to SemanticProcessor - Agent: typescript-dev - File: `src/lib/orchestration/SemanticProcessor.ts` - **Duration: 6 min** - [depends: MT-2.3.1, MT-2.3.2]
- [ ] MT-2.3.4: Add Redis caching layer to SemanticProcessor to avoid redundant calls - Agent: typescript-dev - File: `src/lib/orchestration/SemanticProcessor.ts` - **Duration: 7 min** - [depends: MT-2.3.1]
- [ ] MT-2.3.5: Maintain backward compatibility in SemanticProcessor - Agent: typescript-dev - File: `src/lib/orchestration/SemanticProcessor.ts` - **Duration: 5 min** - [depends: MT-2.3.1, MT-2.3.2]
- [ ] MT-2.3.6: Test SemanticProcessor with real LLM calls - Agent: test-engineer - File: `__tests__/orchestration/semantic-processor.test.ts` - **Duration: 8 min** - [depends: MT-2.3.1, MT-2.3.2, MT-2.3.3]

### Wave 5b: Semantic Analysis API Route (Parallel with Wave 5)

- [ ] MT-2.4.1: Create semantic analysis API route - Agent: typescript-dev - File: `src/app/api/semantic/analyze/route.ts` - **Duration: 6 min** - [parallel: semantic_api_group, depends: MT-2.3.1]
- [ ] MT-2.4.2: Implement POST endpoint accepting text and domain parameters - Agent: typescript-dev - File: `src/app/api/semantic/analyze/route.ts` - **Duration: 6 min** - [depends: MT-2.4.1]
- [ ] MT-2.4.3: Add rate limiting per user to semantic analysis endpoint - Agent: typescript-dev - File: `src/app/api/semantic/analyze/route.ts` - **Duration: 6 min** - [depends: MT-2.4.1]
- [ ] MT-2.4.4: Add logging analysis results to PreprocessingRepo - Agent: typescript-dev - File: `src/app/api/semantic/analyze/route.ts` - **Duration: 5 min** - [depends: MT-2.4.1]
- [ ] MT-2.4.5: Write integration tests for semantic analysis endpoint - Agent: test-engineer - File: `__tests__/api/semantic-analyze.test.ts` - **Duration: 7 min** - [depends: MT-2.4.2, MT-2.4.3]

### Wave 5c: Background Removal Service (Parallel with Wave 5)

- [ ] MT-3.1.1: Create BackgroundRemovalService core class - Agent: typescript-dev - File: `src/lib/services/background-removal-service.ts` - **Duration: 7 min** - [parallel: adobe_services_group, depends: MT-1.6.1, MT-1.2.1]
- [ ] MT-3.1.2: Implement removeBackground method with SAM2 segmentation - Agent: typescript-dev - File: `src/lib/services/background-removal-service.ts` - **Duration: 8 min** - [depends: MT-3.1.1]
- [ ] MT-3.1.3: Add automatic subject detection via SAM2 - Agent: typescript-dev - File: `src/lib/services/background-removal-service.ts` - **Duration: 6 min** - [depends: MT-3.1.2]
- [ ] MT-3.1.4: Implement proper alpha channel handling in background removal - Agent: typescript-dev - File: `src/lib/services/background-removal-service.ts` - **Duration: 6 min** - [depends: MT-3.1.2]
- [ ] MT-3.1.5: Add storage of background removal results to PreprocessingRepo - Agent: typescript-dev - File: `src/lib/services/background-removal-service.ts` - **Duration: 5 min** - [depends: MT-3.1.2]
- [ ] MT-3.1.6: Test background removal service with sample images - Agent: test-engineer - File: `__tests__/services/background-removal-service.test.ts` - **Duration: 8 min** - [depends: MT-3.1.2, MT-3.1.4]

### Wave 6: AdobeAdapter Real Operations (Depends: MT-3.1.2, MT-2.3.1)

- [ ] MT-3.2.1: Update AdobeAdapter.executeCommand to call BackgroundRemovalService - Agent: typescript-dev - File: `src/lib/orchestration/AdobeAdapter.ts` - **Duration: 6 min** - [depends: MT-3.1.2]
- [ ] MT-3.2.2: Wire SVG-Turbo vectorization to AdobeAdapter - Agent: typescript-dev - File: `src/lib/orchestration/AdobeAdapter.ts` - **Duration: 7 min** - [depends: MT-3.1.2]
- [ ] MT-3.2.3: Return actual artifact URLs from AdobeAdapter operations - Agent: typescript-dev - File: `src/lib/orchestration/AdobeAdapter.ts` - **Duration: 5 min** - [depends: MT-3.2.1, MT-3.2.2]
- [ ] MT-3.2.4: Update PreprocessingRepo with real asset metadata in AdobeAdapter - Agent: typescript-dev - File: `src/lib/orchestration/AdobeAdapter.ts` - **Duration: 6 min** - [depends: MT-3.2.1]
- [ ] MT-3.2.5: Test AdobeAdapter with real service calls - Agent: test-engineer - File: `__tests__/orchestration/adobe-adapter.test.ts` - **Duration: 8 min** - [depends: MT-3.2.1, MT-3.2.2]

---

## PARALLEL BATCH 4: Phase 3 SVG Worker + Phase 3 Creative Operations Route (Waves 7-8)

### Wave 7: SVG-Turbo Worker Implementation (Parallel Safe)

- [ ] MT-3.3.1: Create SVG-Turbo worker FastAPI skeleton with Uvicorn on port 8008 - Agent: python-dev - File: `scripts/svg-turbo-worker.py` - **Duration: 6 min** - [parallel: svg_turbo_group]
- [ ] MT-3.3.2: Implement /vectorize POST endpoint for image-to-SVG conversion - Agent: python-dev - File: `scripts/svg-turbo-worker.py` - **Duration: 8 min** - [depends: MT-3.3.1]
- [ ] MT-3.3.3: Integrate potrace or vtracer for vectorization - Agent: python-dev - File: `scripts/svg-turbo-worker.py` - **Duration: 8 min** - [depends: MT-3.3.2]
- [ ] MT-3.3.4: Add /health endpoint following existing worker patterns - Agent: python-dev - File: `scripts/svg-turbo-worker.py` - **Duration: 5 min** - [depends: MT-3.3.1]
- [ ] MT-3.3.5: Add Redis job result publishing to SVG-Turbo worker - Agent: python-dev - File: `scripts/svg-turbo-worker.py` - **Duration: 6 min** - [depends: MT-3.3.2]
- [ ] MT-3.3.6: Test SVG-Turbo worker endpoints - Agent: test-engineer - File: `__tests__/workers/svg-turbo-worker.test.py` - **Duration: 6 min** - [depends: MT-3.3.2, MT-3.3.3]

### Wave 7b: Creative Operations API Route (Parallel with Wave 7)

- [ ] MT-3.4.1: Create creative operations API route file - Agent: typescript-dev - File: `src/app/api/creative/execute/route.ts` - **Duration: 6 min** - [parallel: creative_api_group, depends: MT-3.2.1]
- [ ] MT-3.4.2: Implement POST endpoint accepting command, assetId, imageUrl - Agent: typescript-dev - File: `src/app/api/creative/execute/route.ts` - **Duration: 7 min** - [depends: MT-3.4.1]
- [ ] MT-3.4.3: Wire semantic parsing via SemanticProcessor in creative endpoint - Agent: typescript-dev - File: `src/app/api/creative/execute/route.ts` - **Duration: 6 min** - [depends: MT-3.4.2]
- [ ] MT-3.4.4: Route to appropriate worker based on parsed operation - Agent: typescript-dev - File: `src/app/api/creative/execute/route.ts` - **Duration: 6 min** - [depends: MT-3.4.2]
- [ ] MT-3.4.5: Return operation status and artifactUrl in creative endpoint - Agent: typescript-dev - File: `src/app/api/creative/execute/route.ts` - **Duration: 5 min** - [depends: MT-3.4.2]
- [ ] MT-3.4.6: Write integration tests for creative operations endpoint - Agent: test-engineer - File: `__tests__/api/creative-execute.test.ts` - **Duration: 8 min** - [depends: MT-3.4.2, MT-3.4.3]

---

## PARALLEL BATCH 5: Phase 5 Real-time Progress System (Waves 9-10)

### Wave 9: Server-Sent Events Infrastructure (Parallel Safe)

- [ ] MT-5.1.1: Create SSE API route for job events - Agent: typescript-dev - File: `src/app/api/jobs/[jobId]/events/route.ts` - **Duration: 7 min** - [parallel: sse_group, depends: MT-1.3.1]
- [ ] MT-5.1.2: Implement GET endpoint returning SSE stream - Agent: typescript-dev - File: `src/app/api/jobs/[jobId]/events/route.ts` - **Duration: 6 min** - [depends: MT-5.1.1]
- [ ] MT-5.1.3: Emit progress events from job-result-service to SSE - Agent: typescript-dev - File: `src/app/api/jobs/[jobId]/events/route.ts` - **Duration: 7 min** - [depends: MT-5.1.2, MT-1.3.1]
- [ ] MT-5.1.4: Emit completed events to SSE - Agent: typescript-dev - File: `src/app/api/jobs/[jobId]/events/route.ts` - **Duration: 5 min** - [depends: MT-5.1.2]
- [ ] MT-5.1.5: Emit error events to SSE - Agent: typescript-dev - File: `src/app/api/jobs/[jobId]/events/route.ts` - **Duration: 5 min** - [depends: MT-5.1.2]
- [ ] MT-5.1.6: Handle client disconnect cleanup in SSE endpoint - Agent: typescript-dev - File: `src/app/api/jobs/[jobId]/events/route.ts` - **Duration: 5 min** - [depends: MT-5.1.2]
- [ ] MT-5.1.7: Test SSE endpoint with real stream consumption - Agent: test-engineer - File: `__tests__/api/jobs-events.test.ts` - **Duration: 7 min** - [depends: MT-5.1.2, MT-5.1.3]

### Wave 10: useJobProgress React Hook (Depends: MT-5.1.2)

- [ ] MT-5.2.1: Create useJobProgress hook file and TypeScript interface - Agent: typescript-dev - File: `src/hooks/useJobProgress.ts` - **Duration: 6 min** - [depends: MT-5.1.1, MT-1.3.1]
- [ ] MT-5.2.2: Implement core hook logic connecting to SSE endpoint - Agent: typescript-dev - File: `src/hooks/useJobProgress.ts` - **Duration: 8 min** - [depends: MT-5.2.1]
- [ ] MT-5.2.3: Add reconnection logic on SSE disconnect - Agent: typescript-dev - File: `src/hooks/useJobProgress.ts` - **Duration: 6 min** - [depends: MT-5.2.2]
- [ ] MT-5.2.4: Implement cleanup on component unmount - Agent: typescript-dev - File: `src/hooks/useJobProgress.ts` - **Duration: 5 min** - [depends: MT-5.2.2]
- [ ] MT-5.2.5: Export progress, status, result, error from hook - Agent: typescript-dev - File: `src/hooks/useJobProgress.ts` - **Duration: 5 min** - [depends: MT-5.2.2]
- [ ] MT-5.2.6: Test useJobProgress hook with mock SSE - Agent: test-engineer - File: `__tests__/hooks/useJobProgress.test.ts` - **Duration: 8 min** - [depends: MT-5.2.2, MT-5.2.3]

---

## PARALLEL BATCH 6: Phase 4 UI Component Wiring (Waves 11-13)

### Wave 11: DimensionStudio Wiring (Parallel Safe)

- [ ] MT-4.1.1: Add useJobProgress hook import and state to DimensionStudio - Agent: typescript-dev - File: `src/components/dimension-studio/DimensionStudio.tsx` - **Duration: 5 min** - [parallel: dimension_group, depends: MT-5.2.1]
- [ ] MT-4.1.2: Modify handleSegmentedScan to call /api/segment - Agent: typescript-dev - File: `src/components/dimension-studio/DimensionStudio.tsx` - **Duration: 7 min** - [depends: MT-4.1.1]
- [ ] MT-4.1.3: Map model selector to worker IDs in DimensionStudio - Agent: typescript-dev - File: `src/components/dimension-studio/DimensionStudio.tsx` - **Duration: 5 min** - [depends: MT-4.1.2]
- [ ] MT-4.1.4: Wire real-time progress display using useJobProgress - Agent: typescript-dev - File: `src/components/dimension-studio/DimensionStudio.tsx` - **Duration: 6 min** - [depends: MT-4.1.1, MT-4.1.2]
- [ ] MT-4.1.5: Replace setTimeout mock operations with real async calls - Agent: typescript-dev - File: `src/components/dimension-studio/DimensionStudio.tsx` - **Duration: 6 min** - [depends: MT-4.1.2]
- [ ] MT-4.1.6: Add worker status indicator component to DimensionStudio - Agent: typescript-dev - File: `src/components/dimension-studio/DimensionStudio.tsx` - **Duration: 5 min** - [depends: MT-4.1.1]
- [ ] MT-4.1.7: Test DimensionStudio wiring with Playwright - Agent: test-engineer - File: `__tests__/components/dimension-studio.test.tsx` - **Duration: 8 min** - [depends: MT-4.1.2, MT-4.1.4]

### Wave 11b: CreativeStudio Wiring (Parallel with Wave 11)

- [ ] MT-4.2.1: Add useJobProgress hook to CreativeStudio - Agent: typescript-dev - File: `src/components/creative-studio/CreativeStudio.tsx` - **Duration: 5 min** - [parallel: creative_studio_group, depends: MT-5.2.1]
- [ ] MT-4.2.2: Modify handleExecute to call /api/creative/execute - Agent: typescript-dev - File: `src/components/creative-studio/CreativeStudio.tsx` - **Duration: 7 min** - [depends: MT-4.2.1]
- [ ] MT-4.2.3: Wire real operation progress display in CreativeStudio - Agent: typescript-dev - File: `src/components/creative-studio/CreativeStudio.tsx` - **Duration: 6 min** - [depends: MT-4.2.2]
- [ ] MT-4.2.4: Update operation history with actual results - Agent: typescript-dev - File: `src/components/creative-studio/CreativeStudio.tsx` - **Duration: 5 min** - [depends: MT-4.2.2]
- [ ] MT-4.2.5: Add error handling for worker unavailability - Agent: typescript-dev - File: `src/components/creative-studio/CreativeStudio.tsx` - **Duration: 5 min** - [depends: MT-4.2.2]
- [ ] MT-4.2.6: Test CreativeStudio wiring with Playwright - Agent: test-engineer - File: `__tests__/components/creative-studio.test.tsx` - **Duration: 8 min** - [depends: MT-4.2.2, MT-4.2.3]

### Wave 11c: ForgeFabrication Wiring (Parallel with Wave 11)

- [ ] MT-4.3.1: Add SemanticProcessor integration to ForgeFabrication - Agent: typescript-dev - File: `src/components/forge-studio/ForgeFabrication.tsx` - **Duration: 6 min** - [parallel: forge_group, depends: MT-2.3.1]
- [ ] MT-4.3.2: Modify runIntegrityCheck to fetch real semantic constraints - Agent: typescript-dev - File: `src/components/forge-studio/ForgeFabrication.tsx` - **Duration: 6 min** - [depends: MT-4.3.1]
- [ ] MT-4.3.3: Wire FEA simulation to use real material properties - Agent: typescript-dev - File: `src/components/forge-studio/ForgeFabrication.tsx` - **Duration: 6 min** - [depends: MT-4.3.2]
- [ ] MT-4.3.4: Make progress bar reflect actual computation (not mocked) - Agent: typescript-dev - File: `src/components/forge-studio/ForgeFabrication.tsx` - **Duration: 5 min** - [depends: MT-4.3.2]
- [ ] MT-4.3.5: Generate actual G-Code from fabrication parameters - Agent: typescript-dev - File: `src/components/forge-studio/ForgeFabrication.tsx` - **Duration: 6 min** - [depends: MT-4.3.2]
- [ ] MT-4.3.6: Test ForgeFabrication with Playwright - Agent: test-engineer - File: `__tests__/components/forge-studio.test.tsx` - **Duration: 8 min** - [depends: MT-4.3.2, MT-4.3.3]

### Wave 12: LexiconStudio & AssetNexus Wiring (Parallel Safe)

- [ ] MT-4.4.1: Wire LexiconStudio to call LLM /api/semantic/analyze - Agent: typescript-dev - File: `src/components/lexicon-studio/LexiconStudio.tsx` - **Duration: 6 min** - [parallel: lexicon_asset_group, depends: MT-2.4.1]
- [ ] MT-4.4.2: Implement generateScript method calling real LLM API - Agent: typescript-dev - File: `src/components/lexicon-studio/LexiconStudio.tsx` - **Duration: 6 min** - [depends: MT-4.4.1]
- [ ] MT-4.4.3: Wire slider parameters to affect LLM API calls - Agent: typescript-dev - File: `src/components/lexicon-studio/LexiconStudio.tsx` - **Duration: 5 min** - [depends: MT-4.4.2]
- [ ] MT-4.4.4: Add real-time streaming of LLM content to LexiconStudio - Agent: typescript-dev - File: `src/components/lexicon-studio/LexiconStudio.tsx` - **Duration: 6 min** - [depends: MT-4.4.2]
- [ ] MT-4.4.5: Test LexiconStudio with Playwright - Agent: test-engineer - File: `__tests__/components/lexicon-studio.test.tsx` - **Duration: 7 min** - [depends: MT-4.4.2, MT-4.4.4]

- [ ] MT-4.5.1: Wire AssetNexus to PreprocessingRepo reactive subscription - Agent: typescript-dev - File: `src/components/asset-nexus/AssetNexus.tsx` - **Duration: 6 min** - [parallel: lexicon_asset_group, depends: MT-3.1.1]
- [ ] MT-4.5.2: Fetch real assets from preprocessing repo in AssetNexus - Agent: typescript-dev - File: `src/components/asset-nexus/AssetNexus.tsx` - **Duration: 6 min** - [depends: MT-4.5.1]
- [ ] MT-4.5.3: Wire semantic flow audit chain to show real data - Agent: typescript-dev - File: `src/components/asset-nexus/AssetNexus.tsx` - **Duration: 5 min** - [depends: MT-4.5.2]
- [ ] MT-4.5.4: Implement "Approve for Fabrication" to trigger real workflow - Agent: typescript-dev - File: `src/components/asset-nexus/AssetNexus.tsx` - **Duration: 6 min** - [depends: MT-4.5.2]
- [ ] MT-4.5.5: Add real-time updates on asset processing - Agent: typescript-dev - File: `src/components/asset-nexus/AssetNexus.tsx` - **Duration: 5 min** - [depends: MT-4.5.2]
- [ ] MT-4.5.6: Test AssetNexus with Playwright - Agent: test-engineer - File: `__tests__/components/asset-nexus.test.tsx` - **Duration: 8 min** - [depends: MT-4.5.2, MT-4.5.3]

### Wave 13: Worker Status Dashboard (Parallel Safe)

- [ ] MT-4.6.1: Create WorkerStatusBar reusable component - Agent: typescript-dev - File: `src/components/shared/WorkerStatusBar.tsx` - **Duration: 6 min** - [parallel: dashboard_group, depends: MT-1.2.1]
- [ ] MT-4.6.2: Display all worker statuses in dashboard - Agent: typescript-dev - File: `src/components/shared/WorkerStatusBar.tsx` - **Duration: 6 min** - [depends: MT-4.6.1]
- [ ] MT-4.6.3: Add VRAM usage bar visualization with current/total - Agent: typescript-dev - File: `src/components/shared/WorkerStatusBar.tsx` - **Duration: 6 min** - [depends: MT-4.6.1]
- [ ] MT-4.6.4: Implement Start/Stop controls per worker - Agent: typescript-dev - File: `src/components/shared/WorkerStatusBar.tsx` - **Duration: 6 min** - [depends: MT-4.6.1]
- [ ] MT-4.6.5: Auto-refresh worker status every 5 seconds - Agent: typescript-dev - File: `src/components/shared/WorkerStatusBar.tsx` - **Duration: 5 min** - [depends: MT-4.6.1]
- [ ] MT-4.6.6: Test WorkerStatusBar component - Agent: test-engineer - File: `__tests__/components/worker-status-bar.test.tsx` - **Duration: 7 min** - [depends: MT-4.6.2, MT-4.6.4]

---

## PARALLEL BATCH 7: Phase 6 Comprehensive Testing (Waves 14-15)

### Wave 14: Unit Tests for Services (Parallel Safe)

- [ ] MT-6.1.1: Test JobSubmissionService successful submissions - Agent: test-engineer - File: `__tests__/services/job-submission-service.test.ts` - **Duration: 7 min** - [parallel: service_tests_group, depends: MT-1.2.1]
- [ ] MT-6.1.2: Test JobSubmissionService VRAM unavailability handling - Agent: test-engineer - File: `__tests__/services/job-submission-service.test.ts` - **Duration: 6 min** - [depends: MT-1.2.1]
- [ ] MT-6.1.3: Test JobSubmissionService worker not ready scenarios - Agent: test-engineer - File: `__tests__/services/job-submission-service.test.ts` - **Duration: 5 min** - [depends: MT-1.2.1]
- [ ] MT-6.1.4: Mock Redis/BullMQ interactions in submission tests - Agent: test-engineer - File: `__tests__/services/job-submission-service.test.ts` - **Duration: 6 min** - [depends: MT-1.2.1]

- [ ] MT-6.2.1: Test SemanticProcessor constraint extraction variations - Agent: test-engineer - File: `__tests__/orchestration/semantic-processor.test.ts` - **Duration: 6 min** - [parallel: service_tests_group, depends: MT-2.3.1]
- [ ] MT-6.2.2: Test SemanticProcessor creative intent parsing - Agent: test-engineer - File: `__tests__/orchestration/semantic-processor.test.ts` - **Duration: 6 min** - [depends: MT-2.3.1]
- [ ] MT-6.2.3: Test SemanticProcessor LLM integration with mocks - Agent: test-engineer - File: `__tests__/orchestration/semantic-processor.test.ts` - **Duration: 6 min** - [depends: MT-2.3.1]
- [ ] MT-6.2.4: Test SemanticProcessor caching behavior - Agent: test-engineer - File: `__tests__/orchestration/semantic-processor.test.ts` - **Duration: 5 min** - [depends: MT-2.3.4]

### Wave 15: Integration Tests (Parallel Safe)

- [ ] MT-6.3.1: E2E test SAM2 pipeline (upload -> segment -> masks) - Agent: test-engineer - File: `__tests__/integration/sam2-pipeline.test.ts` - **Duration: 8 min** - [parallel: integration_tests_group, depends: MT-1.6.1, MT-3.1.1]
- [ ] MT-6.3.2: Test SAM2 timeout handling - Agent: test-engineer - File: `__tests__/integration/sam2-pipeline.test.ts` - **Duration: 6 min** - [depends: MT-1.6.1]
- [ ] MT-6.3.3: Test SAM2 error propagation - Agent: test-engineer - File: `__tests__/integration/sam2-pipeline.test.ts` - **Duration: 5 min** - [depends: MT-1.6.1]

- [ ] MT-6.4.1: E2E Playwright test DimensionStudio flow (prompt -> generate) - Agent: test-engineer - File: `__tests__/e2e/dimension-studio.test.ts` - **Duration: 8 min** - [parallel: integration_tests_group, depends: MT-4.1.1]
- [ ] MT-6.4.2: Test DimensionStudio model switching - Agent: test-engineer - File: `__tests__/e2e/dimension-studio.test.ts` - **Duration: 6 min** - [depends: MT-4.1.1]
- [ ] MT-6.4.3: Test DimensionStudio worker status display - Agent: test-engineer - File: `__tests__/e2e/dimension-studio.test.ts` - **Duration: 5 min** - [depends: MT-4.6.1]
- [ ] MT-6.4.4: Visual regression screenshots for DimensionStudio - Agent: test-engineer - File: `__tests__/e2e/dimension-studio-screenshots.test.ts` - **Duration: 6 min** - [depends: MT-4.1.1]

- [ ] MT-6.5.1: Load test concurrent submissions (10, 50, 100) - Agent: test-engineer - File: `__tests__/load/queue-load.test.ts` - **Duration: 8 min** - [parallel: integration_tests_group, depends: MT-1.2.1]
- [ ] MT-6.5.2: Measure queue latency under load - Agent: test-engineer - File: `__tests__/load/queue-load.test.ts` - **Duration: 6 min** - [depends: MT-1.2.1]
- [ ] MT-6.5.3: Identify bottlenecks in worker queue - Agent: test-engineer - File: `__tests__/load/queue-load.test.ts` - **Duration: 6 min** - [depends: MT-1.2.1]
- [ ] MT-6.5.4: Document VRAM contention scenarios - Agent: test-engineer - File: `.claude/docs/vram-contention.md` - **Duration: 5 min** - [depends: MT-1.2.1]

---

## PARALLEL BATCH 8: Phase 7 Documentation & DevOps (Waves 16-17)

### Wave 16: Documentation (Parallel Safe)

- [ ] MT-7.1.1: Write worker setup README section - Agent: devops-engineer - File: `README.md` - **Duration: 6 min** - [parallel: docs_group]
- [ ] MT-7.1.2: Document environment variables for all workers - Agent: devops-engineer - File: `docs/ENVIRONMENT.md` - **Duration: 6 min** - [parallel: docs_group]
- [ ] MT-7.1.3: Create troubleshooting guide for worker issues - Agent: devops-engineer - File: `docs/TROUBLESHOOTING.md` - **Duration: 7 min** - [parallel: docs_group]
- [ ] MT-7.1.4: Document VRAM requirements per worker - Agent: devops-engineer - File: `docs/VRAM_REQUIREMENTS.md` - **Duration: 5 min** - [parallel: docs_group]

- [ ] MT-7.2.1: Create docker-compose.workers.yml file - Agent: devops-engineer - File: `docker-compose.workers.yml` - **Duration: 8 min** - [parallel: devops_group]
- [ ] MT-7.2.2: Configure GPU passthrough in docker-compose - Agent: devops-engineer - File: `docker-compose.workers.yml` - **Duration: 7 min** - [depends: MT-7.2.1]
- [ ] MT-7.2.3: Add health check definitions to docker-compose - Agent: devops-engineer - File: `docker-compose.workers.yml` - **Duration: 6 min** - [depends: MT-7.2.1]
- [ ] MT-7.2.4: Create environment variable templates for docker-compose - Agent: devops-engineer - File: `.env.workers.template` - **Duration: 5 min** - [depends: MT-7.2.1]

- [ ] MT-7.3.1: Generate OpenAPI spec for new API endpoints - Agent: devops-engineer - File: `docs/openapi.json` - **Duration: 7 min** - [parallel: devops_group]
- [ ] MT-7.3.2: Document /api/segment endpoint with examples - Agent: devops-engineer - File: `docs/API.md` - **Duration: 6 min** - [parallel: devops_group]
- [ ] MT-7.3.3: Document /api/semantic/analyze endpoint with examples - Agent: devops-engineer - File: `docs/API.md` - **Duration: 6 min** - [parallel: devops_group]
- [ ] MT-7.3.4: Document /api/creative/execute endpoint with examples - Agent: devops-engineer - File: `docs/API.md` - **Duration: 5 min** - [parallel: devops_group]
- [ ] MT-7.3.5: Document error codes and status responses - Agent: devops-engineer - File: `docs/ERRORS.md` - **Duration: 5 min** - [parallel: devops_group]

---

## PARALLEL BATCH 9: Final Validation & Integration Tests (Wave 18)

### Wave 18: End-to-End Validation (Parallel Safe)

- [ ] MT-FINAL-1: Run full test suite for all services and API routes - Agent: test-engineer - File: `__tests__/suite.test.ts` - **Duration: 10 min** - [parallel: final_validation_group, depends: all]
- [ ] MT-FINAL-2: Validate all workers start and become ready - Agent: test-engineer - File: `__tests__/validation/worker-startup.test.ts` - **Duration: 8 min** - [parallel: final_validation_group, depends: MT-1.4.1, MT-3.3.1]
- [ ] MT-FINAL-3: Validate semantic layer end-to-end (text -> LLM -> constraints) - Agent: test-engineer - File: `__tests__/validation/semantic-layer.test.ts` - **Duration: 10 min** - [parallel: final_validation_group, depends: MT-2.1.5, MT-2.3.1]
- [ ] MT-FINAL-4: Validate UI components communicate with APIs - Agent: test-engineer - File: `__tests__/validation/ui-integration.test.ts` - **Duration: 10 min** - [parallel: final_validation_group, depends: MT-4.1.1, MT-4.2.1, MT-4.3.1]
- [ ] MT-FINAL-5: Performance validation - check response times - Agent: test-engineer - File: `__tests__/validation/performance.test.ts` - **Duration: 8 min** - [parallel: final_validation_group]

---

## Parallelization Summary

| Batch     | Waves        | Wave Duration | Total Tasks | Max Parallel | Bottlenecks                       |
| --------- | ------------ | ------------- | ----------- | ------------ | --------------------------------- |
| 1         | 1-2          | 10 min        | 14          | 8 (Wave 1)   | None - fully parallel             |
| 2         | 3-4          | 10 min        | 23          | 11 (Wave 3)  | Task dependencies sequential      |
| 3         | 5-6          | 12 min        | 17          | 10 (Wave 5)  | SAM2 must complete before OAuth   |
| 4         | 7-8          | 11 min        | 12          | 8 (Wave 7)   | SVG-Turbo and API parallel        |
| 5         | 9-10         | 11 min        | 13          | 7 (Wave 9)   | Hook depends on SSE               |
| 6         | 11-13        | 15 min        | 28          | 10 (Wave 11) | UI components can run in parallel |
| 7         | 14-15        | 11 min        | 20          | 12 (Wave 15) | Tests fully parallel              |
| 8         | 16-17        | 9 min         | 12          | 7 (Wave 16)  | Docs fully parallel               |
| 9         | 18           | 10 min        | 5           | 5 (Wave 18)  | Final validation                  |
| **TOTAL** | **18 Waves** | **~90 min**   | **87**      | **18**       | **Minimal**                       |

---

## Key Parallelization Strategies

### Strategy 1: Type-First Approach (Batch 1, Wave 1)

All TypeScript type definitions created in parallel before services. This unblocks 100% of subsequent work.

### Strategy 2: Service Layer Parallelization (Batch 2, Waves 2-3)

JobSubmissionService, JobResultService, and SAM2 worker run in parallel. No dependencies between them.

### Strategy 3: Semantic Pipeline (Batch 3, Waves 5-6)

LLM provider creation, SemanticProcessor upgrade, and BackgroundRemovalService can run concurrently.

### Strategy 4: Worker Implementation (Batches 2-4)

Python workers (SAM2, SVG-Turbo) and TypeScript services run simultaneously. Zero contention.

### Strategy 5: UI Component Independence (Batch 6, Waves 11-13)

Each studio component can be wired independently. No cross-component dependencies.

### Strategy 6: Test Parallelization (Batch 7, Waves 14-15)

Service tests, integration tests, and E2E tests run simultaneously. No shared test dependencies.

---

## Critical Success Factors

1. **Type Safety First**: All types defined before implementation
2. **Redis-Based Communication**: Async job queue prevents blocking
3. **Worker Independence**: Each worker starts/stops independently
4. **Progress Streaming**: SSE allows real-time feedback without polling
5. **Semantic Caching**: Reduces redundant LLM calls (Redis cache layer)
6. **VRAM Awareness**: JobSubmissionService ensures VRAM availability
7. **Testing Strategy**: Unit + Integration + E2E tests run in parallel

---

## Execution Recommendations

### Immediate Actions (Batch 1, Wave 1)

Start all 8 type definition tasks immediately - they are the foundation.

### High-Priority Path (Batches 2-3)

- Focus on Phase 1 (communication layer) - enables all later work
- Run Phase 2 (LLM) in parallel with Phase 1
- Phase 3 (Adobe) can start once Phase 1 completes

### Parallelization Sweet Spot

Run 12-15 agents simultaneously during Batches 2-4 for maximum throughput.

### Critical Dependencies

- Types → Services → API Routes → UI Components → Tests
- Worker scripts can start immediately alongside Types

### Final Validation

Only run MT-FINAL-1 through MT-FINAL-5 after all previous batches complete.

---

## Estimated Timeline

- **Batch 1** (Types): 10 minutes - 8 agents
- **Batch 2** (Services + Workers): 10 minutes - 12 agents parallel
- **Batch 3** (Semantic + Adobe): 12 minutes - 10 agents parallel
- **Batch 4** (SVG + Creative API): 11 minutes - 8 agents parallel
- **Batch 5** (SSE + Hook): 11 minutes - 7 agents parallel
- **Batch 6** (UI Wiring): 15 minutes - 10 agents parallel
- **Batch 7** (Testing): 11 minutes - 12 agents parallel
- **Batch 8** (Docs): 9 minutes - 7 agents parallel
- **Batch 9** (Validation): 10 minutes - 5 agents parallel

**Total Parallel Execution: ~90 minutes (vs 38-48 hours sequential)**
**Parallelization Factor: 25-32x speedup**

---

## File Structure Summary

### New Type Files

- `src/lib/types/job-submission.ts`
- `src/lib/types/job-result.ts`
- `src/lib/types/worker-status.ts`
- `src/lib/types/segmentation.ts`
- `src/lib/types/vectorization.ts`

### New Service Files

- `src/lib/services/job-submission-service.ts`
- `src/lib/services/job-result-service.ts`
- `src/lib/services/background-removal-service.ts`
- `src/lib/llm/semantic-llm-provider.ts`
- `src/lib/llm/prompts/semantic-prompts.ts`

### New API Routes

- `src/app/api/segment/route.ts`
- `src/app/api/semantic/analyze/route.ts`
- `src/app/api/creative/execute/route.ts`
- `src/app/api/jobs/[jobId]/events/route.ts`

### New Worker Scripts

- `scripts/sam2-worker.py` (upgraded)
- `scripts/svg-turbo-worker.py` (new)

### Modified Files

- `src/lib/orchestration/SemanticProcessor.ts`
- `src/lib/orchestration/AdobeAdapter.ts`
- `src/components/dimension-studio/DimensionStudio.tsx`
- `src/components/creative-studio/CreativeStudio.tsx`
- `src/components/forge-studio/ForgeFabrication.tsx`
- `src/components/lexicon-studio/LexiconStudio.tsx`
- `src/components/asset-nexus/AssetNexus.tsx`

### New React Hook

- `src/hooks/useJobProgress.ts`

### New Reusable Component

- `src/components/shared/WorkerStatusBar.tsx`

### Test Files

- 16 new test files covering unit, integration, E2E, and load testing

### Documentation

- `docs/ENVIRONMENT.md`
- `docs/TROUBLESHOOTING.md`
- `docs/VRAM_REQUIREMENTS.md`
- `docs/API.md`
- `docs/ERRORS.md`
- `docker-compose.workers.yml`

---

## Notes for Implementation Teams

1. **Start immediately with Batch 1, Wave 1** - This is 100% parallelizable and unblocks everything else
2. **Redis must be running** - All job queuing and progress tracking depends on Redis connectivity
3. **GPU detection will auto-calibrate** - VRAM checks happen at submission time
4. **LLM provider is pluggable** - Can use OpenAI, Claude, or local Ollama
5. **Workers start on-demand** - No need to pre-launch all workers
6. **Progress streaming is optional** - UI can fall back to polling if SSE not available
7. **All tests are isolated** - Use mocks/stubs, no need for real workers during testing
8. **Docker support is optional** - Can run workers locally or in containers

---

**MICRO-TASK DECOMPOSITION COMPLETE**

87 ultra-granular tasks broken down for maximum Haiku 4.5 parallelization.
Ready for orchestrator to spawn agents in parallel batches.
