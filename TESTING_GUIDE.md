# Testing Guide for Multi-Modal Generation Studio

This guide explains how to run unit tests for the backend services in this project.

## Overview

The project contains unit tests for backend services like the Job Submission Service. These tests use Jest for test execution and mocking.

## Prerequisites

### Install Testing Dependencies

```bash
npm install --save-dev jest ts-jest @types/jest
```

This installs:

- **jest**: The testing framework
- **ts-jest**: TypeScript support for Jest
- **@types/jest**: TypeScript type definitions for Jest

### Verify Installation

```bash
npx jest --version
```

## Running Tests

### Run All Tests

```bash
npx jest
```

### Run Specific Test File

```bash
npx jest src/lib/services/__tests__/job-submission-service.test.ts
```

### Run Tests in Watch Mode

```bash
npx jest --watch
```

Automatically reruns tests when files change.

### Run Tests with Coverage

```bash
npx jest --coverage
```

Generates a coverage report showing:

- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

### Run Specific Test Suite

```bash
npx jest --testNamePattern="submitJob - Successful submission"
```

### Run Specific Test

```bash
npx jest --testNamePattern="should successfully submit a job with valid options"
```

## Test Organization

### Job Submission Service Tests

**Location**: `src/lib/services/__tests__/job-submission-service.test.ts`

**Test Categories**:

1. **Successful Job Submission** (8 tests)
   - Valid options and payload handling
   - Priority level mapping
   - Job status storage
   - Timestamp generation
   - Model ID mapping
   - Wait time estimation

2. **Worker Readiness** (8 tests)
   - Health endpoint checks
   - Port mapping per worker
   - Timeout handling
   - Error gracefully handling
   - Readiness bypass option

3. **VRAM Management** (3 tests)
   - VRAM availability checks
   - Error handling
   - Successful submission validation

4. **Queue Integration** (3 tests)
   - Queue naming conventions
   - Job ID assignment
   - Failure handling

5. **Job Status Retrieval** (4 tests)
   - Redis status lookup
   - Null handling
   - JSON parsing
   - Error handling

6. **Singleton Pattern** (2 tests)
   - Instance reuse
   - Lazy initialization

7. **Edge Cases** (6 tests)
   - Complex payloads
   - Empty payloads
   - Redis failures
   - Data integrity
   - Worker type coverage

8. **Integration Flows** (3 tests)
   - End-to-end data flow
   - Concurrent submissions
   - Status tracking

## Test Utilities

**Location**: `src/lib/services/__tests__/test-utils.ts`

Helper functions for testing:

```typescript
// Create mock job submission options
const options = createMockSubmitJobOptions({
  workerId: 'sam2',
  payload: { test: true },
});

// Create mock job status
const status = createMockJobStatus({
  status: 'processing',
  progress: 50,
});

// Worker constants
TEST_WORKERS.SAM2;
TEST_WORKERS.HUNYUAN_VIDEO;
// ... etc

// Setup mocks
setupSuccessfulJobSubmissionMocks(mockRedis, mockQueue);

// Verify behavior
verifyJobQueued(mockQueue, jobId, 'sam2');
verifyJobStatusStored(mockRedis, jobId);
```

## Mocking Strategy

### Redis Mock

The tests mock Redis connections to:

- Store job status
- Retrieve job status
- Test TTL (time-to-live) settings

```typescript
const mockRedis = {
  set: jest.fn(),
  get: jest.fn(),
  // ... other methods
};
```

### BullMQ Queue Mock

The tests mock the job queue to:

- Verify job data is formatted correctly
- Check priority mapping
- Validate job ID assignment
- Simulate queue operations

```typescript
const mockBatchQueue = {
  add: jest.fn(),
  getWaitingCount: jest.fn(),
  // ... other methods
};
```

### Fetch Mock

The tests mock HTTP requests to:

- Simulate worker health checks
- Test success and failure scenarios
- Verify correct endpoints are called

```typescript
global.fetch = jest.fn();
```

## Common Test Patterns

### Successful Operation

```typescript
// Arrange
const options = createMockSubmitJobOptions();
mockRedis.set.mockResolvedValue('OK');
mockBatchQueue.add.mockResolvedValue({ id: 'job_1' });

// Act
const result = await service.submitJob(options);

// Assert
expect(result.status).toBe('queued');
expect(mockBatchQueue.add).toHaveBeenCalled();
```

### Error Handling

```typescript
// Arrange
const options = createMockSubmitJobOptions();
mockBatchQueue.add.mockRejectedValue(new Error('Queue error'));

// Act & Assert
await expect(service.submitJob(options)).rejects.toThrow('Queue error');
```

### Mock Verification

```typescript
// Verify called with correct arguments
expect(mockBatchQueue.add).toHaveBeenCalledWith(
  'sam2-job',
  expect.objectContaining({
    model_id: 'facebook/sam2',
  }),
  expect.any(Object),
);
```

## Debugging Tests

### Run Single Test

```bash
npx jest --testNamePattern="should successfully submit a job"
```

### Run Tests in Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome to debug.

### Verbose Output

```bash
npx jest --verbose
```

### Print Debug Info

Add `console.log()` statements in tests:

```typescript
it('should test something', async () => {
  const result = await service.submitJob(options);
  console.log('Result:', result); // This will print in test output
  expect(result.status).toBe('queued');
});
```

## Test Configuration

The tests are configured via:

1. **jest.config.js** - Main Jest configuration
   - Test environment (Node.js)
   - Module resolution
   - TypeScript support
   - Coverage thresholds

2. **jest.setup.js** - Test environment setup
   - Global utilities
   - Mock cleanup
   - Timeout configuration

3. **tsconfig.json** - TypeScript configuration
   - Already configured for the project
   - No changes needed for tests

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Run tests
  run: npm test -- --coverage --ci

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Coverage Requirements

The project enforces minimum coverage thresholds:

- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

View coverage report after running tests:

```bash
npx jest --coverage
```

Then open `coverage/lcov-report/index.html` in a browser.

## Adding New Tests

When adding new tests:

1. Create test file in `__tests__` directory with `.test.ts` suffix
2. Mock external dependencies (Redis, queues, HTTP calls)
3. Follow AAA pattern (Arrange, Act, Assert)
4. Use descriptive test names
5. Test both success and error paths
6. Verify mock interactions

Example:

```typescript
describe('NewFeature', () => {
  describe('someMethod', () => {
    it('should do something when condition is met', async () => {
      // Arrange
      const input = { ... };
      jest.spyOn(module, 'dependency').mockResolvedValue({ ... });

      // Act
      const result = await service.someMethod(input);

      // Assert
      expect(result).toEqual(expectedValue);
      expect(module.dependency).toHaveBeenCalledWith(expectedInput);
    });
  });
});
```

## Troubleshooting

### Tests Not Found

Ensure test files match pattern: `**/__tests__/**/*.test.ts`

### TypeScript Errors

```bash
# Clear Jest cache
npx jest --clearCache

# Run again
npx jest
```

### Timeout Errors

If tests timeout:

```bash
# Increase timeout
npx jest --testTimeout=30000

# Or in test:
jest.setTimeout(30000);
```

### Mock Not Working

Ensure mock is set up before test runs:

```typescript
// Wrong - mock setup inside test
it('test', () => {
  jest.mock('module'); // Too late!
});

// Right - mock setup before test
jest.mock('module'); // At top of file
it('test', () => {
  // Mock is active
});
```

## Next Steps

1. **Run existing tests**: `npx jest src/lib/services/__tests__/job-submission-service.test.ts`
2. **Review test output**: Check what tests pass/fail
3. **Check coverage**: `npx jest --coverage`
4. **Add new tests**: For new features or bug fixes
5. **Integrate with CI**: Add test step to your pipeline

## Resources

- [Jest Documentation](https://jestjs.io/)
- [ts-jest Guide](https://kulshekhar.github.io/ts-jest/)
- [Testing Best Practices](https://jestjs.io/docs/getting-started)

## Related Files

- **Tests**: `src/lib/services/__tests__/`
- **Implementation**: `src/lib/services/job-submission-service.ts`
- **Types**: `src/lib/types/job-submission.ts`
- **Configuration**: `jest.config.js`
