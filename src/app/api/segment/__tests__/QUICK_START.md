# SAM2 Segmentation API Tests - Quick Start

## Installation (5 minutes)

### 1. Install Jest Dependencies

```bash
npm install --save-dev jest @types/jest @testing-library/jest-dom
```

### 2. Verify Configuration Files

Check that these files exist at project root:

- `jest.config.js` ✓
- `jest.setup.js` ✓

## Running Tests (30 seconds)

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test route.test.ts
```

### Run with Coverage Report

```bash
npm test -- --coverage
```

### Watch Mode (Auto-rerun on changes)

```bash
npm test -- --watch
```

## Expected Output

```
PASS  src/app/api/segment/__tests__/route.test.ts
  Segmentation API Route
    POST /api/segment - Async Mode
      ✓ should accept segmentation request and return job ID in async mode
      ✓ should return 400 when imageUrl is missing
      ✓ should return 400 when point mode is missing points
      ✓ should return 400 when box mode is missing boxes
      ✓ should handle point mode with points and labels
      ✓ should handle box mode with bounding boxes
      ✓ should convert segmentation error to string message
      ✓ should handle non-Error exceptions
      ✓ should return generic error message when result error is missing
      ✓ should use 30s timeout for job submission
    POST /api/segment - Sync Mode
      ✓ should wait for result in sync mode and return masks
      ✓ should propagate error when sync mode job fails
      ✓ should use 120s timeout for sync mode result waiting
    POST /api/segment - Error Handling
      ✓ should handle job submission service errors
      ✓ should handle invalid JSON in request body
      ✓ should convert segmentation error to string message
      ✓ should handle non-Error exceptions
    POST /api/segment - Timeout Handling
      ✓ should propagate timeout error from job submission
      ✓ should timeout when waiting for sync mode result
      ✓ should use 30s timeout for job submission
      ✓ should use 120s timeout for sync mode result waiting
    GET /api/segment - Job Status Polling
      ✓ should retrieve job status by jobId
      ✓ should return 400 when jobId parameter is missing
      ✓ should return 404 when job is not found
      ✓ should return completed status with results
      ✓ should return failed status with error
    E2E Flow - Complete Segmentation Pipeline
      ✓ should complete full async pipeline: submit -> poll -> get results
      ✓ should handle point-based segmentation with interactive refinement
      ✓ should handle background removal use case
    Worker Interaction and Payload Transformation
      ✓ should transform Point2D to coordinate arrays
      ✓ should set multimask_output flag correctly
      ✓ should use sam2 as worker ID for all segmentation requests
      ✓ should use normal priority and wait for ready by default
    Response Format Validation
      ✓ should include all required fields in async response
      ✓ should include masks in sync mode response

Test Suites: 1 passed, 1 total
Tests:       36 passed, 36 total
Snapshots:   0 total
Time:        3.2s
```

## File Locations

### Test Files

```
src/app/api/segment/__tests__/
├── route.test.ts           # Main test suite (36 tests)
├── test-fixtures.ts        # Factory functions & mocks
├── README.md               # Quick reference guide
├── TESTING_GUIDE.md        # Comprehensive guide
└── QUICK_START.md          # This file
```

### Configuration Files

```
project-root/
├── jest.config.js          # Jest configuration
├── jest.setup.js           # Jest setup file
└── TEST_IMPLEMENTATION_SUMMARY.md  # Implementation summary
```

## Test Categories

### 1. Async Mode (10 tests)

Tests async job submission:

- ✓ Job ID returned immediately
- ✓ Input validation
- ✓ Mode-specific validation
- ✓ Coordinate transformation

### 2. Sync Mode (3 tests)

Tests sync job waiting:

- ✓ Results returned after completion
- ✓ Error propagation
- ✓ Timeout handling

### 3. Error Handling (5 tests)

Tests error scenarios:

- ✓ Service errors
- ✓ Invalid payloads
- ✓ Exceptions

### 4. Timeout Handling (4 tests)

Tests timeout behavior:

- ✓ Submission timeout (30s)
- ✓ Result timeout (120s)
- ✓ Error propagation

### 5. Status Polling (5 tests)

Tests GET endpoint:

- ✓ Status retrieval
- ✓ Progress tracking
- ✓ Missing jobs

### 6. E2E Flows (3 tests)

Tests complete pipelines:

- ✓ Async submit → poll → completion
- ✓ Point-based segmentation
- ✓ Background removal

### 7. Worker Interaction (4 tests)

Tests payload transformation:

- ✓ Point2D → arrays
- ✓ Flag setting
- ✓ Worker configuration

### 8. Response Format (2 tests)

Tests response structure:

- ✓ Async response fields
- ✓ Sync response fields

## Using Test Fixtures

Import factories for creating test data:

```typescript
import { SegmentationPayloadFactory, JobResultFactory, TEST_DATA } from './test-fixtures';

// Create payloads
const payload = SegmentationPayloadFactory.automatic();
const points = SegmentationPayloadFactory.pointMode([{ x: 100, y: 150 }]);

// Create mock results
const result = JobResultFactory.success('job_001');
const failure = JobResultFactory.failure('job_002', 'Error message');

// Use test constants
const imageUrl = TEST_DATA.URLs.validImage;
const timeout = TEST_DATA.TIMEOUTS.jobSubmission;
```

## API Endpoints Tested

### POST /api/segment

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

**Sync Response:**

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

### GET /api/segment?jobId=<id>

**Request:**

```
GET /api/segment?jobId=job_123_abc
```

**Response:**

```json
{
  "jobId": "job_123_abc",
  "status": "processing",
  "progress": 45
}
```

## Segmentation Modes

### Automatic

```json
{
  "imageUrl": "https://example.com/image.jpg",
  "mode": "automatic"
}
```

### Point

```json
{
  "imageUrl": "https://example.com/image.jpg",
  "mode": "point",
  "points": [
    { "x": 100, "y": 150 },
    { "x": 300, "y": 250 }
  ],
  "labels": [1, 0]
}
```

### Box

```json
{
  "imageUrl": "https://example.com/image.jpg",
  "mode": "box",
  "boxes": [{ "x1": 50, "y1": 50, "x2": 300, "y2": 300 }]
}
```

## Debugging Tests

### Run Single Test

```bash
npm test -- --testNamePattern="should submit job"
```

### View All Test Names

```bash
npm test -- --listTests
```

### Enable Debug Output

```typescript
// In test file
console.log(mockService.submitJob.mock.calls);
```

### Clear Jest Cache

```bash
npm test -- --clearCache
```

## Troubleshooting

### Tests Not Found

Check `jest.config.js` has correct `testMatch` pattern:

```javascript
testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'];
```

### Mock Not Working

Ensure `jest.mock()` calls are at the top of file:

```typescript
jest.mock('@/lib/services/...')
import { ... } from '...'
```

### Type Errors

Install `@types/jest`:

```bash
npm install --save-dev @types/jest
```

### Timeout Errors

Increase Jest timeout in `jest.setup.js`:

```javascript
jest.setTimeout(20000); // 20 seconds
```

## Performance

### Expected Times

- **Full test suite**: 2-5 seconds
- **Single test**: 10-50ms
- **With coverage**: 10-15 seconds

### Optimization Tips

1. Run tests in watch mode for development
2. Use `--testNamePattern` to run specific tests
3. Run tests in parallel (Jest default)
4. Skip coverage for faster feedback

## Next Steps

### 1. Run Tests Locally

```bash
npm test
```

### 2. Read Documentation

- `README.md` - Overview and usage
- `TESTING_GUIDE.md` - Comprehensive reference

### 3. Integrate with CI/CD

- Add GitHub Actions workflow
- Run tests on pull requests
- Generate coverage reports

### 4. Extend Tests

- Add performance tests
- Add visual regression tests
- Add snapshot tests

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Testing Library](https://testing-library.com/)
- See `TESTING_GUIDE.md` for more detailed information

## Support

For issues or questions:

1. Check `TESTING_GUIDE.md` troubleshooting section
2. Review test comments in `route.test.ts`
3. Check Jest error messages for details
4. Consult `test-fixtures.ts` for factory usage

---

**You're ready to run tests!**

```bash
npm test
```
