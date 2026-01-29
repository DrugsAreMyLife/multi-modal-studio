/**
 * Jest Configuration Template
 *
 * To use this configuration:
 * 1. Copy this file as jest.config.js
 * 2. Install dependencies: npm install --save-dev jest ts-jest @types/jest
 * 3. Run tests: npm test
 *
 * This configuration sets up Jest for TypeScript testing with:
 * - TypeScript support via ts-jest
 * - Node.js test environment
 * - Module path aliases matching tsconfig.json
 * - Coverage reporting with thresholds
 * - Test utilities setup
 */

module.exports = {
  // Use ts-jest to handle TypeScript files
  preset: 'ts-jest',

  // Run tests in Node.js environment (not browser)
  testEnvironment: 'node',

  // Search for tests in src directory
  roots: ['<rootDir>/src'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts', // Tests in __tests__ directories
    '**/?(*.)+(spec|test).ts', // Files ending in .test.ts or .spec.ts
  ],

  // Supported file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Module path aliases (matches tsconfig.json)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts', // Include all TypeScript files
    '!src/**/*.d.ts', // Exclude type definitions
    '!src/**/*.test.ts', // Exclude test files
    '!src/**/__tests__/**', // Exclude test directories
  ],

  // Minimum coverage thresholds (fail if not met)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Optional: Run setup file before tests
  // Uncomment after creating jest.setup.js
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Default timeout for tests (milliseconds)
  testTimeout: 10000,

  // TypeScript configuration for tests
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },

  // Verbose output for debugging
  // Uncomment for more detailed test output
  // verbose: true,

  // Bail on first test failure (useful for debugging)
  // Uncomment to stop on first failure
  // bail: 1,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Use fake timers (useful for testing setTimeout/setInterval)
  // Comment out if tests need real timers
  // timers: 'fake',
};
