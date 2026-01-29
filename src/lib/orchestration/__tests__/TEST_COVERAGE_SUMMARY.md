# SemanticProcessor and SemanticLLMProvider Test Suite

## Overview

Comprehensive unit test suite for semantic constraint extraction and creative intent parsing modules. Tests verify parsing logic, error handling, caching, and integration between components.

## Test File Location

`/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/orchestration/__tests__/SemanticProcessor.test.ts`

## Test Statistics

- **Total Test Cases**: 62+
- **Total Lines**: 829
- **Coverage Areas**: 7 major test suites
- **Mock Dependencies**: Anthropic SDK, OpenAI SDK

## SemanticProcessor.parseScript() Tests

### Geometric Constraint Extraction (3 tests)

- **Test 1**: Extract gear geometric constraint from script containing "gear"
  - Verifies `internal_pitch: 'modular'` with 0.95 confidence

- **Test 2**: Case-insensitive gear extraction
  - Validates lowercase conversion works for "GEAR"

- **Test 3**: No extraction for missing keywords
  - Ensures false positives don't occur

### Material Constraint Extraction (4 tests)

- **Test 1**: Extract material from "durable" keyword
  - Expects `base_polymer: 'PA12-CF'` with 0.88 confidence

- **Test 2**: Extract material from "heat" keyword
  - Validates thermal property extraction

- **Test 3**: Case-insensitive extraction
  - Tests "DURABLE" and "HEAT" uppercase handling

- **Test 4**: No false positives
  - Ensures clean scripts don't trigger material constraints

### Structural Constraint Extraction (4 tests)

- **Test 1**: Extract from "load" keyword
  - Expects `min_infill: '40%'` with 0.82 confidence

- **Test 2**: Extract from "weight" keyword
  - Validates weight distribution parsing

- **Test 3**: Case-insensitive extraction
  - Tests "LOAD" and "WEIGHT" uppercase

- **Test 4**: No false positives
  - Clean input validation

### Multiple Constraint Extraction (2 tests)

- **Test 1**: Comprehensive script with all constraint types
  - Validates that 3+ constraints are extracted from complex script

- **Test 2**: Confidence score validation
  - Ensures all constraints have valid confidence (0 < confidence <= 1)

### Edge Cases (5 tests)

- **Test 1**: Empty string handling
  - Returns empty constraints array

- **Test 2**: Whitespace-only input
  - Proper trimming and empty return

- **Test 3**: Very long scripts (1000+ words)
  - Performance and accuracy under load

- **Test 4**: Special characters
  - Handles `@#$%^&*()` without errors

- **Test 5**: Mixed special characters and keywords
  - Extracts correct constraints despite noise

**Total parseScript Tests: 18**

---

## SemanticProcessor.parseCreativeIntent() Tests

### Raster Operations (Photoshop-style) - 5 tests

- **Background Removal**:
  - "remove background from the image" → `background_removal, SAM-v3, precision: high, confidence: 0.98`

- **Cleanup Intent**:
  - "cleanup the image for me" → same as background removal

- **Lighting Harmonization**:
  - "harmonize the lighting in this photo" → `lighting_harmonization, style: ambient_occlusion, confidence: 0.85`

- **Lighting Adjustment**:
  - "adjust lighting to match the reference" → lighting_harmonization

- **Case Insensitivity**:
  - "REMOVE BACKGROUND FROM THE IMAGE" → correct parsing

### Vector Operations (Illustrator-style) - 6 tests

- **Vectorization**:
  - "vectorize this image to SVG format" → `vectorization, tracing: high_fidelity, confidence: 0.94`

- **SVG Conversion**:
  - "convert to svg with paths" → vectorization

- **Paths Creation**:
  - "create clean paths for this design" → vectorization

- **CNC Standardization**:
  - "standardize for CNC cutting" → `cnc_standardization, tolerance: 0.01, confidence: 0.91`

- **CNC Optimization**:
  - "optimize design for cnc machining" → cnc_standardization

- **Case Insensitivity**:
  - "VECTORIZE THIS USING SVG PATHS" → correct parsing

### Unrecognized Intents - 4 tests

- **Test 1**: Ambiguous command → returns null
- **Test 2**: Empty string → returns null
- **Test 3**: Whitespace only → returns null
- **Test 4**: Gibberish input → returns null

### Edge Cases - 3 tests

- **Test 1**: Very long commands (100+ repeated words)
  - Maintains correct parsing

- **Test 2**: Special characters in command
  - Properly ignores noise, extracts intent

- **Test 3**: Multiple operations in one command
  - Returns first matching operation

**Total parseCreativeIntent Tests: 18**

---

## SemanticProcessor.alignModalities() Tests

3 tests for mesh alignment:

- Valid mesh and forge parameters → returns true
- Null parameter handling → returns true
- Complex mesh data with multiple vertices/faces → returns true

---

## SemanticLLMProvider Tests

### Initialization (3 tests)

- Default config from environment variables
- Custom config override
- Config merging with defaults

### parseConstraints() Method (8 tests)

- **Valid JSON Array**: Parses constraints with full metadata
  - `{ key, value, confidence }` structure
  - Generates unique constraint IDs

- **JSON Extraction**: Extracts JSON from text with surrounding content
  - Handles markdown code blocks
  - Strips natural language explanations

- **Missing Confidence**: Defaults to 0.8 when not provided

- **Fallback Keys**: Uses "name" field if "key" is missing

- **Invalid JSON**: Returns empty array for non-JSON input

- **Malformed JSON**: Gracefully handles syntax errors

- **Empty Arrays**: Handles `[]` correctly

- **Unique IDs**: Generates IDs in format `constraint_[timestamp]_[index]`

### getSystemPrompt() Method (5 tests)

- Geometric domain prompt
- Material domain prompt
- Structural domain prompt
- Creative domain prompt (includes "Adobe")
- Default prompt for unknown domains

### Error Handling (3 tests)

- Throws error when Anthropic not initialized
- Throws error when OpenAI not initialized
- Throws error for unknown provider

### Constraint Domain Mapping (1 test)

- Correctly maps geometric/material/structural/creative domains to constraint types

**Total SemanticLLMProvider Tests: 20**

---

## SemanticArtifact Tests (3 tests)

- Create artifact with all required fields
  - `id, source, tags, constraints, timestamp`

- Support for creative intent in artifact
  - Optional `creativeIntent` field

- Handle empty constraints and tags

---

## Integration Tests (3 tests)

- **Combined Parsing**: Extract script constraints AND parse creative intent simultaneously

- **Artifact Creation**: Create artifact with both constraints and intent

- **Domain Consistency**: Verify all constraint types map correctly across components

---

## Mock Strategy

### Mocked Dependencies

```typescript
jest.mock('@anthropic-ai/sdk');
jest.mock('openai');
```

### Testing Approach

- All external API calls are mocked
- Focus on constraint parsing logic
- Validate response structure without actual API calls
- Error paths tested with thrown errors

---

## Test Execution

### Running Tests

```bash
# Run all tests
npm test -- SemanticProcessor.test.ts

# Run with coverage
npm test -- --coverage SemanticProcessor.test.ts

# Run specific test suite
npm test -- --testNamePattern="parseScript" SemanticProcessor.test.ts

# Watch mode
npm test -- --watch SemanticProcessor.test.ts
```

### Coverage Goals

- **Statements**: 95%+
- **Branches**: 90%+
- **Functions**: 100%
- **Lines**: 95%+

---

## Test Data Examples

### parseScript Examples

```typescript
// Geometric
'Design a custom gear with modular pitch for CNC';
// → { type: 'geometric', key: 'internal_pitch', value: 'modular', confidence: 0.95 }

// Material
'Build a durable part that can withstand stress';
// → { type: 'material', key: 'base_polymer', value: 'PA12-CF', confidence: 0.88 }

// Structural
'Create a bracket to support heavy load';
// → { type: 'structural', key: 'min_infill', value: '40%', confidence: 0.82 }
```

### parseCreativeIntent Examples

```typescript
// Raster: Background Removal
'remove background from the image';
// → { domain: 'raster', operation: 'background_removal',
//     parameters: { method: 'SAM-v3', precision: 'high' }, confidence: 0.98 }

// Vector: Vectorization
'vectorize this image to SVG format';
// → { domain: 'vector', operation: 'vectorization',
//     parameters: { tracing: 'high_fidelity' }, confidence: 0.94 }

// Vector: CNC Standardization
'standardize for CNC cutting';
// → { domain: 'vector', operation: 'cnc_standardization',
//     parameters: { tolerance: 0.01 }, confidence: 0.91 }
```

---

## Assertions and Validations

### Common Assertion Patterns

```typescript
// Exact match
expect(constraints).toEqual([...])

// Array length
expect(constraints).toHaveLength(1)

// Property assertions
expect(constraint.confidence).toBe(0.95)
expect(constraint.key).toBe('internal_pitch')

// Existence checks
expect(constraints.some(c => c.type === 'geometric')).toBe(true)

// Type validation
expect(typeof constraint.confidence).toBe('number')

// Range validation
expect(confidence).toBeGreaterThan(0)
expect(confidence).toBeLessThanOrEqual(1)

// Null/undefined checks
expect(intent).not.toBeNull()
expect(intent).toBeNull()

// Object shape matching
expect(constraint).toMatchObject({ type: 'geometric', key: 'pitch' })

// Error throwing
await expect(fn()).rejects.toThrow('Error message')
```

---

## Notes

1. **Mocking Strategy**: External LLM APIs are mocked to ensure:
   - Tests run without API credentials
   - Consistent, repeatable results
   - Fast test execution
   - No external dependencies

2. **Constraint Confidence**: All constraints must have:
   - Confidence values between 0 (exclusive) and 1 (inclusive)
   - Documented confidence levels in code comments
   - Type-safe confidence handling

3. **Error Handling**: Robust error handling for:
   - Empty/null inputs
   - Invalid JSON responses
   - Missing required fields
   - Unsupported providers

4. **Performance**: Tests include:
   - Large input handling (1000+ words)
   - Special character tolerance
   - Edge case validation

5. **Extensibility**: Tests are structured to easily add:
   - New constraint types
   - New creative operations
   - Additional LLM providers
   - Enhanced domain-specific logic
