# Multi-Modal Studio API Documentation

This document describes the specialized API routes added during the remediation phase to wire simulated studios to real worker infrastructure.

## Worker Orchestration

All processing jobs are handled via the `JobSubmissionService`, which queues tasks into Redis for consumption by Python workers.

### API Routes

| Endpoint               | Method | Worker            | Description                                     |
| ---------------------- | ------ | ----------------- | ----------------------------------------------- |
| `/api/depth/estimate`  | POST   | `depth-estimator` | Estimates depth maps from images                |
| `/api/audio/demix`     | POST   | `audio-demixer`   | Separates audio into stems (vocals, drums, etc) |
| `/api/vfx/composite`   | POST   | `vfx-compositor`  | Neural alpha matting and compositing            |
| `/api/grading/apply`   | POST   | `grading-engine`  | Applies LUTs and neural color grading           |
| `/api/retouch/inpaint` | POST   | `inpaint-model`   | Neural inpainting and object removal            |
| `/api/remix/semantic`  | POST   | `qwen-vl-max`     | High-level semantic image transformation        |
| `/api/audio/master`    | POST   | `audio-master`    | LUFS normalization and mastering                |
| `/api/audio/tts`       | POST   | `audio-tts`       | Text-to-speech with voice cloning               |
| `/api/video/stabilize` | POST   | `video-stabilize` | Gyro-based video stabilization                  |
| `/api/forge/train`     | POST   | `forge-training`  | LoRA and DreamBooth training                    |

## Common Patterns

### Async Submission

Most endpoints support an `async: boolean` flag. When `true`, they return a `jobId` immediately.

```json
{
  "success": true,
  "jobId": "job_123...",
  "status": "queued"
}
```

### Sync Waiting

When `async: false`, the route waits for completion (up to 120s) and returns the final asset URL.

```json
{
  "success": true,
  "data": { "url": "..." },
  "status": "completed"
}
```

## Health Monitoring

`/api/workers/status` provides real-time VRAM and readiness data for all 11 specialized workers.
