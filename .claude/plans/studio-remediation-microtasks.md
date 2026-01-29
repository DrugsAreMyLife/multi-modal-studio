# Studio Remediation - Micro-Task Breakdown

**Created**: 2026-01-28
**Total Micro-Tasks**: 147
**Optimized for**: Haiku 4.5 parallel execution
**Task Duration**: 5-10 minutes each

---

## Parallelization Summary

| Wave   | Tasks                       | Duration | Concurrency |
| ------ | --------------------------- | -------- | ----------- |
| Wave 1 | Phase 1 routes (1.1-1.5)    | ~10 min  | 30 parallel |
| Wave 2 | JobSubmissionService (1.6)  | ~5 min   | 5 parallel  |
| Wave 3 | Core studios (2.1-2.4)      | ~10 min  | Mixed       |
| Wave 4 | Specialized tools (3.1-3.4) | ~12 min  | 32 parallel |
| Wave 5 | Supporting tools (4.1-4.7)  | ~14 min  | 35 parallel |
| Wave 6 | Testing & cleanup (5.1-5.6) | ~14 min  | Mixed       |

---

## PHASE 1: Infrastructure Foundation

### Task 1.1: Create `/api/depth/estimate` route

**Parallel Group A: Type Definitions & Validation**

- [x] μ-1.1.1: Create depth API payload types (5 min)
- [x] μ-1.1.2: Create depth validation schema (6 min)
- [x] μ-1.1.3: Create base route file with POST handler (8 min)
- [x] μ-1.1.4: Implement job submission logic (7 min)
- [x] μ-1.1.5: Add GET endpoint for depth job status (6 min)
- [x] μ-1.1.6: Verify complete route functionality (5 min)

---

### Task 1.2: Create `/api/audio/demix` route

**Parallel Group A: Type Definitions**

- [x] μ-1.2.1: Create audio demix payload types (5 min)
- [x] μ-1.2.2: Create audio demix validation schema (6 min)

**Parallel Group B: API Route Handler**

- [x] μ-1.2.3: Create base route file (8 min)
- [x] μ-1.2.4: Implement job submission for audio demix (7 min)

**Parallel Group C: GET Status Endpoint**

- [x] μ-1.2.5: Add GET endpoint (6 min)

**Final Assembly**

- [x] μ-1.2.6: Verify complete audio demix route (5 min)

---

### Task 1.3: Create `/api/vfx/composite` route

**Parallel Group A: Type Definitions**

- [x] μ-1.3.1: Create VFX composite payload types (5 min)
- [x] μ-1.3.2: Create VFX composite validation schema (6 min)

**Parallel Group B: API Route Handler**

- [x] μ-1.3.3: Create base route file (8 min)
- [x] μ-1.3.4: Implement VFX job submission logic (7 min)

**Parallel Group C: GET Status Endpoint**

- [x] μ-1.3.5: Add GET endpoint (6 min)

**Final Assembly**

- [x] μ-1.3.6: Verify complete VFX composite route (5 min)

---

### Task 1.4: Create `/api/grading/apply` route

**Parallel Group A: Type Definitions**

- [x] μ-1.4.1: Create grading payload types (5 min)
- [x] μ-1.4.2: Create grading validation schema (6 min)

**Parallel Group B: API Route Handler**

- [x] μ-1.4.3: Create base route file (8 min)
- [x] μ-1.4.4: Implement grading job submission (7 min)

**Parallel Group C: GET Status Endpoint**

- [x] μ-1.4.5: Add GET endpoint (6 min)

**Final Assembly**

- [x] μ-1.4.6: Verify complete grading apply route (5 min)

---

### Task 1.2: Create `/api/retouch/inpaint` route

**Parallel Group A: Type Definitions**

- [x] μ-1.5.1: Create inpaint payload types (5 min)
- [x] μ-1.5.2: Create inpaint validation schema (6 min)

**Parallel Group B: API Route Handler**

- [x] μ-1.5.3: Create base route file (8 min)
- [x] μ-1.5.4: Implement inpainting job submission (7 min)

**Parallel Group C: GET Status Endpoint**

- [x] μ-1.5.5: Add GET endpoint (6 min)

**Final Assembly**

- [x] μ-1.5.6: Verify complete inpaint route (5 min)

---

### Task 1.6: Extend JobSubmissionService

**Parallel Group A: Type Updates**

- [x] μ-1.6.1: Update WorkerId type (5 min)
- [x] μ-1.6.2: Add ports mapping for new workers (6 min)
- [x] μ-1.6.3: Add VRAM requirements for new workers (6 min)
- [x] μ-1.6.4: Add model ID mappings (6 min)
- [x] μ-1.6.5: Verify JobSubmissionService updates (5 min)

---

## PHASE 2: Core Creative Studios

### Task 2.1: Wire RemixStudio to semantic LLM (No deps)

**Parallel Group A: Create Semantic API Route**

- [x] μ-2.1.1: Create `/api/remix/semantic` route POST handler (7 min)
- [x] μ-2.1.2: Add semantic prompt validation (6 min)
- [x] μ-2.1.3: Import semantic utilities in RemixStudio (5 min)
- [x] μ-2.1.4: Update semantic execute handler (8 min)
- [x] μ-2.1.5: Add loading state management (5 min)
- [x] μ-2.1.6: Create useSemanticTransform hook (7 min)
- [x] μ-2.1.7: Verify semantic LLM wiring (5 min)

---

### Task 2.2: Create StemStudio Zustand store (No deps)

**Parallel Group A: Create Store File**

- [x] μ-2.2.1: Create store file with initial state (6 min)
- [x] μ-2.2.2: Implement Zustand store with actions (8 min)

**Parallel Group B: Create Store Hooks**

- [x] μ-2.2.3: Add selector hooks (5 min)
- [x] μ-2.2.4: Add persistence to store (5 min)

**Final Assembly**

- [x] μ-2.2.5: Verify complete StemStudio store (5 min)

---

### Task 2.3: Wire StemStudio to `/api/audio/demix` (Depends: 1.2, 2.2)

**Parallel Group A: Create StemStudio Component**

- [x] μ-2.3.1: Create StemStudio.tsx base component (8 min)
- [x] μ-2.3.2: Add audio input section (7 min)

**Parallel Group B: Implement Demix Logic**

- [x] μ-2.3.3: Create demix request handler (7 min)
- [x] μ-2.3.4: Add job progress tracking using useJobProgress (6 min)
- [x] μ-2.3.5: Parse demix response and populate stems (7 min)

**Parallel Group C: Stem Management UI**

- [x] μ-2.3.6: Create stem list display component (7 min)
- [x] μ-2.3.7: Add volume and pan controls (7 min)

**Final Assembly**

- [x] μ-2.3.8: Verify complete StemStudio wiring (5 min)

---

### Task 2.4: Wire VFXStudio to SAM2/compositor (Depends: 1.3)

**Parallel Group A: Create VFXStudio Component**

- [x] μ-2.4.1: Create VFXStudio.tsx base component (8 min)
- [x] μ-2.4.2: Add image input section (6 min)

**Parallel Group B: Implement Composite Logic**

- [x] μ-2.4.3: Create overlay management state (6 min)
- [x] μ-2.4.4: Create function to submit composite job (8 min)
- [x] μ-2.4.5: Add overlay position/blend editor (7 min)

**Parallel Group C: Result Handling**

- [x] μ-2.4.6: Parse composite result and display (6 min)
- [x] μ-2.4.7: Add export/save functionality (6 min)

**Final Assembly**

- [x] μ-2.4.8: Verify complete VFXStudio wiring (5 min)

---

## PHASE 3: Specialized Tools

### Task 3.1: Wire DepthStudio (Depends: 1.1)

**Parallel Group A: Create Component**

- [x] μ-3.1.1: Create DepthStudio.tsx base component (8 min)
- [x] μ-3.1.2: Add image input section (6 min)
- [x] μ-3.1.3: Create depth estimation request handler (7 min)
- [x] μ-3.1.4: Add depth map visualization (8 min)
- [x] μ-3.1.5: Add depth statistics display (6 min)
- [x] μ-3.1.6: Add depth filtering options (7 min)
- [x] μ-3.1.7: Add 3D point cloud viewer (8 min)
- [x] μ-3.1.8: Verify complete DepthStudio wiring (5 min)

---

### Task 3.2: Wire GradingStudio (Depends: 1.4)

**Parallel Group A: Create Component**

- [x] μ-3.2.1: Create GradingStudio.tsx base component (8 min)
- [x] μ-3.2.2: Add image input section (6 min)

**Parallel Group B: Implement Color Grading**

- [x] μ-3.2.3: Create LUT selection UI (7 min)
- [x] μ-3.2.4: Create color grade request handler (7 min)
- [x] μ-3.2.5: Add real-time intensity control (6 min)

**Parallel Group C: Advanced Grading Tools**

- [x] μ-3.2.6: Add color correction controls (8 min)
- [x] μ-3.2.7: Add preset management (7 min)

**Final Assembly**

- [x] μ-3.2.8: Verify complete GradingStudio wiring (5 min)

---

### Task 3.3: Wire RetouchStudio (Depends: 1.5)

**Parallel Group A: Create Component**

- [x] μ-3.3.1: Create RetouchStudio.tsx base component (8 min)
- [x] μ-3.3.2: Add image canvas for mask drawing (8 min)

**Parallel Group B: Implement Inpainting**

- [x] μ-3.3.3: Create brush tool for mask creation (7 min)
- [x] μ-3.3.4: Add inpainting prompt input (6 min)
- [x] μ-3.3.5: Create inpaint request handler (7 min)

**Parallel Group C: Result & Refinement**

- [x] μ-3.3.6: Add inpaint result display (6 min)
- [x] μ-3.3.7: Add strength and quality controls (7 min)

**Final Assembly**

- [x] μ-3.3.8: Verify complete RetouchStudio wiring (5 min)

---

### Task 3.4: Wire NodeStudio to ComfyUI (No deps)

**Parallel Group A: Create Component**

- [x] μ-3.4.1: Create NodeStudio.tsx base component (8 min)
- [x] μ-3.4.2: Create node editor framework (10 min)

**Parallel Group B: ComfyUI Integration**

- [x] μ-3.4.3: Create `/api/node-studio/execute` route (8 min)
- [x] μ-3.4.4: Create ComfyUI workflow validator (7 min)
- [x] μ-3.4.5: Create node execution handler (8 min)

**Parallel Group C: Node Library & Presets**

- [x] μ-3.4.6: Create node library with common nodes (10 min)
- [x] μ-3.4.7: Add workflow templates (8 min)
- [x] μ-3.4.8: Add result viewer and history (8 min)

**Final Assembly**

- [x] μ-3.4.9: Verify complete NodeStudio wiring (5 min)

---

## PHASE 4: Supporting Tools

### Task 4.1: Create `/api/audio/master` route

**Parallel Group A: Type Definitions**

- [x] μ-4.1.1: Create audio mastering payload types (5 min)
- [x] μ-4.1.2: Create mastering validation schema (6 min)
- [x] μ-4.1.3: Create base route file (8 min)
- [x] μ-4.1.4: Implement mastering job submission (7 min)
- [x] μ-4.1.5: Add GET endpoint (6 min)
- [x] μ-4.1.6: Verify complete audio master route (5 min)

---

### Task 4.2: Wire AcousticStudio (Depends: 4.1)

**Parallel Group A: Create Component**

- [x] μ-4.2.1: Create AcousticStudio.tsx base component (8 min)
- [x] μ-4.2.2: Add audio input section (6 min)

**Parallel Group B: Implement Mastering**

- [x] μ-4.2.3: Add mastering controls (7 min)
- [x] μ-4.2.4: Create mastering request handler (6 min)
- [x] μ-4.2.5: Add mastered audio playback (6 min)
- [x] μ-4.2.6: Add audio metrics display (5 min)

**Final Assembly**

- [x] μ-4.2.7: Verify complete AcousticStudio wiring (5 min)

---

### Task 4.3: Create `/api/audio/tts` route

**Parallel Group A: Type Definitions**

- [x] μ-4.3.1: Create TTS payload types (5 min)
- [x] μ-4.3.2: Create TTS validation schema (6 min)

**Parallel Group B: API Route Handler**

- [x] μ-4.3.3: Create base route file (8 min)
- [x] μ-4.3.4: Implement TTS job submission (7 min)

**Parallel Group C: GET Status**

- [x] μ-4.3.5: Add GET endpoint (6 min)

**Final Assembly**

- [x] μ-4.3.6: Verify complete TTS route (5 min)

---

### Task 4.4: Wire AcousticForge (Depends: 4.3)

**Parallel Group A: Create Component**

- [x] μ-4.4.1: Create AcousticForge.tsx base component (8 min)
- [x] μ-4.4.2: Add text input section (6 min)

**Parallel Group B: Implement TTS**

- [x] μ-4.4.3: Add voice selection UI (7 min)
- [x] μ-4.4.4: Add speech controls (6 min)
- [x] μ-4.4.5: Create TTS request handler (7 min)

**Parallel Group C: Result Handling**

- [x] μ-4.4.6: Add TTS audio playback (6 min)
- [x] μ-4.4.7: Add regeneration and refinement (5 min)

**Final Assembly**

- [x] μ-4.4.8: Verify complete AcousticForge wiring (5 min)

---

### Task 4.5: Create `/api/video/stabilize` route

**Parallel Group A: Type Definitions**

- [x] μ-4.5.1: Create video stabilization payload types (5 min)
- [x] μ-4.5.2: Create stabilization validation schema (6 min)

**Parallel Group B: API Route Handler**

- [x] μ-4.5.3: Create base route file (8 min)
- [x] μ-4.5.4: Implement stabilization job submission (7 min)

**Parallel Group C: GET Status**

- [x] μ-4.5.5: Add GET endpoint (6 min)

**Final Assembly**

- [x] μ-4.5.6: Verify complete stabilization route (5 min)

---

### Task 4.6: Wire DirectorStudio (Depends: 4.5)

**Parallel Group A: Create Component**

- [x] μ-4.6.1: Create DirectorStudio.tsx base component (8 min)
- [x] μ-4.6.2: Add video input section (6 min)

**Parallel Group B: Implement Stabilization**

- [x] μ-4.6.3: Add stabilization method selection (7 min)
- [x] μ-4.6.4: Add stabilization strength control (6 min)
- [x] μ-4.6.5: Create stabilization request handler (7 min)

**Parallel Group C: Result Handling**

- [x] μ-4.6.6: Add stabilized video playback (6 min)
- [x] μ-4.6.7: Add export options (6 min)

**Final Assembly**

- [x] μ-4.6.8: Verify complete DirectorStudio wiring (5 min)

---

### Task 4.7: Wire ForgeStudio (No deps)

**Parallel Group A: Create Component**

- [x] μ-4.7.1: Create ForgeStudio.tsx base component (8 min)
- [x] μ-4.7.2: Add training dataset upload section (8 min)

**Parallel Group B: Implement Training**

- [x] μ-4.7.3: Add model type selection (7 min)
- [x] μ-4.7.4: Add training parameters UI (8 min)
- [x] μ-4.7.5: Create training job submission handler (8 min)

**Parallel Group C: Training Monitoring**

- [x] μ-4.7.6: Add training progress display (7 min)
- [x] μ-4.7.7: Add trained model management (7 min)

**Final Assembly**

- [x] μ-4.7.8: Verify complete ForgeStudio wiring (5 min)

---

## PHASE 5: Testing & Cleanup

### Task 5.1: Configure Jest/Vitest

**Parallel Group A: Configuration Setup**

- [x] μ-5.1.1: Create jest.config.js with base configuration (8 min)
- [x] μ-5.1.2: Create jest.setup.js with global setup (7 min)
- [x] μ-5.1.3: Configure TypeScript for tests (6 min)
- [x] μ-5.1.4: Install test dependencies (8 min)
- [x] μ-5.1.5: Create test helpers file (7 min)
- [x] μ-5.1.6: Test Jest configuration (6 min)
- [x] μ-5.1.7: Verify complete testing setup (5 min)

---

### Task 5.2: Create API route unit tests (Depends: 5.1)

**Parallel Group A: Route Handler Tests**

- [x] μ-5.2.1: Create tests for `/api/depth/estimate` (8 min)
- [x] μ-5.2.2: Create tests for `/api/audio/demix` (8 min)
- [x] μ-5.2.3: Create tests for `/api/vfx/composite` (8 min)
- [x] μ-5.2.4: Create tests for `/api/grading/apply` (8 min)
- [x] μ-5.2.5: Create tests for `/api/retouch/inpaint` (8 min)

**Parallel Group B: Service Tests**

- [x] μ-5.2.6: Create tests for JobSubmissionService (8 min)
- [x] μ-5.2.7: Create tests for validation functions (8 min)

**Final Assembly**

- [x] μ-5.2.8: Verify complete API test coverage (5 min)

---

### Task 5.3: Create integration tests (Depends: 5.1)

**Parallel Group A: Component Integration Tests**

- [x] μ-5.3.1: Create tests for StemStudio (8 min)
- [x] μ-5.3.2: Create tests for VFXStudio (8 min)
- [x] μ-5.3.3: Create tests for DepthStudio (8 min)
- [x] μ-5.3.4: Create tests for GradingStudio (8 min)
- [x] μ-5.3.5: Create tests for RetouchStudio (8 min)

**Parallel Group B: Hook & Store Tests**

- [x] μ-5.3.6: Create tests for useJobProgress hook (8 min)
- [x] μ-5.3.7: Create tests for StemStudio Zustand store (8 min)

**Final Assembly**

- [x] μ-5.3.8: Verify complete integration test coverage (5 min)

---

### Task 5.4: Remove FALLBACK_MOCK_ASSETS

**Parallel Group A: Find & Replace**

- [x] μ-5.4.1: Search for FALLBACK_MOCK_ASSETS usage (6 min)
- [x] μ-5.4.2: Remove from component files (8 min)
- [x] μ-5.4.3: Remove from utility/helper files (7 min)

**Parallel Group B: Verify Clean Removal**

- [x] μ-5.4.4: Verify complete removal (6 min)

**Final Assembly**

- [x] μ-5.4.5: Run final build check (5 min)

---

### Task 5.5: Add worker health check integration

**Parallel Group A: Create Health Check Route**

- [x] μ-5.5.1: Create `/api/workers/health` route (8 min)
- [x] μ-5.5.2: Add health check status persistence (6 min)

**Parallel Group B: Create Health Check Hooks**

- [x] μ-5.5.3: Create useWorkerHealth hook (8 min)
- [x] μ-5.5.4: Add health indicator to Shell/Sidebar (7 min)

**Parallel Group C: Integration Tests**

- [x] μ-5.5.5: Create tests for health check functionality (8 min)

**Final Assembly**

- [x] μ-5.5.6: Verify complete health check integration (5 min)

---

### Task 5.6: Documentation update

**Parallel Group A: Create API Documentation**

- [x] μ-5.6.1: Document all new API routes (10 min)
- [x] μ-5.6.2: Document new worker types and services (8 min)

**Parallel Group B: Create Component Documentation**

- [x] μ-5.6.3: Create component README files (10 min)
- [x] μ-5.6.4: Create integration guide documentation (8 min)

**Parallel Group C: Update Main Documentation**

- [x] μ-5.6.5: Update main README.md (7 min)

**Final Assembly**

- [x] μ-5.6.6: Verify documentation completeness (5 min)

---

## Execution Waves Summary

### Wave 1 (Parallel Safe)

Tasks: 1.1, 1.2, 1.3, 1.4, 1.5 - 30 micro-tasks
Duration: ~10 minutes
Creates: 5 new API routes

### Wave 2 (After Wave 1)

Task: 1.6 - 5 micro-tasks
Duration: ~5 minutes
Creates: Updated JobSubmissionService

### Wave 3 (Mixed)

Tasks: 2.1, 2.2 (parallel) → 2.3, 2.4 (after deps)
Duration: ~10 minutes
Creates: 4 studio wirings

### Wave 4 (Parallel Safe)

Tasks: 3.1, 3.2, 3.3, 3.4 - 32 micro-tasks
Duration: ~12 minutes
Creates: 4 specialized studio wirings

### Wave 5 (Chains)

Tasks: 4.1→4.2, 4.3→4.4, 4.5→4.6, 4.7
Duration: ~14 minutes
Creates: 7 supporting tool wirings

### Wave 6 (Sequential)

Tasks: 5.1 → 5.2, 5.3 | 5.4, 5.5, 5.6
Duration: ~14 minutes
Creates: Test suite, documentation, cleanup

---

## Total: 147 Micro-Tasks

Ready for parallel execution with Haiku 4.5.
