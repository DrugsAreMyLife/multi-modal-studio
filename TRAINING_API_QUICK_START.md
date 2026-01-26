# Training API Quick Start Guide

## Endpoint

```
POST /api/training/submit
```

## Authentication

Include your auth token in the Authorization header:

```
Authorization: Bearer <your_token>
```

## Basic Request Example

```bash
curl -X POST http://localhost:3000/api/training/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "dataset_id": "abc123def456",
    "name": "My First LoRA",
    "type": "lora",
    "base_model": "stabilityai/sdxl-base-1.0",
    "config": {
      "learning_rate": 0.0001,
      "batch_size": 1,
      "steps": 1000,
      "resolution": 512,
      "lora_rank": 16,
      "lora_alpha": 32
    },
    "trigger_words": ["my-style"]
  }'
```

## Success Response (200)

```json
{
  "success": true,
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "running",
  "message": "Training job 550e8400-e29b-41d4-a716-446655440000 running"
}
```

## Error Response (400 - Validation)

```json
{
  "error": "Validation error",
  "message": "Request validation failed",
  "details": [
    "batch_size must be an integer between 1 and 8",
    "resolution must be a multiple of 64 between 256 and 1024"
  ]
}
```

## Configuration Ranges

| Parameter     | Min  | Max   | Default | Notes               |
| ------------- | ---- | ----- | ------- | ------------------- |
| learning_rate | 1e-6 | 1e-2  | 1e-4    | Scientific notation |
| batch_size    | 1    | 8     | 1       | Integer only        |
| steps         | 100  | 10000 | 1000    | Integer only        |
| resolution    | 256  | 1024  | 512     | Multiple of 64      |
| lora_rank     | 4    | 128   | 16      | Integer only        |
| lora_alpha    | 1    | 128   | 32      | Integer only        |

## Job Status Values

- **pending**: Created, waiting for slot
- **running**: Currently training
- **queued**: Waiting for available training slot (max 2 concurrent per user)
- **completed**: Training finished successfully
- **failed**: Training failed with error

## Rate Limiting

- **Limit**: 10 requests per minute
- **Endpoint**: `/api/training/submit`
- **Rate Limit Type**: Per user
- **Response Code**: 429 (Too Many Requests)
- **Retry Header**: `Retry-After` (seconds)

## Common Errors

### 400 - Invalid Request

- Check JSON syntax
- Verify all required fields present
- Validate parameter ranges

### 401 - Unauthorized

- Missing or invalid authentication token
- Session expired

### 403 - Forbidden

- Dataset belongs to different user
- Check dataset_id is correct

### 404 - Not Found

- dataset_id doesn't exist
- Create dataset first via `/api/datasets/upload`

### 429 - Rate Limited

- Too many requests in 60 seconds
- Wait for Retry-After seconds before retrying

### 500 - Server Error

- Check Docker daemon is running
- Verify training-image is available
- Check server logs for details

## Required Fields

```typescript
{
  dataset_id: string;           // UUID (required)
  type: 'lora' | 'dreambooth';  // (required)
  base_model: string;           // HF model ID (required)
  config: {                      // (required)
    learning_rate?: number;
    batch_size?: number;
    steps?: number;
    resolution?: number;
    lora_rank?: number;
    lora_alpha?: number;
  }
}
```

## Optional Fields

```typescript
{
  name?: string;                // Human-readable job name
  trigger_words?: string[];     // Array of trigger words for the trained model
}
```

## TypeScript Usage

```typescript
import { submitTrainingJob } from '@/lib/training/job-manager';
import type { TrainingJobConfig } from '@/lib/training/job-manager';

const config: TrainingJobConfig = {
  dataset_id: 'my-dataset-id',
  name: 'My Training',
  type: 'lora',
  base_model: 'stabilityai/sdxl-base-1.0',
  config: {
    learning_rate: 1e-4,
    batch_size: 1,
    steps: 1000,
  },
  trigger_words: ['my-style'],
};

const result = await submitTrainingJob('user-id', config);

if (result.success) {
  console.log(`Job ${result.jobId} is ${result.status}`);
} else {
  console.error(`Error: ${result.error}`);
}
```

## Hugging Face Model IDs

Valid formats:

- `stabilityai/sdxl-base-1.0`
- `runwayml/stable-diffusion-v1-5`
- `timbrooks/instruct-pix2pix`
- `username/model-name`

Invalid formats:

- `sdxl-base` (missing namespace)
- `https://huggingface.co/model` (URL instead of ID)
- `model-name` (no forward slash)

## Workflow

1. **Upload Dataset** → `POST /api/datasets/upload` → Get `dataset_id`
2. **Submit Training** → `POST /api/training/submit` → Get `job_id`
3. **Check Status** → Query database via job_id
4. **Download Results** → From `/public/training/outputs/{job_id}/`

## Notes

- Maximum 2 concurrent training jobs per user
- Excess jobs automatically queued
- Dataset must exist and belong to the user
- Docker container name: `training-{job_id}`
- Configuration file: `/public/training/configs/{job_id}.json`
- Output directory: `/public/training/outputs/{job_id}/`

## Troubleshooting

**Q: Getting 404 - Dataset not found**

- Verify dataset was uploaded to your account
- Check dataset_id is correct (copy from upload response)

**Q: Getting 429 - Rate limited**

- Wait 60 seconds between requests
- Use the `Retry-After` header value for accurate timing

**Q: Job stuck in "queued"**

- Normal if you have 2 running jobs already
- Job will start automatically when slot opens

**Q: Getting 500 - Docker error**

- Ensure Docker daemon is running
- Check `training-image` exists: `docker images | grep training-image`
- Check server logs for detailed error

## Database Schema

Required Supabase table: `training_jobs`

```sql
CREATE TABLE training_jobs (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  dataset_id UUID NOT NULL REFERENCES datasets(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lora', 'dreambooth')),
  base_model TEXT NOT NULL,
  config JSONB NOT NULL,
  trigger_words TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'queued')),
  container_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_training_jobs_user_id ON training_jobs(user_id);
CREATE INDEX idx_training_jobs_status ON training_jobs(status);
CREATE INDEX idx_training_jobs_created_at ON training_jobs(created_at);
```
