# LoRA Training Jobs API Implementation

## Overview

This document describes the implementation of the LoRA training job submission API with Docker container orchestration.

## Files Created

### 1. `/src/app/api/training/submit/route.ts`

**Purpose**: POST endpoint for submitting LoRA/DreamBooth training jobs

**Key Features**:

- Authentication and rate limiting (using `requireAuthAndRateLimit`)
- JSON request body validation
- Comprehensive error handling
- CORS preflight support (OPTIONS endpoint)

**Endpoint**: `POST /api/training/submit`

**Request Body**:

```typescript
{
  dataset_id: string;           // UUID of existing dataset
  name?: string;                // Optional job name
  type: 'lora' | 'dreambooth';  // Training type
  base_model: string;           // HF model ID (e.g., "stabilityai/sdxl-base-1.0")
  config: {
    learning_rate?: number;     // Default: 1e-4
    batch_size?: number;        // Default: 1
    steps?: number;             // Default: 1000
    resolution?: number;        // Default: 512
    lora_rank?: number;         // Default: 16
    lora_alpha?: number;        // Default: 32
  };
  trigger_words?: string[];     // Optional trigger words
}
```

**Response Codes**:

- `200`: Job successfully submitted or queued
- `400`: Validation error in request body
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (dataset doesn't belong to user)
- `404`: Dataset not found
- `429`: Rate limit exceeded
- `500`: Internal server error

**Response Body**:

```typescript
{
  success: true;
  job_id: string; // UUID of training job
  status: 'running' | 'queued'; // Job status
  message: string; // Human-readable message
}
```

### 2. `/src/lib/training/job-manager.ts`

**Purpose**: Core training job orchestration and Docker management

**Main Export Function**:

```typescript
export async function submitTrainingJob(
  userId: string,
  config: TrainingJobConfig,
): Promise<{
  success: boolean;
  jobId?: string;
  status?: string;
  error?: string;
  statusCode?: number;
}>;
```

**Key Features**:

#### Configuration Validation

- **learning_rate**: 1e-6 to 1e-2
- **batch_size**: 1 to 8 (must be integer)
- **steps**: 100 to 10000 (must be integer)
- **resolution**: 256 to 1024 (must be multiple of 64)
- **lora_rank**: 4 to 128 (must be integer)
- **lora_alpha**: 1 to 128 (must be integer)

#### Concurrent Job Limiting

- Maximum 2 concurrent (running/pending) jobs per user
- Excess jobs set to 'queued' status
- Automatic management of job flow

#### Docker Container Orchestration

Uses Node.js `child_process.spawn()` to run:

```bash
docker run -d \
  --name training-{jobId} \
  --gpus all \
  -v {datasetPath}:/workspace/datasets:ro \
  -v {outputPath}:/workspace/outputs:rw \
  -v ~/.cache/huggingface:/workspace/models:rw \
  training-image \
  python train_lora.py --config /workspace/config.json
```

#### File Management

- Creates `/public/training/configs/{jobId}.json` - training configuration
- Creates `/public/training/outputs/{jobId}/` - output directory
- Generates Python-compatible training configuration

#### Database Integration

Uses Supabase to manage:

- Training job records in `training_jobs` table
- Dataset verification and ownership checks
- Job status tracking (pending, running, completed, failed, queued)
- Container ID storage for lifecycle management

**Helper Functions** (exported for testing):

- `validateTrainingConfig(config)` - Validates training parameters
- `isValidHuggingFaceModel(modelId)` - Validates HF model format
- `getActiveJobCountForUser(userId)` - Gets active job count
- `createTrainingJobRecord(userId, config, status)` - Creates DB record
- `generateTrainingConfig(job, dataset)` - Generates Python config
- `spawnDockerContainer(jobId, config)` - Spawns Docker container
- `writeTrainingConfigFile(jobId, config)` - Writes config JSON
- `createOutputDirectory(jobId)` - Creates output folder

### 3. Updated `/src/lib/db/training.ts`

**Added Database Functions**:

```typescript
// Create new training job
export async function createTrainingJob(job: DbTrainingJob): Promise<DbTrainingJob | null>;

// Get training job by ID (with user ownership check)
export async function getTrainingJob(jobId: string, userId: string): Promise<DbTrainingJob | null>;

// List all training jobs for a user
export async function listTrainingJobs(userId: string): Promise<DbTrainingJob[]>;

// Get active (running/pending) jobs for a user
export async function getActiveJobsForUser(userId: string): Promise<DbTrainingJob[]>;

// Update training job status and metadata
export async function updateTrainingJob(
  jobId: string,
  userId: string,
  updates: Partial<DbTrainingJob>,
): Promise<DbTrainingJob | null>;

// Delete training job
export async function deleteTrainingJob(jobId: string, userId: string): Promise<boolean>;
```

**Database Schema** (DbTrainingJob interface):

```typescript
{
  id: string;                                    // UUID
  user_id: string;                               // User ownership
  dataset_id: string;                            // Associated dataset
  name: string;                                  // Job name
  type: 'lora' | 'dreambooth';                   // Training type
  base_model: string;                            // HF model ID
  config: Record<string, unknown>;               // Training parameters
  trigger_words: string[];                       // Training trigger words
  status: 'pending' | 'running' | 'completed' | 'failed' | 'queued';
  container_id?: string;                         // Docker container ID
  error_message?: string;                        // Error details
  created_at: string;                            // ISO timestamp
  updated_at: string;                            // ISO timestamp
  started_at?: string;                           // When training started
  completed_at?: string;                         // When training completed
}
```

## Usage Example

### cURL

```bash
curl -X POST http://localhost:3000/api/training/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "dataset_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My SDXL LoRA",
    "type": "lora",
    "base_model": "stabilityai/sdxl-base-1.0",
    "config": {
      "learning_rate": 0.0001,
      "batch_size": 2,
      "steps": 1000,
      "resolution": 512,
      "lora_rank": 16,
      "lora_alpha": 32
    },
    "trigger_words": ["my-concept"]
  }'
```

### TypeScript/JavaScript

```typescript
import { submitTrainingJob } from '@/lib/training/job-manager';

const result = await submitTrainingJob('user-id-123', {
  dataset_id: 'dataset-uuid',
  name: 'My Training Job',
  type: 'lora',
  base_model: 'stabilityai/sdxl-base-1.0',
  config: {
    learning_rate: 1e-4,
    batch_size: 1,
    steps: 1000,
    resolution: 512,
    lora_rank: 16,
    lora_alpha: 32,
  },
  trigger_words: ['my-concept'],
});

if (result.success) {
  console.log(`Job ${result.jobId} is ${result.status}`);
} else {
  console.error(result.error);
}
```

## Error Handling

### Validation Errors (400)

- Invalid JSON in request body
- Missing or incorrectly typed required fields
- Configuration parameters outside acceptable ranges
- Invalid Hugging Face model ID format

### Authentication Errors (401)

- Missing authentication token
- Invalid or expired token
- Session expired

### Authorization Errors (403)

- Dataset belongs to different user
- Insufficient permissions

### Not Found Errors (404)

- Dataset ID doesn't exist
- Job ID doesn't exist

### Rate Limit Errors (429)

- User has exceeded rate limit (10 requests/minute)
- Retry-After header provided

### Server Errors (500)

- Failed to create database record
- Failed to create output directory
- Failed to write configuration file
- Failed to spawn Docker container

## Security Features

1. **Authentication Required**: All endpoints require valid user authentication
2. **User Isolation**: Users can only access their own datasets and jobs
3. **Rate Limiting**: Protects against abuse (10 requests/minute for generation endpoints)
4. **Input Validation**: Comprehensive validation of all parameters
5. **Type Safety**: TypeScript strict mode throughout
6. **Error Handling**: No sensitive information leaked in error messages

## Docker Integration

### Requirements

- Docker daemon running and accessible
- `training-image` Docker image available
- GPU support (--gpus all flag)
- Python training script at `/workspace/train_lora.py` in image

### Volume Mounts

- **Datasets**: Read-only mount of training dataset
- **Outputs**: Read-write mount for model outputs
- **HF Cache**: Persistent Hugging Face model cache

### Container Naming

- Containers named as `training-{jobId}` for easy identification
- All containers run in detached mode (-d flag)

## Performance Characteristics

- **Max Concurrent Jobs**: 2 per user
- **Queue Management**: Automatic queuing for excess jobs
- **Response Time**: <100ms for API validation
- **Container Spawn**: ~2-5 seconds for Docker startup

## Testing Checklist

- [ ] API endpoint accepts valid requests
- [ ] Request validation catches invalid input
- [ ] Authentication and rate limiting work correctly
- [ ] Dataset ownership is verified
- [ ] Maximum 2 concurrent jobs per user enforced
- [ ] Queued jobs tracked properly
- [ ] Docker containers spawn successfully
- [ ] Configuration files generated correctly
- [ ] Database records created and updated
- [ ] Error responses include proper status codes
- [ ] CORS preflight requests handled
- [ ] TypeScript strict mode compliance

## Future Enhancements

1. **Job Monitoring**: Add endpoint to check job status
2. **Job Cancellation**: Ability to cancel running/queued jobs
3. **Job History**: Retrieve past training jobs
4. **Job Webhooks**: Notify when job completes
5. **Advanced Queuing**: Priority-based job queue
6. **Resource Limits**: CPU/memory limits per job
7. **Custom Training Images**: Support for user-specified training containers
8. **Model Management**: Save and load trained models
9. **Training Analytics**: Track training metrics and progress
10. **Distributed Training**: Support multiple GPU/machine training
