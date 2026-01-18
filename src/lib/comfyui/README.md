# ComfyUI Workflow Validation System

A comprehensive, type-safe validation and sanitization system for ComfyUI workflows.

## Files

- **validator.ts**: Main validation and sanitization implementation
- **types.ts**: TypeScript type definitions for ComfyUI workflows
- **validator.test.ts**: Comprehensive test suite

## Quick Start

```typescript
import { validateWorkflow, sanitizeWorkflow } from '@/lib/comfyui/validator';

// Validate a workflow
const result = validateWorkflow(workflow);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
  console.warn('Warnings:', result.warnings);
}

// Sanitize a workflow (remove dangerous content)
const sanitized = sanitizeWorkflow(workflow);

// Validate and sanitize in one step
const { valid, sanitized: cleanWorkflow } = validateAndSanitizeWorkflow(workflow);
```

## Validation Features

### 1. Structure Validation

Ensures the workflow is a valid object with proper node structure:

- Workflow must be an object (not null, array, or primitive)
- Each node has required `class_type` and `inputs` fields
- Inputs are objects with key-value pairs

### 2. Node ID Validation

- All node IDs must be strings
- Node IDs must be unique
- Node IDs cannot be empty

### 3. Connection Validation

Validates node-to-node connections:

- Connection format: `[nodeId, slotIndex]`
- Referenced node IDs must exist in the workflow
- Slot indices must be non-negative integers
- Rejects references to non-existent nodes with clear error messages

### 4. Circular Dependency Detection

Uses depth-first search (DFS) to detect cycles in the workflow graph:

- Detects simple 2-node cycles (A → B → A)
- Detects complex cycles (A → B → C → A)
- Detects self-loops (A → A)
- Returns array of node IDs involved in cycles

```typescript
const cycles = detectCycles(workflow);
// Returns: ["Circular dependency detected: 1 → 2 → 3 → 1"]
```

### 5. Node Type Validation

Validates node-type-specific requirements:

- **KSampler**: Requires model, positive, negative, latent_image, seed, steps, cfg
- **CLIPTextEncode**: Requires clip and text
- **LoadImage**: Requires image
- **LoadCheckpoint**: Requires ckpt_name
- **SaveImage**: Requires images
- **VAEDecode**: Requires samples and vae
- **VAEEncode**: Requires pixels and vae

Custom node types are allowed (no error, just skipped validation).

## Sanitization Features

### 1. XSS Protection

Removes dangerous patterns from string values:

- Script tags: `<script>...</script>`
- Event handlers: `onclick=`, `onload=`, etc.
- JavaScript protocol: `javascript:`
- Dynamic evaluation: `eval(`, `import`, `require`

```typescript
// Input
{
  text: '<script>alert("xss")</script>text';
}

// Output
{
  text: '';
}
```

### 2. Numeric Clamping

Constrains numeric values to safe ranges:

- Min: -1e8
- Max: 1e8
- Converts Infinity/NaN to 0

```typescript
// Input
{ steps: 1e10, cfg: -1e9 }

// Output
{ steps: 1e8, cfg: -1e8 }
```

### 3. String Length Limits

- Max string length: 10,000 characters
- Max object keys: 1,000
- Max array length: 1,000

### 4. Path Validation

(Future enhancement) Validates file paths are in allowed directories:

- models/
- input/
- output/
- temp/
- checkpoints/
- loras/
- vae/
- embeddings/

Rejects:

- Absolute paths
- Parent directory traversal (..)

### 5. Connection Preservation

Preserves valid connection tuples `[nodeId, slotIndex]` during sanitization.

## Error Messages

Clear, actionable error messages help identify issues:

```typescript
{
  valid: false,
  errors: [
    "Node '5': Missing required field 'inputs'",
    "Node '3': Invalid connection [\"99\", 0] - node 99 does not exist",
    "Circular dependency detected: 1 → 2 → 3 → 1",
    "Node '4' (KSampler): Missing required parameter 'steps'"
  ],
  warnings: [
    "Node '4': Recommended parameter 'steps' not provided (using default)"
  ]
}
```

## Validation Flow

```
Input Workflow
    ↓
Structure Validation (is it an object?)
    ↓
Node Structure (all nodes have class_type and inputs?)
    ↓
Node IDs (unique strings?)
    ↓
Connections (all referenced nodes exist?)
    ↓
Circular Dependencies (any cycles?)
    ↓
Node Schemas (type-specific requirements?)
    ↓
Result: Valid ✓ or Errors ✗
```

## Type Safety

All functions are fully typed with TypeScript:

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

interface ComfyUINode {
  class_type: string;
  inputs: Record<string, unknown>;
  pos?: [number, number];
  size?: [number, number];
  title?: string;
  [key: string]: unknown;
}

type ComfyUIWorkflow = Record<string, ComfyUINode>;
```

## Performance

- Validation: O(V + E) where V = nodes, E = connections
- Cycle detection: O(V + E) using DFS
- Sanitization: O(n) where n = total data size
- All operations are synchronous and fast

## Testing

Comprehensive test suite covers:

- All validation rules
- All error conditions
- Cycle detection (simple, complex, self-loops)
- Sanitization of dangerous content
- Edge cases and boundary conditions
- Complex real-world workflows

Run tests with:

```bash
npm test validator.test.ts
```

## Integration Examples

### API Route

```typescript
import { validateAndSanitizeWorkflow } from '@/lib/comfyui/validator';

export async function POST(req: Request) {
  const workflow = await req.json();

  const { valid, sanitized, validation } = validateAndSanitizeWorkflow(workflow);

  if (!valid) {
    return Response.json(
      {
        error: 'Invalid workflow',
        details: validation.errors,
      },
      { status: 400 },
    );
  }

  // Use sanitized workflow
  return executeWorkflow(sanitized);
}
```

### Component

```typescript
'use client';

import { validateWorkflow } from '@/lib/comfyui/validator';

export function WorkflowEditor({ workflow }) {
  const validation = validateWorkflow(workflow);

  return (
    <>
      {validation.errors.length > 0 && (
        <ErrorPanel errors={validation.errors} />
      )}
      {validation.warnings && (
        <WarningPanel warnings={validation.warnings} />
      )}
      <WorkflowPreview workflow={workflow} />
    </>
  );
}
```

### Hook

```typescript
function useValidateWorkflow(workflow: unknown) {
  const [result, setResult] = React.useState<ValidationResult>({
    valid: true,
    errors: [],
  });

  React.useEffect(() => {
    setResult(validateWorkflow(workflow));
  }, [workflow]);

  return result;
}
```

## Future Enhancements

- [ ] Custom node schema registration
- [ ] Workflow optimization (remove unused nodes)
- [ ] Performance profiling
- [ ] GPU memory estimation
- [ ] Node output type inference
- [ ] Workflow serialization/deserialization
- [ ] Workflow visualization helpers
- [ ] Performance hints and warnings

## Security Considerations

1. **Always validate before execution** - Never execute workflows without validation
2. **Sanitize user input** - Use sanitizeWorkflow on user-provided workflows
3. **Connection validation** - Only allow connections to existing nodes
4. **File path restrictions** - Don't load files from arbitrary paths
5. **Resource limits** - Monitor memory/disk usage during execution

## References

- [ComfyUI GitHub](https://github.com/comfyanonymous/ComfyUI)
- [ComfyUI Custom Nodes](https://github.com/comfyanonymous/ComfyUI_examples)
