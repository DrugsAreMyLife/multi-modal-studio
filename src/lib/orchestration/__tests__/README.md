# SemanticProcessor & SemanticLLMProvider Unit Tests

## Quick Start

### Files

- **Test File**: `SemanticProcessor.test.ts` (829 lines, 111 test blocks)
- **Coverage Summary**: `TEST_COVERAGE_SUMMARY.md`
- **Source Files**:
  - `/src/lib/orchestration/SemanticProcessor.ts`
  - `/src/lib/llm/semantic-llm-provider.ts`

### What's Tested

#### SemanticProcessor (36 tests)

1. **parseScript()** - Constraint extraction from text (18 tests)
   - Geometric constraints (gear → internal_pitch)
   - Material constraints (durable/heat → base_polymer)
   - Structural constraints (load/weight → min_infill)
   - Multiple constraints, confidence scores, edge cases

2. **parseCreativeIntent()** - Creative command parsing (18 tests)
   - Raster operations (background removal, lighting harmonization)
   - Vector operations (vectorization, CNC standardization)
   - Case insensitivity, null handling, special characters

3. **alignModalities()** - Mesh/fabrication alignment (3 tests)

#### SemanticLLMProvider (20 tests)

1. **Initialization** - Config setup and client initialization
2. **parseConstraints()** - JSON parsing from LLM responses
3. **getSystemPrompt()** - Domain-specific prompt generation
4. **Error Handling** - Provider validation and error states
5. **Domain Mapping** - Constraint type consistency

#### Supporting Tests (6 tests)

- SemanticArtifact structure and creation
- Integration tests combining multiple functions

### Test Execution

```bash
# Install dependencies (if needed)
npm install

# Run the test file
npm test -- SemanticProcessor.test.ts

# Run with coverage report
npm test -- --coverage SemanticProcessor.test.ts

# Run specific test suite
npm test -- --testNamePattern="parseScript" SemanticProcessor.test.ts

# Watch mode for development
npm test -- --watch SemanticProcessor.test.ts
```

### Test Organization

```
SemanticProcessor.test.ts
├── SemanticProcessor.parseScript()
│   ├── geometric constraint extraction (3 tests)
│   ├── material constraint extraction (4 tests)
│   ├── structural constraint extraction (4 tests)
│   ├── multiple constraint extraction (2 tests)
│   └── edge cases (5 tests)
│
├── SemanticProcessor.parseCreativeIntent()
│   ├── raster operations (5 tests)
│   ├── vector operations (6 tests)
│   ├── unrecognized intents (4 tests)
│   └── edge cases (3 tests)
│
├── SemanticProcessor.alignModalities()
│   └── 3 basic tests
│
├── SemanticLLMProvider
│   ├── initialization (3 tests)
│   ├── parseConstraints() (8 tests)
│   ├── getSystemPrompt() (5 tests)
│   ├── error handling (3 tests)
│   └── domain mapping (1 test)
│
├── SemanticArtifact
│   └── 3 structure tests
│
└── Integration Tests
    └── 3 combined operation tests
```

### Key Test Scenarios

#### Constraint Extraction

```typescript
// Input
const script = 'Design a durable gear with heavy load requirements';

// Output
SemanticProcessor.parseScript(script);
// Returns: [
//   { type: 'geometric', key: 'internal_pitch', value: 'modular', confidence: 0.95 },
//   { type: 'material', key: 'base_polymer', value: 'PA12-CF', confidence: 0.88 },
//   { type: 'structural', key: 'min_infill', value: '40%', confidence: 0.82 }
// ]
```

#### Creative Intent Parsing

```typescript
// Raster operation
SemanticProcessor.parseCreativeIntent('remove background from the image');
// Returns: {
//   domain: 'raster',
//   operation: 'background_removal',
//   parameters: { method: 'SAM-v3', precision: 'high' },
//   confidence: 0.98
// }

// Vector operation
SemanticProcessor.parseCreativeIntent('vectorize to SVG');
// Returns: {
//   domain: 'vector',
//   operation: 'vectorization',
//   parameters: { tracing: 'high_fidelity' },
//   confidence: 0.94
// }
```

#### LLM Provider Parsing

```typescript
// Mock LLM response parsing
const response = `[
  { "key": "pitch", "value": "modular", "confidence": 0.95 }
]`;

provider.parseConstraints(response, 'geometric');
// Returns: [
//   {
//     id: 'constraint_1234567890_0',
//     type: 'geometric',
//     key: 'pitch',
//     value: 'modular',
//     confidence: 0.95,
//     source: 'llm'
//   }
// ]
```

### Test Assertions Used

```typescript
// Equality
expect(value).toBe(expected);
expect(object).toEqual(expectedObject);

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain(item);

// Types
expect(typeof value).toBe('number');

// Ranges
expect(number).toBeGreaterThan(0);
expect(number).toBeLessThanOrEqual(1);

// Existence
expect(value).toBeDefined();
expect(value).toBeNull();
expect(value).not.toBeNull();

// Shapes
expect(object).toMatchObject({ key: 'value' });

// Arrays with conditions
expect(array.some((item) => item.type === 'geometric')).toBe(true);

// Async/errors
await expect(fn()).rejects.toThrow('Error message');
```

### Mock Strategy

The test suite mocks external LLM APIs:

```typescript
jest.mock('@anthropic-ai/sdk');
jest.mock('openai');
```

This ensures:

- No API keys required
- Tests run offline
- Fast execution
- Deterministic results
- No external API costs

### Coverage Metrics

Expected coverage when running tests:

```
Statements    : 95%+
Branches      : 90%+
Functions     : 100%
Lines         : 95%+
```

### Common Issues & Solutions

#### Issue: "Cannot find module" error

**Solution**: Ensure paths in imports match actual file locations:

```typescript
import { SemanticProcessor } from '../SemanticProcessor';
import { SemanticLLMProvider } from '../../llm/semantic-llm-provider';
```

#### Issue: Tests timeout

**Solution**: Tests are synchronous and should complete quickly. If timeouts occur, check for:

- Unresolved promises
- Missing jest.clearAllMocks() in beforeEach
- Circular imports

#### Issue: Mock not working

**Solution**: Ensure mocks are cleared between tests:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Extending the Tests

#### Add a new constraint type

```typescript
it('should extract new constraint type', () => {
  const script = 'keyword that triggers new type';
  const constraints = SemanticProcessor.parseScript(script);

  expect(constraints).toContainEqual({
    type: 'newType',
    key: 'expectedKey',
    value: 'expectedValue',
    confidence: 0.9,
  });
});
```

#### Add a new creative operation

```typescript
it('should parse new creative operation', () => {
  const command = 'perform operation';
  const intent = SemanticProcessor.parseCreativeIntent(command);

  expect(intent).toEqual({
    domain: 'raster',
    operation: 'new_operation',
    parameters: {
      /* expected */
    },
    confidence: 0.9,
  });
});
```

#### Add provider-specific tests

```typescript
it('should handle Ollama provider', async () => {
  const provider = new SemanticLLMProvider({
    provider: 'ollama',
    baseUrl: 'http://localhost:11434',
  });

  // Test ollama-specific behavior
});
```

### Performance Considerations

- **Test execution time**: < 1 second (all tests)
- **No external API calls**: Tests are fully mocked
- **Memory efficient**: Minimal fixture data
- **Parallel execution**: Tests can run in parallel

### Related Files

- **Source**: `/src/lib/orchestration/SemanticProcessor.ts`
- **Source**: `/src/lib/llm/semantic-llm-provider.ts`
- **Types**: Used across creative studio components
- **Integration**: Used by remix-orchestrator and AdobeAdapter

### Contributing

When adding tests:

1. Follow the existing structure (describe → it blocks)
2. Use clear, descriptive test names
3. Include both happy paths and edge cases
4. Mock external dependencies
5. Keep individual tests focused and small
6. Update TEST_COVERAGE_SUMMARY.md with new tests

### Debug Mode

To see detailed test output:

```bash
npm test -- --verbose SemanticProcessor.test.ts
```

To run a single test:

```bash
npm test -- --testNamePattern="should extract gear geometric constraint" SemanticProcessor.test.ts
```
