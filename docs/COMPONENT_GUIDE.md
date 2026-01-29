# Studio Component Integration Guide

This guide details how front-end components interact with the backend worker infrastructure.

## hooks

### `useJobProgress(jobId)`

Standardized hook for polling job status and progress (0-100%).

- **Inputs**: `jobId` (string)
- **Outputs**: `status`, `progress`, `error`, `result`

### `useWorkerHealth()`

Monitors the global cluster state of local Python workers.

- **Outputs**: `overallStatus` ('healthy' | 'degraded' | 'idle'), `workers` list.

### `useSemanticTransform()`

Specialized hook for instructions-based image manipulation via VLM.

## Component Patterns

### Submission Logic

Components should use the `JobSubmissionService` patterns.

1. `POST` to appropriate `/api/[route]`
2. Receive `jobId`
3. Use `useJobProgress` to monitor
4. Display `result` when status becomes `completed`

## State Management

Zustand stores are preferred for multi-step studios (e.g., `StemStudio`, `RemixStudio`).

- `remix-studio-store.ts`: Manages multi-modal packets.
- `stem-studio-store.ts`: Manages audio stem volumes and isolation states.
