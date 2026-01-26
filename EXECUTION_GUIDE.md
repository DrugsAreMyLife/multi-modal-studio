# Haiku 4.5 Agent Execution Guide

## How to Run 103 Micro-Tasks in Parallel

---

## Overview

This guide explains how to execute the 103 decomposed micro-tasks using Haiku 4.5 agents in parallel batches.

**Total Tasks**: 103
**Parallel Execution Time**: ~170 minutes (2 hours 50 minutes)
**Sequential Execution Time**: ~23 hours
**Expected Speedup**: 8x

---

## Phase Schedule

### Phase 2: Loss Graph Visualization

**Duration**: 35 minutes
**Recommended Agents**: 3 parallel agents
**Critical Path**: Types → Utils → Hook → Components → Container

```
[00:00-10:00] Wave 1: Types (3 tasks parallel)
  └─ 2.1.1, 2.1.2, 2.1.3

[10:00-30:00] Wave 2: Utils (4 tasks parallel)
  └─ 2.2.1, 2.2.2, 2.2.3, 2.2.4

[30:00-35:00] Wave 3: Hook (1 task)
  └─ 2.3.1

[35:00-45:00] Wave 4: Components (2 tasks parallel)
  └─ 2.4.1, 2.4.2

[45:00-55:00] Wave 5: Controls (1 task)
  └─ 2.5.1

[55:00-65:00] Wave 6: Container (2 tasks parallel)
  └─ 2.6.1, 2.6.2
```

### Phase 3: Sample Image Preview

**Duration**: 40 minutes (can run parallel with Phase 2)
**Recommended Agents**: 4 parallel agents
**Critical Path**: Types → Utils → Hook → Components → Slider → Container

### Phase 4: LLM Workflow Generation

**Duration**: 45 minutes (start after Phase 3)
**Recommended Agents**: 5 parallel agents

### Phase 5: Assisted Workflow Builder

**Duration**: 50 minutes (start after Phase 4)
**Recommended Agents**: 5 parallel agents

**Total Elapsed Time**: ~50 minutes (Phases 2-3 parallel) + 45 + 50 = ~145 minutes
**With 3-agent limit**: ~170 minutes

---

## Recommended Agent Allocation

### Optimal Setup: 5 Haiku Agents

**Agent 1: Types Specialist**

- All type definition tasks (2.1.1-2.1.3, 3.1.1-3.1.3, 4.1.1-4.1.3, 5.1.1-5.1.3)
- Runtime: ~20 minutes
- Success Rate: 99%

**Agent 2: Utils & Utilities**

- All utility functions (2.2.1-2.2.4, 3.2.1-3.2.3, 4.2.1-4.2.3, 5.2.1-5.2.3)
- Runtime: ~30 minutes
- Success Rate: 98%

**Agent 3: Hooks & State**

- All custom hooks (2.3.1, 3.3.1, 4.4.1, 5.3.1-5.3.2)
- All state machines (5.3.1-5.3.2)
- All validation logic (4.3.1-4.3.2)
- Runtime: ~25 minutes
- Success Rate: 95%

**Agent 4: Components**

- All UI components (2.4.1-2.4.2, 3.4.1-3.4.2, 4.5.1-4.5.3, 5.4.1-5.4.2)
- All display components (2.5.1, 3.5.1, 3.6.1, 5.5.1)
- Runtime: ~35 minutes
- Success Rate: 92%

**Agent 5: Integration & Testing**

- All container components (2.6.1, 3.7.1, 4.6.1, 5.6.1)
- All integration tests (2.6.2, 3.8.1-3.8.2, 4.7.1, 5.7.1-5.7.2)
- Runtime: ~40 minutes
- Success Rate: 88%

---

## Batch Execution Timeline

### Batch 1: Types (All Phases) - Minutes 0-15

**Run in Parallel**: 12 tasks on Agent 1
**Expected Duration**: 10 minutes
**Success Rate**: 99%

Tasks:

- Phase 2: 2.1.1, 2.1.2, 2.1.3
- Phase 3: 3.1.1, 3.1.2, 3.1.3
- Phase 4: 4.1.1, 4.1.2, 4.1.3
- Phase 5: 5.1.1, 5.1.2, 5.1.3

### Batch 2: Utils & Prompts (All Phases) - Minutes 15-40

**Run in Parallel**: 14 tasks on Agent 2
**Expected Duration**: 25 minutes (max task is 10 min)
**Success Rate**: 98%
**Depends On**: Batch 1

Tasks:

- Phase 2: 2.2.1, 2.2.2, 2.2.3, 2.2.4
- Phase 3: 3.2.1, 3.2.2, 3.2.3
- Phase 4: 4.2.1, 4.2.2, 4.2.3
- Phase 5: 5.2.1, 5.2.2, 5.2.3

### Batch 3: Hooks & Validation - Minutes 40-55

**Run in Parallel**: 6 tasks on Agent 3
**Expected Duration**: 15 minutes (max task is 13 min)
**Success Rate**: 95%
**Depends On**: Batch 2

Tasks:

- Phase 2: 2.3.1
- Phase 3: 3.3.1
- Phase 4: 4.3.1, 4.3.2
- Phase 5: 5.3.1, 5.3.2

### Batch 4: Components (Grid, Basic) - Minutes 55-75

**Run in Parallel**: 8 tasks on Agent 4
**Expected Duration**: 20 minutes (max task is 12 min)
**Success Rate**: 92%
**Depends On**: Batch 3

Tasks:

- Phase 2: 2.4.1, 2.4.2
- Phase 3: 3.4.1, 3.4.2
- Phase 4: 4.5.1 (partial)
- Phase 5: 5.4.1, 5.4.2, 5.5.1

### Batch 5: Advanced Components - Minutes 75-95

**Run in Parallel**: 7 tasks on Agent 4
**Expected Duration**: 20 minutes
**Success Rate**: 90%
**Depends On**: Batch 4

Tasks:

- Phase 2: 2.5.1
- Phase 3: 3.5.1, 3.6.1
- Phase 4: 4.5.2, 4.5.3
- Phase 5: (parallel with Phase 4)

### Batch 6: Containers & Integration - Minutes 95-120

**Run in Parallel**: 7 tasks on Agent 5
**Expected Duration**: 25 minutes
**Success Rate**: 88%
**Depends On**: Batch 5

Tasks:

- Phase 2: 2.6.1, 2.6.2
- Phase 3: 3.7.1
- Phase 4: 4.6.1
- Phase 5: 5.6.1

### Batch 7: Testing & Validation - Minutes 120-170

**Run in Parallel or Sequential**: 5-6 tasks on Agent 5
**Expected Duration**: 50 minutes
**Success Rate**: 95%
**Depends On**: Batch 6

Tasks:

- Phase 3: 3.8.1, 3.8.2
- Phase 4: 4.7.1
- Phase 5: 5.7.1, 5.7.2
- Final validation

---

## Execution Checklist

### Pre-Execution (Day 1, 9:00 AM)

- [ ] Review all 4 decomposition files
- [ ] Verify all file paths are correct
- [ ] Ensure codebase is up-to-date
- [ ] Create feature branch: `git checkout -b feature/phases-2-5`
- [ ] Setup agent environment
- [ ] Verify all dependencies are installed

### Batch 1 - Types (10 minutes)

- [ ] Assign 12 type definition tasks to Haiku Agent 1
- [ ] Agent monitors compilation
- [ ] Verify no circular imports
- [ ] All types compile without errors
- [ ] Commit: "Add type definitions for all 4 phases"

### Batch 2 - Utils (25 minutes)

- [ ] Assign 14 utility/prompt tasks to Haiku Agent 2
- [ ] Agent verifies all imports resolve
- [ ] Test utility functions with sample data
- [ ] All utilities tested and working
- [ ] Commit: "Add utility functions and prompts"

### Batch 3 - Hooks & Validation (15 minutes)

- [ ] Assign 6 hook/validation tasks to Haiku Agent 3
- [ ] Agent verifies hooks initialize correctly
- [ ] Test state updates and callbacks
- [ ] All hooks export correctly
- [ ] Commit: "Add custom hooks and validation logic"

### Batch 4 & 5 - Components (40 minutes)

- [ ] Assign 15 component tasks to Haiku Agent 4
- [ ] Agent verifies React renders without errors
- [ ] Test component props and state
- [ ] Verify no console errors
- [ ] Test responsive behavior
- [ ] Commit: "Add UI components for all features"

### Batch 6 - Containers (25 minutes)

- [ ] Assign 7 container/integration tasks to Haiku Agent 5
- [ ] Agent verifies containers integrate subcomponents
- [ ] Test data flow through container
- [ ] Verify all callbacks work
- [ ] Commit: "Add container components and integration"

### Batch 7 - Testing (50 minutes)

- [ ] Run all unit tests
- [ ] Run all integration tests
- [ ] Manual testing of each feature
- [ ] Verify no TypeScript errors
- [ ] Test bundle size
- [ ] Performance profiling
- [ ] Final commit: "Complete phases 2-5 implementation"

### Post-Execution (Final Verification)

- [ ] Run `npm run build` - no errors
- [ ] Run `npm run test` - all tests pass
- [ ] Run `npm run lint` - no warnings
- [ ] Code review
- [ ] Merge to main branch
- [ ] Update documentation

---

## Task Format for Haiku Agents

Each task should be communicated in this format:

```
TASK ID: 2.1.1
TITLE: Create LossMetrics Interface
FILE: /Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/training-studio.ts
TYPE: NEW FILE
DURATION: 6 minutes

DESCRIPTION:
Create new file with LossMetrics and related types for loss graph visualization.

REQUIREMENTS:
1. Create LossDataPoint interface with epoch, iteration, loss, timestamp, metrics
2. Create LossMetrics interface with currentLoss, minLoss, avgLoss, etc.
3. Create LossGraphConfig interface with visualization options
4. Create TrainingMonitorState interface extension
5. Create UseLossGraphReturn interface for hook return type
6. All types must be exported

CODE TEMPLATE:
See MICRO_TASKS_PHASES_2-5.md lines 50-120 for exact implementation

SUCCESS CRITERIA:
✓ File created at correct path
✓ TypeScript compiles without errors
✓ No circular imports
✓ All types properly exported
✓ Interfaces follow project conventions

NOTES:
- This is a prerequisite for tasks 2.2.1-2.2.4
- No implementation code, only type definitions
```

---

## Error Handling & Recovery

### If a Task Fails

**Option 1: Retry (for transient errors)**

- Agent re-reads the task
- Attempts again with more care
- Max 2 retries before escalation

**Option 2: Escalate (for unclear requirements)**

- Report which part was unclear
- Request clarification from human
- Continue with other tasks in batch

**Option 3: Skip & Continue**

- Mark task as blocked
- Note dependency
- Continue with non-blocking tasks

### Common Failure Modes

| Error                 | Cause                   | Recovery                             |
| --------------------- | ----------------------- | ------------------------------------ |
| `Module not found`    | Incorrect import path   | Verify file was created in Batch N-1 |
| `Type not found`      | Missing type definition | Check if dependency task completed   |
| `React error in SSR`  | 'use client' missing    | Add directive at top of file         |
| `Port already in use` | Dev server conflict     | Kill previous process                |
| `Out of memory`       | Too many tasks in batch | Reduce batch size from 5 to 3 agents |

### Rollback Procedure

If a batch has >50% failures:

1. Stop execution
2. Identify root cause
3. Rollback last commit
4. Fix root cause issue
5. Re-run batch with 1 agent (sequential)

---

## Monitoring & Progress Tracking

### Per-Batch Monitoring

```
Batch Status: 2/7
Progress: ████░░░░░░ 28%
Time: 40/170 min (23% complete)

Batch 1 (Types): ✓ COMPLETE (10 min)
  └─ 12/12 tasks passed
  └─ 0 errors, 0 warnings

Batch 2 (Utils): IN PROGRESS (15/25 min)
  └─ 14/14 tasks running
  └─ Agent 2 CPU: 45%, Memory: 280MB

Batch 3 (Hooks): PENDING (0/15 min)
  └─ Waiting for Batch 2

Batch 4-7: QUEUED
```

### Success Metrics to Track

- **Task Completion Rate**: Should be >95%
- **Error Rate**: Should be <5%
- **Time vs Estimate**: Should be within ±10%
- **Memory Usage**: Should be <500MB per agent
- **Code Quality**: Linting score >90/100

---

## Agent Communication Protocol

### Task Assignment Message

```
You are a Haiku 4.5 agent assigned to execute micro-tasks.

BATCH INFO:
- Batch: 1
- Total Tasks in Batch: 12
- Batch Duration: 10 minutes
- Your Task Count: 12
- Parallelism: 12 agents (each gets 1 task)

YOUR TASKS (execute these in any order):
1. 2.1.1 - Create LossMetrics Interface
2. 2.1.2 - Create TrainingMonitorState Extension
... (12 tasks total)

EXECUTION RULES:
- Read each task completely before starting
- Create/modify ONLY the specified file
- Follow the exact code provided
- Verify success criteria before reporting completion
- Report any errors immediately

TOOLS AVAILABLE:
- Read: Read files
- Write: Create/modify files
- Your cwd is: /Users/nick/Projects/Multi-Modal Generation Studio

BEGIN EXECUTION.
```

### Task Completion Report

```
TASK: 2.1.1
STATUS: COMPLETE ✓
TIME: 5 minutes (6 min estimated)
ERRORS: 0
WARNINGS: 0

DELIVERABLES:
✓ File created: /Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/training-studio.ts
✓ 5 interfaces defined
✓ All types exported
✓ TypeScript compilation: PASS

NEXT TASKS UNBLOCKED:
- 2.2.1, 2.2.2, 2.2.3, 2.2.4 (Utils - can start now)
```

---

## Optimization Strategies

### For Speed

- Run all agents at same time
- Use 5 agents for maximum parallelism
- Each agent gets ~20 tasks
- Total time: ~170 minutes

### For Reliability

- Run batches sequentially
- Use 1 agent for highest quality
- Each task individually reviewed
- Total time: ~23 hours (but nearly 100% success)

### Balanced (Recommended)

- Run types + utils in parallel (Batches 1-2)
- Sequential for hooks + components (Batches 3-5)
- Parallel for containers + testing (Batches 6-7)
- Use 2-3 agents
- Total time: ~4 hours
- Success rate: ~95%

---

## Quality Assurance Checklist

### After Each Batch

- [ ] All tasks report COMPLETE status
- [ ] No TypeScript errors in changed files
- [ ] No console warnings
- [ ] Import statements all resolve
- [ ] Code follows project conventions
- [ ] Commit message is clear

### After All 7 Batches

- [ ] Run `npm run build` - 0 errors, 0 warnings
- [ ] Run `npm run test` - all tests pass
- [ ] Run `npm run lint` - no issues
- [ ] Visual inspection of 3 features
- [ ] Test on different screen sizes
- [ ] Bundle size analysis
- [ ] Performance profiling

### Before Merging

- [ ] Code review by human
- [ ] All comments addressed
- [ ] Documentation updated
- [ ] Tests have >85% coverage
- [ ] No regressions in existing features

---

## Expected Outcomes

### Phase 2 Deliverables

- [ ] Loss graph renders correctly
- [ ] EMA smoothing works
- [ ] Metrics calculate correctly
- [ ] Convergence estimation works
- [ ] Controls are functional
- [ ] Integrated into TrainingMonitor

### Phase 3 Deliverables

- [ ] Image grid displays 1-6 columns
- [ ] Images load and display
- [ ] Pagination works
- [ ] Modal opens on click
- [ ] Comparison slider works
- [ ] Integrated into WorkbenchGrid

### Phase 4 Deliverables

- [ ] Template selector shows 5+ templates
- [ ] Prompts parse and validate
- [ ] LLM API integrates
- [ ] Confidence scoring works
- [ ] Workflow validation works
- [ ] Integrated into WorkflowStudio

### Phase 5 Deliverables

- [ ] State machine transitions work
- [ ] Questions display correctly
- [ ] Answers parse and store
- [ ] Preview updates in real-time
- [ ] Navigation buttons work
- [ ] Full flow completes successfully

---

## Troubleshooting

### Frequent Issues

**Issue**: Batch 2 Tasks Fail
**Cause**: Type definitions not created yet
**Solution**: Ensure Batch 1 completed successfully before starting Batch 2

**Issue**: Import Errors in Components
**Cause**: Utils/Hooks not yet created
**Solution**: Check dependency chain, don't skip batches

**Issue**: React "Invalid Hook" Error
**Cause**: Missing 'use client' directive
**Solution**: Add at top of each component file

**Issue**: Out of Memory
**Cause**: Too many tasks in parallel
**Solution**: Reduce from 5 agents to 3 agents

**Issue**: Port 3000 Already in Use
**Cause**: Previous dev server still running
**Solution**: `lsof -i :3000` and kill process

---

## Success Criteria - Final

Project is complete when:

1. **All 103 tasks finished**: ✓ Commit says "Complete phases 2-5"
2. **No TypeScript errors**: ✓ `npm run build` succeeds
3. **All tests pass**: ✓ `npm run test` shows 0 failures
4. **Code quality**: ✓ `npm run lint` shows 0 errors
5. **4 features working**: ✓ Each feature manually tested
6. **Bundle size OK**: ✓ No significant increase
7. **Performance OK**: ✓ All components <100ms to interactive
8. **Merged to main**: ✓ Pull request approved

---

## Timeline Summary

| Time     | Duration  | Activity             | Status |
| -------- | --------- | -------------------- | ------ |
| 0:00     | 5 min     | Setup & verification | ▓▓░    |
| 0:05     | 10 min    | Batch 1 (Types)      | ▓▓▓░   |
| 0:15     | 25 min    | Batch 2 (Utils)      | ▓▓░░   |
| 0:40     | 15 min    | Batch 3 (Hooks)      | ▓░░░   |
| 0:55     | 20 min    | Batch 4 (Components) | ░░░░   |
| 1:15     | 20 min    | Batch 5 (Advanced)   | ░░░░   |
| 1:35     | 25 min    | Batch 6 (Containers) | ░░░░   |
| 2:00     | 50 min    | Batch 7 (Testing)    | ░░░░   |
| 2:50     | 10 min    | Final Validation     | ░░░░   |
| **3:00** | **TOTAL** | **All Complete**     | **✓**  |

---

## Questions & Contact

For clarifications, reach out with:

- Task ID and specific question
- Expected vs actual behavior
- Error message (full stack trace)
- What you tried to fix it

---

**Last Updated**: January 18, 2026
**Status**: READY FOR EXECUTION
**Success Probability**: 95%+
