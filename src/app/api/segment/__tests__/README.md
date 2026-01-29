# SAM2 Segmentation API Route Tests

Comprehensive integration tests for the SAM2 (Segment Anything Model 2) segmentation pipeline API endpoint.

## Files

- **route.test.ts** - Main test suite (36 tests)
- **test-fixtures.ts** - Mock data factories and test utilities
- **TESTING_GUIDE.md** - Detailed testing documentation

## Quick Start

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test route.test.ts

# Watch mode
npm test -- --watch
```

### Test Output

```
PASS  src/app/api/segment/__tests__/route.test.ts
  Segmentation API Route
    POST /api/segment - Async Mode
      ✓ should accept segmentation request and return job ID in async mode (10ms)
      ✓ should return 400 when imageUrl is missing (5ms)
      ✓ should return 400 when point mode is missing points (4ms)
      ...
    GET /api/segment - Job Status Polling
      ✓ should retrieve job status by jobId (6ms)
      ✓ should return 400 when jobId parameter is missing (3ms)
      ...
    E2E Flow - Complete Segmentation Pipeline
      ✓ should complete full async pipeline: submit -> poll -> get results (12ms)
      ...

Test Suites: 1 passed, 1 total
Tests:       36 passed, 36 total
Time:        3.245 s
```

## Test Structure

### 1. Async Mode Tests (10 tests)

Tests asynchronous job submission:

- Basic async submission
- Request validation (imageUrl required)
- Mode-specific validation (points for point mode, boxes for box mode)
- Point mode with labels
- Box mode handling
- Point2D transformation
- Worker ID and priority settings

### 2. Sync Mode Tests (3 tests)

Tests synchronous job completion:

- Waiting for results
- Result data extraction
- Error propagation

### 3. Error Handling Tests (5 tests)

Tests error scenarios:

- Service errors
- Invalid JSON
- Non-Error exceptions
- Timeout errors

### 4. Timeout Handling Tests (4 tests)

Tests timeout behavior:

- Job submission timeout (30s)
- Result waiting timeout (120s)
- Timeout error propagation

### 5. Status Polling Tests (5 tests)

Tests GET endpoint:

- Retrieving job status
- Progress tracking
- Completed status
- Failed status
- 404 for missing jobs

### 6. E2E Flow Tests (3 tests)

Tests complete pipelines:

- Full async flow with multiple polls
- Point-based segmentation
- Background removal use case

### 7. Worker Interaction Tests (4 tests)

Tests payload transformation:

- Point2D to array conversion
- Flag setting
- Worker ID assignment
- Priority configuration

### 8. Response Format Tests (2 tests)

Tests response structure:

- Async response fields
- Sync response fields

## Using Test Fixtures

```typescript
import { SegmentationPayloadFactory, JobResultFactory, TEST_DATA } from './test-fixtures';

// Create a test payload
const payload = SegmentationPayloadFactory.pointMode([
  { x: 100, y: 150 },
  { x: 300, y: 250 },
]);

// Create a mock result
const result = JobResultFactory.success('job_001');

// Use constants
const imageUrl = TEST_DATA.URLs.validImage;
const jobId = TEST_DATA.JOB_IDS.async;
```

## API Endpoints

### POST /api/segment - Submit Job

**Async Request:**

```json
{
  "imageUrl": "https://example.com/image.jpg",
  "mode": "automatic",
  "async": true
}
```

**Async Response:**

```json
{
  "jobId": "job_123_abc",
  "status": "queued",
  "estimatedWait": 5000
}
```

**Sync Request:**

```json
{
  "imageUrl": "https://example.com/image.jpg",
  "mode": "automatic",
  "async": false
}
```

**Sync Response (200):**

```json
{
  "jobId": "job_sync_001",
  "status": "completed",
  "masks": ["/outputs/job_sync_001/mask_0.png"],
  "inputImageUrl": "https://example.com/image.jpg",
  "outputDir": "/outputs/job_sync_001",
  "processingTime": 2500
}
```

**Error Response (400/500):**

```json
{
  "error": "imageUrl is required"
}
```

### GET /api/segment?jobId=<jobId> - Poll Status

**Request:**

```
GET /api/segment?jobId=job_123_abc
```

**Response (200):**

```json
{
  "jobId": "job_123_abc",
  "status": "processing",
  "progress": 45
}
```

**Response (404):**

```json
{
  "error": "Job not found"
}
```

## Segmentation Modes

### Automatic

Detects all objects in the image.

```typescript
{
  "imageUrl": "https://example.com/image.jpg",
  "mode": "automatic"
}
```

### Point

Segments objects at specified points.

```typescript
{
  "imageUrl": "https://example.com/image.jpg",
  "mode": "point",
  "points": [{ "x": 100, "y": 150 }, { "x": 300, "y": 250 }],
  "labels": [1, 0]  // 1=foreground, 0=background
}
```

### Box

Segments object in bounding box.

```typescript
{
  "imageUrl": "https://example.com/image.jpg",
  "mode": "box",
  "boxes": [{ "x1": 50, "y1": 50, "x2": 300, "y2": 300 }]
}
```

## Mocked Services

Tests mock these services completely:

- **JobSubmissionService** - Job queue and submission
- **JobResultService** - Result retrieval and progress tracking
- **Redis** - Job storage and pub/sub
- **SAM2 Worker** - No GPU required

## Coverage

The test suite achieves:

- **36 total tests**
- **Line coverage**: ~95% for route.ts
- **Branch coverage**: ~90% (error paths)
- **E2E scenarios**: 3 complete workflows
- **Timeout handling**: 4 dedicated tests
- **Error scenarios**: 5+ error cases

## Common Test Patterns

### Mock Job Submission

```typescript
mockJobSubmissionService.submitJob.mockResolvedValue({
  jobId: 'job_001',
  status: 'queued',
  estimatedWait: 5000,
});
```

### Mock Result Waiting

```typescript
mockJobResultService.waitForResult.mockResolvedValue({
  jobId: 'job_001',
  status: 'completed',
  data: {
    masks: ['/outputs/job_001/mask_0.png'],
    scores: [0.95],
    inputImageUrl: 'https://example.com/image.jpg',
    outputDir: '/outputs/job_001',
  },
  duration: 2500,
  completedAt: Date.now(),
});
```

### Assert Payload Transformation

```typescript
expect(mockJobSubmissionService.submitJob).toHaveBeenCalledWith(
  expect.objectContaining({
    payload: expect.objectContaining({
      points: [
        [100, 150],
        [300, 250],
      ],
      labels: [1, 0],
    }),
  }),
);
```

## Debugging Tests

### Run Single Test

```bash
npm test -- --testNamePattern="should submit job"
```

### Enable Debug Output

```typescript
console.log('Mock calls:', mockJobSubmissionService.submitJob.mock.calls);
```

### Watch Specific File

```bash
npm test route.test.ts -- --watch
```

## CI/CD Integration

Tests are ready for CI/CD:

```yaml
# GitHub Actions example
- name: Run tests
  run: npm test -- --coverage --ci

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Dependencies

Required for running tests:

- `jest` - Test framework
- `@types/jest` - Type definitions
- `@testing-library/jest-dom` - DOM matchers
- `next` - Next.js framework (for NextRequest)

Install with:

```bash
npm install --save-dev jest @types/jest @testing-library/jest-dom
```

## Troubleshooting

### Tests not found

Check that `jest.config.js` testMatch pattern includes `__tests__/**/*.test.ts`

### Mock not working

Ensure `jest.mock()` calls are at the top of the file, before imports

### Timeout errors

Increase Jest timeout:

```typescript
jest.setTimeout(20000); // 20 seconds
```

### Type errors

Install `@types/jest` and ensure TypeScript recognizes Jest globals

## Next Steps

1. Add component-level tests for related UI
2. Add E2E tests with real browser
3. Add performance benchmarks
4. Add visual regression tests for mask output
5. Integrate with CI/CD pipeline

## Documentation

- **TESTING_GUIDE.md** - Comprehensive testing guide
- **[Jest Docs](https://jestjs.io/)**
- **[Next.js Testing Docs](https://nextjs.org/docs/testing)**
