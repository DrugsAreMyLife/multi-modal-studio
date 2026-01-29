# Jest Setup Instructions

This document explains how to set up and run the unit tests for the Job Submission Service.

## Step 1: Install Dependencies

Install the required testing packages:

```bash
npm install --save-dev jest ts-jest @types/jest
```

**What each package does:**

- `jest` - The testing framework
- `ts-jest` - Enables TypeScript support in Jest
- `@types/jest` - TypeScript type definitions for Jest

## Step 2: Create Jest Configuration

You have two options:

### Option A: Automatic Setup (Recommended)

Copy the template configuration:

```bash
cp jest.config.template.js jest.config.js
```

### Option B: Manual Setup

Create `jest.config.js` in the project root with:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testTimeout: 10000,
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
};
```

## Step 3: Create Jest Setup File (Optional)

Create `jest.setup.js` in the project root:

```javascript
// Jest Setup File
beforeAll(() => {
  // Global setup
});

afterEach(() => {
  // Cleanup after each test
  jest.clearAllMocks();
});

jest.setTimeout(10000);
```

Then uncomment in `jest.config.js`:

```javascript
setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
```

## Step 4: Update package.json Scripts (Optional)

Add test scripts to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest src/lib/services/__tests__",
    "test:ci": "jest --coverage --ci --maxWorkers=2"
  }
}
```

Then you can use:

```bash
npm test
npm run test:watch
npm run test:coverage
npm run test:unit
npm run test:ci
```

## Step 5: Verify Installation

Run the tests to verify everything is working:

```bash
npx jest src/lib/services/__tests__/job-submission-service.test.ts
```

You should see output like:

```
PASS  src/lib/services/__tests__/job-submission-service.test.ts
  JobSubmissionService
    submitJob - Successful submission
      ✓ should successfully submit a job with valid options (45ms)
      ✓ should submit job with high priority (12ms)
      ... [37 tests total]

Test Suites: 1 passed, 1 total
Tests:       37 passed, 37 total
Snapshots:   0 total
Time:        2.456s
```

## Running Tests

### All Tests

```bash
npx jest
```

### Job Submission Service Tests Only

```bash
npx jest src/lib/services/__tests__/job-submission-service.test.ts
```

### Watch Mode (Auto-rerun on file changes)

```bash
npx jest --watch
```

### With Coverage Report

```bash
npx jest --coverage
```

Opens coverage/lcov-report/index.html for visual coverage report.

### Specific Test

```bash
npx jest --testNamePattern="should successfully submit a job"
```

### Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome to debug.

## Troubleshooting

### Issue: "Cannot find module"

**Solution**: Clear Jest cache and reinstall dependencies

```bash
npx jest --clearCache
npm install
npx jest
```

### Issue: TypeScript compilation errors

**Solution**: Ensure `jest.config.js` is in project root

```bash
ls -la jest.config.js
```

### Issue: Tests timeout

**Solution**: Increase timeout in jest.config.js

```javascript
testTimeout: 30000, // 30 seconds
```

Or in individual tests:

```typescript
it('test', async () => {
  jest.setTimeout(30000);
  // test code
}, 30000);
```

### Issue: Mocks not working

**Solution**: Ensure mocks are set up before imports

```typescript
// ✓ Correct - mock before import
jest.mock('../../redis/test-connection');

// ✗ Wrong - mock after import
import { getRedisConnection } from '../../redis/test-connection';
jest.mock('../../redis/test-connection');
```

### Issue: "Failed to parse config" error

**Solution**: Check jest.config.js syntax

```bash
node -c jest.config.js
```

## Continuous Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm install

      - run: npm install --save-dev jest ts-jest @types/jest

      - run: npm test -- --coverage

      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
test:
  image: node:18
  script:
    - npm install
    - npm install --save-dev jest ts-jest @types/jest
    - npm test -- --coverage
  coverage: '/Lines\s*:\s*(\d+.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Create jest.config.js
3. ✅ Run tests: `npx jest`
4. ✅ Check coverage: `npx jest --coverage`
5. ✅ Add to package.json scripts
6. ✅ Integrate with CI/CD
7. ✅ Add pre-commit hook (optional)

## Pre-commit Hook (Optional)

Install husky and lint-staged:

```bash
npm install --save-dev husky lint-staged
npx husky install
```

Create `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.test.ts": "jest --bail --findRelatedTests"
  }
}
```

## Useful Commands

```bash
# Run all tests
npx jest

# Run tests in watch mode
npx jest --watch

# Run with coverage
npx jest --coverage

# Run specific file
npx jest src/lib/services/__tests__/job-submission-service.test.ts

# Run specific test by name
npx jest -t "should successfully submit a job"

# Run tests matching pattern
npx jest --testNamePattern="submitJob"

# Debug a specific test
node --inspect-brk node_modules/.bin/jest --runInBand -t "test name"

# Update snapshots (if using snapshot testing)
npx jest -u

# Clear cache
npx jest --clearCache

# Dry run (show what would run)
npx jest --listTests

# Show test file graph
npx jest --showConfig
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
- [Jest Best Practices](https://jestjs.io/docs/getting-started)
- [Testing Library Documentation](https://testing-library.com/)

## Support

For issues or questions:

1. Check `/TESTING_GUIDE.md` for general testing guidance
2. Review test examples in `job-submission-service.test.ts`
3. Check test utilities in `test-utils.ts`
4. Consult Jest documentation at https://jestjs.io/

## Summary

You now have:

- ✅ Full unit test suite (37 tests)
- ✅ Test utilities and helpers
- ✅ Comprehensive documentation
- ✅ Jest configuration template
- ✅ Setup instructions
- ✅ Troubleshooting guide
- ✅ CI/CD integration examples

Start testing! 🚀
