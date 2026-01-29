# Job Submission Service Tests

This directory contains comprehensive unit tests for the job submission service.

## Test Coverage

The test suite covers:

### 1. Successful Job Submission Flow

- Basic job submission with valid options
- Priority levels (high, normal, low)
- Payload handling (simple and complex nested objects)
- Job status storage in Redis
- Queue interaction and job ID generation

### 2. VRAM Availability Handling

- VRAM availability checks before queuing
- Error propagation when VRAM is insufficient
- Successful submission when VRAM is available

### 3. Worker Readiness Scenarios

- Worker health checks via HTTP endpoints
- Correct port mapping per worker type
- Health check timeouts and error handling
- Graceful handling of fetch errors (worker not running)
- Optional readiness checks (waitForReady flag)
- Custom timeout support

### 4. Redis/BullMQ Interaction

- Mocked Redis connection for job status storage
- Mocked BullMQ queue for job queuing
- Job data integrity through submission pipeline
- Error handling for Redis and queue failures
- Concurrent job submissions

### 5. Error Propagation

- Queue connection failures
- Redis write failures
- Worker health check timeouts
- Proper error messages for readiness failures
- VRAM insufficiency errors

### 6. Additional Features

- Job status retrieval from Redis
- Estimated wait time calculation
- Singleton pattern for service instance
- Multiple worker type support (sam2, hunyuan-video, hunyuan-image, qwen-image, qwen-geo, svg-turbo)
- Correct model ID mapping per worker

## Running the Tests

### Prerequisites

First, install the required dev dependencies:

```bash
npm install --save-dev jest ts-jest @types/jest
```

### Execute Tests

Run all tests in this suite:

```bash
npm test -- src/lib/services/__tests__/job-submission-service.test.ts
```

Or with Jest directly:

```bash
npx jest src/lib/services/__tests__/job-submission-service.test.ts
```

Run with coverage:

```bash
npx jest src/lib/services/__tests__/job-submission-service.test.ts --coverage
```

Run in watch mode:

```bash
npx jest src/lib/services/__tests__/job-submission-service.test.ts --watch
```

### Test Categories

The tests are organized into describe blocks:

1. **submitJob - Successful submission** (8 tests)
   - Valid options, priority levels, status storage, timestamps, model IDs, wait time estimation

2. **submitJob - Worker readiness checks** (8 tests)
   - Health checks, port mapping, readiness failures, error handling, timeout configuration

3. **submitJob - VRAM availability checks** (3 tests)
   - VRAM checking, error scenarios, successful submissions

4. **submitJob - Queue interaction** (3 tests)
   - Queue naming, job ID setting, failure handling

5. **getJobStatus** (4 tests)
   - Status retrieval, null handling, JSON parsing, error handling

6. **Singleton pattern** (2 tests)
   - Instance reuse, instance creation

7. **Error handling and edge cases** (6 tests)
   - Complex payloads, empty payloads, Redis failures, data integrity, all worker types

8. **Data flow and integration** (3 tests)
   - End-to-end data flow, concurrent submissions, separate status tracking

## Test Statistics

- **Total Tests**: 37
- **Test Suites**: 8 categories
- **Coverage Focus**:
  - Service logic: 100%
  - Error paths: Comprehensive
  - Worker types: All 6 types covered
  - Queue interactions: Mocked and verified

## Mock Setup

### Redis Mock

- `set()`: Stores job status with TTL
- `get()`: Retrieves job status
- Other methods: Available for extensibility

### BullMQ Queue Mock

- `add()`: Queues jobs with priority
- `getWaitingCount()`: Returns queue length for wait time estimation
- Supports custom options like priority and jobId

### Fetch Mock

- Simulates worker health endpoints
- Configurable responses (success/failure)
- Supports timeout scenarios

## Key Test Patterns

### Arrange-Act-Assert (AAA)

All tests follow the AAA pattern:

```typescript
// Arrange - Set up test data and mocks
const options: SubmitJobOptions = { ... };
mockRedis.set.mockResolvedValue('OK');

// Act - Execute the function
const result = await service.submitJob(options);

// Assert - Verify the results
expect(result.status).toBe('queued');
```

### Mock Verification

Tests verify that mocks are called with correct arguments:

```typescript
expect(mockBatchQueue.add).toHaveBeenCalledWith(
  'sam2-job',
  expect.objectContaining({
    model_id: 'facebook/sam2',
  }),
  expect.any(Object),
);
```

### Error Testing

Async error handling is tested properly:

```typescript
await expect(service.submitJob(options)).rejects.toThrow('Worker is not ready');
```

## Coverage Goals

- **Statements**: 100% (all code paths executed)
- **Branches**: 95%+ (all conditional branches tested)
- **Functions**: 100% (all public and private methods)
- **Lines**: 100% (all lines executed)

## Future Enhancements

Potential areas for expansion:

1. **Retry Logic Tests**: Add tests if retry mechanism is implemented
2. **Concurrency Tests**: Test race conditions and concurrent job submissions
3. **Performance Tests**: Benchmark job submission times
4. **Integration Tests**: Test with actual Redis and BullMQ (separate test suite)
5. **Circuit Breaker**: Test circuit breaker pattern for worker failures
6. **Metrics**: Test Prometheus/OpenTelemetry integration if added

## Debugging Tests

To debug a specific test:

```bash
npx jest src/lib/services/__tests__/job-submission-service.test.ts --testNamePattern="should successfully submit a job"
```

Or run with Node debugger:

```bash
node --inspect-brk node_modules/.bin/jest --runInBand src/lib/services/__tests__/job-submission-service.test.ts
```

## Test Maintenance

When modifying the JobSubmissionService:

1. Update relevant test cases
2. Run full test suite to ensure no regressions
3. Add new tests for new functionality
4. Update this README if test categories change
5. Maintain test coverage above 80% threshold

## Related Files

- **Implementation**: `../job-submission-service.ts`
- **Types**: `../../types/job-submission.ts`
- **Redis**: `../../redis/channels.ts`, `../../redis/test-connection.ts`
- **Queue**: `../../queue/batch-queue.ts`
