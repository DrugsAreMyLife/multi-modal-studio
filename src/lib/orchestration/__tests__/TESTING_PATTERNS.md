# Testing Patterns and Best Practices

## SemanticProcessor & SemanticLLMProvider Test Suite

This document outlines the testing patterns, conventions, and best practices used in the comprehensive test suite.

---

## Test Structure

### Organize by Functionality

```typescript
describe('SemanticProcessor.parseScript', () => {
  describe('geometric constraint extraction', () => {
    it('should extract gear geometric constraint', () => {
      // Single responsibility per test
    });
  });

  describe('material constraint extraction', () => {
    // More tests
  });
});
```

### Nested Describe Blocks

Tests are organized hierarchically for clear navigation:

- Main feature being tested (parseScript, parseCreativeIntent)
- Category (constraint type, operation type)
- Individual test cases

---

## Test Naming Conventions

### Naming Pattern

```
it('should [action] [condition] [expected outcome]')
```

### Examples

✅ **Good**

```typescript
it('should extract gear geometric constraint from script containing "gear"');
it('should return null for unrecognized command');
it('should handle case-insensitive input');
it('should assign unique IDs to constraints');
```

❌ **Bad**

```typescript
it('test parseScript');
it('works');
it('extracts stuff');
it('gear test');
```

---

## AAA Pattern (Arrange, Act, Assert)

### Syntax

```typescript
it('should extract constraint', () => {
  // ARRANGE - Set up test data
  const script = 'Design a durable gear';

  // ACT - Execute the function
  const constraints = SemanticProcessor.parseScript(script);

  // ASSERT - Verify results
  expect(constraints[0].type).toBe('material');
});
```

### Benefits

- Clear test structure
- Easy to understand what's being tested
- Separates test setup from verification

---

## Common Assertion Patterns

### Array Assertions

```typescript
// Check length
expect(constraints).toHaveLength(1);
expect(constraints.length).toBeGreaterThan(0);
expect(constraints.length).toBeLessThanOrEqual(5);

// Check contents
expect(constraints).toContain(expectedItem);
expect(constraints.some((c) => c.type === 'geometric')).toBe(true);
expect(constraints.find((c) => c.key === 'pitch')).toBeDefined();

// Check existence and properties
expect(constraints[0]).toBeDefined();
expect(constraints[0].type).toBe('geometric');
```

### Object Assertions

```typescript
// Exact equality
expect(constraint).toEqual({
  type: 'geometric',
  key: 'internal_pitch',
  value: 'modular',
  confidence: 0.95,
});

// Partial matching
expect(constraint).toMatchObject({
  type: 'geometric',
  key: 'internal_pitch',
  // Other fields don't need to match
});

// Individual property checks
expect(constraint.confidence).toBe(0.95);
expect(constraint.key).toBe('internal_pitch');
```

### String Assertions

```typescript
// Exact match
expect(intent.operation).toBe('background_removal');

// Contains
expect(prompt).toContain('geometric');
expect(prompt).toContain('JSON');

// Pattern matching
expect(constraintId).toMatch(/^constraint_\d+_0$/);
```

### Type Assertions

```typescript
// Primitive types
expect(typeof constraint.confidence).toBe('number');
expect(typeof intent.domain).toBe('string');

// Check null/undefined
expect(intent).toBeNull();
expect(intent).not.toBeNull();
expect(intent).toBeDefined();
expect(intent).not.toBeDefined();
```

### Number Assertions

```typescript
// Range checks
expect(confidence).toBeGreaterThan(0);
expect(confidence).toBeGreaterThanOrEqual(0.5);
expect(confidence).toBeLessThan(1);
expect(confidence).toBeLessThanOrEqual(1);

// Specific values
expect(confidence).toBe(0.95);
expect(tolerance).toBeCloseTo(0.01, 3);
```

### Async/Error Assertions

```typescript
// Expect error
await expect(
  provider.analyzeConstraints({ text: 'test', domain: 'geometric', provider: 'unknown' }),
).rejects.toThrow('Unknown provider');

// Expect error type
await expect(fn()).rejects.toThrow(CustomError);
```

---

## Test Data Patterns

### Minimal Valid Data

```typescript
// Simplest case that exercises the function
const script = 'Design a gear';
const constraints = SemanticProcessor.parseScript(script);
expect(constraints[0].type).toBe('geometric');
```

### Edge Cases

```typescript
// Empty input
SemanticProcessor.parseScript('');
// Expected: []

// Whitespace
SemanticProcessor.parseScript('   \n\t  ');
// Expected: []

// Very long input
'gear '.repeat(1000);
// Expected: proper extraction despite size

// Special characters
('Design a @#$%^&*() gear!');
// Expected: extraction works
```

### Complex Realistic Data

```typescript
const script = `
  Design a durable gear mechanism that can handle heavy load.
  The gear must have modular pitch and heat resistance.
  Weight distribution should be optimized.
`;
// Expected: 3+ constraints extracted
```

---

## Mocking Patterns

### Mock SDK Initialization

```typescript
jest.mock('@anthropic-ai/sdk');
jest.mock('openai');

// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Mock Return Values (when needed)

```typescript
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: '[]' }],
      }),
    },
  })),
}));
```

### Access Private Methods for Testing

```typescript
// TypeScript allows accessing private methods for testing
const constraints = (provider as any).parseConstraints(response, 'geometric');
```

---

## Error Handling Patterns

### Test Invalid Input

```typescript
it('should throw error for invalid provider', async () => {
  await expect(
    provider.analyzeConstraints({
      text: 'test',
      domain: 'geometric',
      provider: 'invalid' as any,
    }),
  ).rejects.toThrow('Unknown provider');
});
```

### Test Graceful Degradation

```typescript
it('should return empty array for invalid JSON', () => {
  const response = 'Not JSON at all';
  const constraints = (provider as any).parseConstraints(response, 'geometric');

  expect(constraints).toEqual([]);
  // No error thrown, graceful handling
});
```

---

## Integration Test Patterns

### Test Cross-Module Interactions

```typescript
it('should extract script constraints and parse creative intent together', () => {
  const script = 'Design a durable gear with CNC capabilities';

  // Use multiple functions together
  const constraints = SemanticProcessor.parseScript(script);
  const intent = SemanticProcessor.parseCreativeIntent(script);

  // Verify both work together
  expect(constraints.length).toBeGreaterThan(0);
  expect(intent).not.toBeNull();
});
```

### Test Artifact Creation

```typescript
it('should create artifact with constraints and intent', () => {
  const script = 'Build a heat-resistant part that needs background removal';

  // Gather data from multiple sources
  const constraints = SemanticProcessor.parseScript(script);
  const intent = SemanticProcessor.parseCreativeIntent(script);

  // Combine into artifact
  const artifact: SemanticArtifact = {
    id: 'test-artifact',
    source: 'creative',
    tags: ['test'],
    constraints,
    creativeIntent: intent || undefined,
    timestamp: Date.now(),
  };

  // Verify artifact coherence
  expect(artifact.constraints.some((c) => c.type === 'material')).toBe(true);
  expect(artifact.creativeIntent?.operation).toBe('background_removal');
});
```

---

## Performance Considerations

### Keep Tests Small and Fast

```typescript
// Good - focused test, single assertion usually
it('should extract gear constraint', () => {
  const constraints = SemanticProcessor.parseScript('gear');
  expect(constraints[0].type).toBe('geometric');
});

// Avoid - testing too much
it('should do many things', () => {
  // Multiple assertions and concepts
  // Harder to debug if it fails
});
```

### Use Parameterized Tests for Similar Cases

```typescript
describe('constraint type mapping', () => {
  const testCases = [
    { domain: 'geometric', keyword: 'gear' },
    { domain: 'material', keyword: 'durable' },
    { domain: 'structural', keyword: 'load' },
  ];

  testCases.forEach(({ domain, keyword }) => {
    it(`should map ${keyword} to ${domain}`, () => {
      const constraints = SemanticProcessor.parseScript(keyword);
      expect(constraints.some((c) => c.type === domain)).toBe(true);
    });
  });
});
```

---

## Type Safety Patterns

### Use Type Assertions When Testing Private Methods

```typescript
// Accessing private parseConstraints method
const constraints = (provider as any).parseConstraints(response, 'geometric');

// Alternative: Create a public interface for testing
class TestableSemanticLLMProvider extends SemanticLLMProvider {
  public testParseConstraints(response: string, domain: string) {
    return this.parseConstraints(response, domain);
  }
}
```

### Strict Type Checking

```typescript
// Ensure domain types are correct
const domains: Array<'geometric' | 'material' | 'structural' | 'creative'> = [
  'geometric',
  'material',
  'structural',
  'creative',
];

domains.forEach((domain) => {
  it(`should handle ${domain} domain`, () => {
    // Type-safe test
  });
});
```

---

## Test Isolation Patterns

### Clear State Between Tests

```typescript
beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();

  // Clear module cache if needed
  jest.resetModules();
});

afterEach(() => {
  // Clean up resources
  jest.clearAllMocks();
});
```

### Independent Test Data

```typescript
// Good - each test creates its own data
it('test 1', () => {
  const script = 'gear';
  const constraints = SemanticProcessor.parseScript(script);
  expect(constraints[0].type).toBe('geometric');
});

it('test 2', () => {
  const script = 'durable';
  const constraints = SemanticProcessor.parseScript(script);
  expect(constraints[0].type).toBe('material');
});

// Avoid - sharing state between tests
const script = 'gear';

it('test 1', () => {
  const constraints = SemanticProcessor.parseScript(script);
  // Depends on external state
});
```

---

## Readability Patterns

### Use Descriptive Variable Names

```typescript
// Good
const scriptWithDurableKeyword = 'Build a durable part';
const constraints = SemanticProcessor.parseScript(scriptWithDurableKeyword);
const materialConstraint = constraints.find((c) => c.type === 'material');
expect(materialConstraint?.key).toBe('base_polymer');

// Avoid
const s = 'Build a durable part';
const c = SemanticProcessor.parseScript(s);
const m = c.find((c) => c.type === 'material');
expect(m?.key).toBe('base_polymer');
```

### Comment Complex Logic

```typescript
it('should handle constraints with missing confidence', () => {
  // When LLM response doesn't include confidence,
  // the parser should default to 0.8
  const response = JSON.stringify([{ key: 'test', value: 'value' }]);
  const constraints = (provider as any).parseConstraints(response, 'creative');

  expect(constraints[0].confidence).toBe(0.8);
});
```

---

## Test Reporting

### Useful Output

```bash
# Verbose output shows which tests pass/fail
npm test -- --verbose SemanticProcessor.test.ts

# Coverage report
npm test -- --coverage SemanticProcessor.test.ts

# Watch mode for development
npm test -- --watch SemanticProcessor.test.ts

# Single test
npm test -- --testNamePattern="should extract gear" SemanticProcessor.test.ts
```

### Expected Output

```
PASS  src/lib/orchestration/__tests__/SemanticProcessor.test.ts
  SemanticProcessor.parseScript
    geometric constraint extraction
      ✓ should extract gear geometric constraint (5ms)
      ✓ should extract gear constraint case-insensitively (2ms)
      ✓ should not extract geometric constraints (3ms)
    material constraint extraction
      ✓ should extract material constraint from "durable" (2ms)
      ...

  SemanticProcessor.parseCreativeIntent
    raster operations
      ✓ should parse background removal intent (3ms)
      ...

Test Suites: 1 passed, 1 total
Tests:       64 passed, 64 total
Time:        2.345s
Coverage:    Statements 96%, Branches 91%, Functions 100%, Lines 96%
```

---

## Troubleshooting Guide

### Issue: Test Times Out

**Solution**: Check for unresolved promises

```typescript
// Bad - promise not awaited
it('test', async () => {
  provider.analyzeConstraints(...); // Missing await
});

// Good
it('test', async () => {
  await provider.analyzeConstraints(...);
});
```

### Issue: Mock Not Applied

**Solution**: Clear mocks and ensure setup order

```typescript
beforeEach(() => {
  jest.clearAllMocks(); // Must clear before each test
});

// Mocks must be defined at module level
jest.mock('@anthropic-ai/sdk');
```

### Issue: Type Errors

**Solution**: Use proper TypeScript types

```typescript
// Good
const domains: Array<'geometric' | 'material' | 'structural' | 'creative'> = ['geometric'];

// Bad
const domains: string[] = ['geometric']; // Loses type info
```

### Issue: False Positive in Tests

**Solution**: Verify test actually tests what you think

```typescript
// Make sure you're testing the right thing
it('should extract constraint', () => {
  const constraints = SemanticProcessor.parseScript('gear');

  // VERIFY: This is actually checking what we want
  expect(constraints).toHaveLength(1); // ✓ Correct
  expect(constraints[0]?.type).toBe('geometric'); // ✓ Specific
});
```

---

## Summary

This test suite follows industry best practices:

- ✅ Clear naming conventions
- ✅ AAA pattern (Arrange, Act, Assert)
- ✅ Mocked external dependencies
- ✅ Comprehensive edge case coverage
- ✅ Type-safe assertions
- ✅ Isolated, independent tests
- ✅ Integration tests for cross-module behavior
- ✅ Readable, maintainable code
