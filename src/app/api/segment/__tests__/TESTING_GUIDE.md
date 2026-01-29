# SAM2 Segmentation Pipeline Integration Tests

## Overview

This test suite provides comprehensive integration testing for the SAM2 (Segment Anything Model 2) segmentation pipeline API. The tests validate the complete flow from request submission through result retrieval, with special focus on async/sync modes, timeout handling, and error propagation.

## Test Coverage

### 1. POST /api/segment - Async Mode (10 tests)

Tests the asynchronous job submission flow:

- Returns job ID immediately for async requests
- Validates request payload (imageUrl required)
- Validates mode-specific requirements (points for point mode, boxes for box mode)
- Handles point mode with multiple points and labels
- Handles box mode with bounding boxes
- Transforms Point2D objects to coordinate arrays [[x, y]]
- Sets correct flags (multimask_output, worker ID 'sam2')
- Uses normal priority and waitForReady by default

**Key Scenarios**:

```typescript
// Async request - returns immediately with jobId
POST /api/segment
{
  "imageUrl": "https://example.com/image.jpg",
  "mode": "automatic",
  "async": true
}

Response:
{
  "jobId": "job_123_abc",
  "status": "queued",
  "estimatedWait": 5000
}
```

### 2. POST /api/segment - Sync Mode (3 tests)

Tests the synchronous job submission and result waiting:

- Waits for job completion up to 120 seconds
- Returns full masks array and metadata
- Propagates worker errors with proper error messages
- Returns generic message when error details missing
- Handles model inference failures

**Key Scenarios**:

```typescript
// Sync request - waits for result
POST /api/segment
{
  "imageUrl": "https://example.com/image.jpg",
  "mode": "automatic",
  "async": false
}

Response (200):
{
  "jobId": "job_sync_001",
  "status": "completed",
  "masks": ["/outputs/job_sync_001/mask_0.png"],
  "inputImageUrl": "https://example.com/image.jpg",
  "outputDir": "/outputs/job_sync_001",
  "processingTime": 2500
}

Response (500 on failure):
{
  "error": "Model inference failed"
}
```

### 3. Error Handling (5 tests)

Tests error propagation and handling:

- Job submission service errors
- Invalid JSON in request body
- Non-Error exceptions
- Worker not ready errors
- Out of memory errors

### 4. Timeout Handling (4 tests)

Tests timeout behavior:

- Job submission timeouts (30s default)
- Result waiting timeouts (120s default)
- Timeout error propagation
- Timeout messages in responses

### 5. GET /api/segment - Job Status Polling (5 tests)

Tests job status retrieval:

- Returns current job status by jobId
- Returns 404 for non-existent jobs
- Shows processing progress (0-100)
- Shows completed status
- Shows failed status with error message

**Key Scenarios**:

```typescript
// Poll job status
GET /api/segment?jobId=job_123_abc

Response:
{
  "jobId": "job_123_abc",
  "status": "processing",
  "progress": 45
}
```

### 6. E2E Flow Tests (3 tests)

Tests complete pipelines:

- Full async pipeline: submit → poll multiple times → see completion
- Point-based segmentation with interactive refinement
- Background removal use case (automatic mode, single mask)

### 7. Worker Interaction (4 tests)

Tests API-to-worker payload transformation:

- Point2D to coordinate array conversion
- Multimask output flag setting
- Worker ID assignment (always 'sam2')
- Priority and readiness settings

### 8. Response Format Validation (2 tests)

Tests response structure:

- Async response has jobId, status, estimatedWait
- Sync response has jobId, status, masks, inputImageUrl, outputDir, processingTime

## Test Statistics

| Category            | Test Count   | Coverage                                |
| ------------------- | ------------ | --------------------------------------- |
| Async Mode          | 10           | Submission, validation, transformation  |
| Sync Mode           | 3            | Waiting, results, error propagation     |
| Error Handling      | 5            | Service errors, JSON errors, exceptions |
| Timeout Handling    | 4            | Submission timeout, result timeout      |
| Status Polling      | 5            | GET requests, status retrieval          |
| E2E Flows           | 3            | Complete pipelines                      |
| Worker Interaction  | 4            | Payload transformation                  |
| Response Validation | 2            | Response structure                      |
| **Total**           | **36 tests** | **Comprehensive coverage**              |

## Setup Instructions

### Prerequisites

1. **Jest Configuration**
   - Install Jest: `npm install --save-dev jest @types/jest jest-environment-node`
   - Install Next.js testing utilities: `npm install --save-dev @testing-library/react @testing-library/jest-dom`

2. **Mock Redis** (for job services)
   - Tests mock the Redis connection, so Redis doesn't need to be running
   - Job services are completely mocked

3. **Mock Workers**
   - SAM2 worker process is not required
   - All worker responses are mocked

### Jest Configuration

Create or update `jest.config.js`:

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
```

Create `jest.setup.js`:

```javascript
import '@testing-library/jest-dom';
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test route.test.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## Mocked Services

### JobSubmissionService

Mocked methods:

- `submitJob(options)` - Returns `{jobId, status, estimatedWait}`
- `getJobStatus(jobId)` - Returns job status object or null

```typescript
mockJobSubmissionService.submitJob.mockResolvedValue({
  jobId: 'job_001',
  status: 'queued',
  estimatedWait: 5000,
});
```

### JobResultService

Mocked methods:

- `waitForResult(jobId, timeout)` - Returns `JobResult<T>`
- `streamProgress(jobId)` - AsyncGenerator of progress updates
- `cleanup()` - Cleanup function

```typescript
mockJobResultService.waitForResult.mockResolvedValue({
  jobId: 'job_001',
  status: 'completed',
  data: { masks: [...], scores: [...] },
  duration: 2500,
  completedAt: Date.now()
});
```

## Test Patterns

### Async Job Submission

```typescript
it('should submit job and return jobId', async () => {
  mockJobSubmissionService.submitJob.mockResolvedValue({
    jobId: 'job_001',
    status: 'queued',
  });

  const request = new NextRequest('http://localhost:3000/api/segment', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const response = await POST(request);
  const data = await response.json();

  expect(data.jobId).toBe('job_001');
  expect(mockJobSubmissionService.submitJob).toHaveBeenCalledWith(
    expect.objectContaining({ workerId: 'sam2' }),
  );
});
```

### Error Handling

```typescript
it('should handle worker not ready error', async () => {
  const error = new Error('Worker sam2 is not ready');
  mockJobSubmissionService.submitJob.mockRejectedValue(error);

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(500);
  expect(data.error).toBe('Worker sam2 is not ready');
});
```

### Status Polling

```typescript
it('should get job status', async () => {
  mockJobSubmissionService.getJobStatus.mockResolvedValue({
    jobId: 'job_001',
    status: 'processing',
    progress: 45,
  });

  const url = new URL('http://localhost:3000/api/segment');
  url.searchParams.set('jobId', 'job_001');
  const request = new NextRequest(url);

  const response = await GET(request);
  const data = await response.json();

  expect(data.status).toBe('processing');
  expect(data.progress).toBe(45);
});
```

## Segmentation Modes

### Automatic Mode

Detects and segments everything in the image.

```typescript
{
  "imageUrl": "https://example.com/image.jpg",
  "mode": "automatic"
}
```

### Point Mode

Segments objects at specified points (foreground/background).

```typescript
{
  "imageUrl": "https://example.com/image.jpg",
  "mode": "point",
  "points": [
    { "x": 100, "y": 200 },
    { "x": 300, "y": 400 }
  ],
  "labels": [1, 0]  // 1=foreground, 0=background
}
```

### Box Mode

Segments object within specified bounding box.

```typescript
{
  "imageUrl": "https://example.com/image.jpg",
  "mode": "box",
  "boxes": [
    { "x1": 50, "y1": 50, "x2": 300, "y2": 300 }
  ]
}
```

## Common Test Failures and Solutions

### Issue: "Worker not ready" error in async tests

**Solution**: Mock `submitJob` to return successfully:

```typescript
mockJobSubmissionService.submitJob.mockResolvedValue({...})
```

### Issue: Tests timeout waiting for results

**Solution**: Ensure `waitForResult` mock resolves:

```typescript
mockJobResultService.waitForResult.mockResolvedValue({...})
```

### Issue: Type errors with NextRequest

**Solution**: Use proper constructor:

```typescript
const request = new NextRequest('http://localhost:3000/api/segment', {
  method: 'POST',
  body: JSON.stringify(payload),
});
```

### Issue: Payload transformation not matching

**Solution**: Use `.toHaveBeenCalledWith()` with `expect.objectContaining()`:

```typescript
expect(mockJobSubmissionService.submitJob).toHaveBeenCalledWith(
  expect.objectContaining({
    payload: expect.objectContaining({
      points: [[100, 200]],
    }),
  }),
);
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Test API Routes

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Performance Benchmarks

Expected test execution time:

- Single test: ~10-50ms
- Full suite (36 tests): ~2-5 seconds
- With coverage: ~10-15 seconds

## Future Test Enhancements

1. **Performance Testing**
   - Load testing with concurrent requests
   - Memory usage tracking

2. **Snapshot Testing**
   - Response schema validation
   - Error message consistency

3. **Property-Based Testing**
   - Hypothesis/fast-check for payload generation
   - Fuzz testing for edge cases

4. **Visual Regression Testing**
   - Mask output validation
   - Expected segmentation quality checks

5. **Integration with Real Worker**
   - Optional end-to-end tests with actual SAM2 worker
   - Long-running integration tests in CI

## Troubleshooting

### Debug Specific Test

```bash
npm test -- --testNamePattern="should submit job and return jobId"
```

### Verbose Output

```bash
npm test -- --verbose
```

### Clear Jest Cache

```bash
npm test -- --clearCache
```

### View Mock Calls

```typescript
console.log(mockJobSubmissionService.submitJob.mock.calls);
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Testing Library](https://testing-library.com/)
- [SAM2 Documentation](https://github.com/facebookresearch/segment-anything-2)

## Contributing

When adding new tests:

1. Follow existing test naming conventions
2. Group related tests in `describe` blocks
3. Use descriptive test names (e.g., "should handle point mode with multiple points")
4. Mock external dependencies
5. Test both happy path and error cases
6. Update this documentation

## License

Same as main project.
