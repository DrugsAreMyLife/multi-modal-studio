/**
 * Jest Setup File
 *
 * Runs before each test suite
 * Configure:
 * - Testing library matchers
 * - Global mocks
 * - Test timeout
 */

// Add Jest matchers from @testing-library/jest-dom
import '@testing-library/jest-dom';

// Increase timeout for integration tests (especially for API route tests)
jest.setTimeout(10000);

// Suppress console errors in tests (optional)
// const originalError = console.error
// beforeAll(() => {
//   console.error = (...args) => {
//     if (
//       typeof args[0] === 'string' &&
//       args[0].includes('Warning: ReactDOM.render')
//     ) {
//       return
//     }
//     originalError.call(console, ...args)
//   }
// })

// afterAll(() => {
//   console.error = originalError
// })
