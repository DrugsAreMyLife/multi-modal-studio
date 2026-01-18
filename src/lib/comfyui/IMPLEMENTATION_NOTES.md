# ComfyUI Templates Implementation Notes

## Overview

This module provides production-ready workflow templates for ComfyUI, a powerful node-based UI for image generation with Stable Diffusion and other models. The templates are fully type-safe, validated, and ready for immediate use with ComfyUI servers.

## Architecture

### File Structure

```
src/lib/comfyui/
├── types.ts                 # Type definitions for ComfyUI workflows
├── templates.ts             # Pre-built workflow templates (5 templates)
├── templates.test.ts        # Comprehensive test suite
├── examples.ts              # Usage examples
├── index.ts                 # Module exports
├── README.md               # User-facing documentation
├── IMPLEMENTATION_NOTES.md # This file
```

### Key Components

#### 1. **types.ts** (557 lines)

Comprehensive type definitions including:

- `ComfyUINode`: Individual workflow node
- `ComfyUIWorkflow`: Complete workflow (Record<nodeId, ComfyUINode>)
- `WorkflowTemplate`: Template with parameters and metadata
- `TemplateParameter`: Parameter definition with validation
- `TemplateCustomizationResult`: Result of template application
- Type guards for validation

#### 2. **templates.ts** (849 lines)

Five production-ready templates:

**txt2imgBasicTemplate**

- 7 nodes: CheckpointLoader, CLIPTextEncode (x2), EmptyLatentImage, KSampler, VAEDecode, SaveImage
- 7 parameters: prompt, negative_prompt, width, height, steps, cfg, seed
- Category: general
- Ideal for: Basic text-to-image generation

**img2imgTemplate**

- 8 nodes: LoadImage, CheckpointLoader, CLIPTextEncode (x2), VAEEncode, KSampler, VAEDecode, SaveImage
- 7 parameters: image_path, prompt, negative_prompt, denoise_strength, steps, cfg, seed
- Category: advanced
- Ideal for: Image transformation and style transfer

**inpaintTemplate**

- 9 nodes: LoadImage, LoadImageMask, CheckpointLoader, CLIPTextEncode (x2), VAEEncode, KSampler, VAEDecode, SaveImage
- 7 parameters: image_path, mask_path, prompt, negative_prompt, steps, cfg, seed
- Category: advanced
- Ideal for: Region-based image editing

**upscaleTemplate**

- 4 nodes: LoadImage, UpscaleModelLoader, ImageUpscaleWithModel, SaveImage
- 3 parameters: image_path, upscale_model, scale_factor
- Category: image
- Ideal for: 2x-8x image upscaling

**loraGenerationTemplate**

- 8 nodes: CheckpointLoader, LoraLoader, CLIPTextEncode (x2), EmptyLatentImage, KSampler, VAEDecode, SaveImage
- 10 parameters: checkpoint, lora_name, lora_strength, prompt, negative_prompt, width, height, steps, cfg, seed
- Category: custom
- Ideal for: Style-controlled generation with LoRA models

#### 3. **Helper Functions**

**customizeTemplate(template, parameters)**

- Validates required parameters
- Replaces `{{parameter_name}}` placeholders
- Returns detailed error messages
- Preserves node connections
- Converts numeric values to strings in JSON

**getTemplateById(templateId)**

- Fast lookup by template ID
- Returns undefined if not found

**getTemplatesByCategory(category)**

- Filter templates by category
- Returns array of matching templates

#### 4. **Test Suite** (389 lines)

Comprehensive tests covering:

- Template metadata validation
- Node structure verification
- Parameter definitions
- Template customization
- Error handling
- Placeholder replacement
- Node connection preservation
- Numeric parameter conversion
- Utility function behavior

### Workflow Node Structure

Each template uses proper ComfyUI workflow format:

```typescript
{
  "1": {
    inputs: {
      ckpt_name: "sd_xl_base_1.0.safetensors",
    },
    class_type: "CheckpointLoaderSimple",
    _meta: {
      title: "Load Checkpoint",
    }
  },
  "2": {
    inputs: {
      text: "{{prompt}}",
      clip: ["1", 1],  // Connection to node 1, output slot 1
    },
    class_type: "CLIPTextEncode",
    _meta: {
      title: "CLIP Encode (Positive)",
    }
  }
}
```

**Key Features:**

- String node IDs (numeric strings: "1", "2", "3", etc.)
- Node connections: `["nodeId", outputSlot]` format
- Placeholder syntax: `{{parameter_name}}`
- Metadata for UI (titles, positioning)
- Type-safe inputs

### Parameter System

Each parameter has:

```typescript
{
  name: string;              // Used in {{name}} placeholders
  description: string;       // User-facing description
  type: 'string' | 'number' | 'boolean' | 'select' | 'array';
  required?: boolean;        // Must be provided by user
  default?: unknown;         // Used if not provided
  min?: number;              // For numeric types
  max?: number;              // For numeric types
  options?: string[];        // For select types
}
```

## Implementation Details

### Placeholder Replacement Strategy

The `customizeTemplate` function uses JSON string manipulation:

1. Deep copy the template workflow
2. Convert to JSON string
3. Replace all `{{parameter_name}}` with string values
4. Parse back to object
5. Validate all placeholders were replaced

This approach ensures:

- Node connections remain intact
- Numeric values are properly converted
- Complex nested structures work correctly
- Performance is good even for large workflows

### Error Handling

Three types of errors are detected:

1. **Missing required parameters**: Caught before JSON processing
2. **Unresolved placeholders**: Caught after JSON parse
3. **JSON parse errors**: Caught and reported with detail

All errors return `TemplateCustomizationResult` with:

- `success: false`
- `error: string` - Human-readable message
- `missingParameters?: string[]` - Specific missing params

### Type Safety

The module uses strict TypeScript:

- No `any` types
- Discriminated unions for results
- Type guards for validation
- Proper generic constraints
- Exhaustive type checking

## Usage Patterns

### Basic Usage

```typescript
import { txt2imgBasicTemplate, customizeTemplate } from '@/lib/comfyui';

const result = customizeTemplate(txt2imgBasicTemplate, {
  prompt: 'a cat',
  width: 512,
  height: 512,
});

if (result.success) {
  await sendToComfyUI(result.workflow);
}
```

### Discovery Pattern

```typescript
import { getTemplatesByCategory, getTemplateById } from '@/lib/comfyui';

// Find by ID
const template = getTemplateById('txt2img-basic');

// Find by category
const advancedTemplates = getTemplatesByCategory('advanced');

// List all
import { COMFYUI_TEMPLATES } from '@/lib/comfyui';
COMFYUI_TEMPLATES.forEach((t) => console.log(t.name));
```

### Error Handling Pattern

```typescript
const result = customizeTemplate(template, params);

if (!result.success) {
  if (result.missingParameters) {
    console.error('Missing:', result.missingParameters);
  } else {
    console.error('Error:', result.error);
  }
}
```

## Integration with ComfyUI Server

### Sending Workflows

```typescript
async function executeWorkflow(workflow: ComfyUIWorkflow) {
  const response = await fetch('http://localhost:8188/prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow),
  });

  const { prompt_id } = await response.json();
  return prompt_id;
}
```

### Monitoring Progress

```typescript
const ws = new WebSocket('ws://localhost:8188/ws');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'progress') {
    console.log(`Progress: ${message.data.value}/${message.data.max}`);
  }

  if (message.type === 'execution_complete') {
    console.log('Generation complete!');
  }
};
```

## Performance Characteristics

### Customization Performance

- Template lookup: O(1) - object property access
- Parameter validation: O(n) - linear in parameter count
- JSON parsing: O(n) - linear in workflow size
- Typical customization: <5ms for standard templates

### Memory Usage

- Single template: ~2-5 KB
- Entire module: <50 KB uncompressed
- Workflow JSON: 1-2 KB per customized workflow

### Bundle Impact

- Minified templates: ~8 KB
- With types: ~15 KB
- Tree-shakeable exports

## Testing Strategy

The test suite covers:

1. **Metadata Validation**
   - All templates have correct ID, name, category
   - Parameter counts match documentation

2. **Structure Validation**
   - All required nodes present
   - Correct node types
   - Valid connections

3. **Customization Logic**
   - Placeholder replacement works
   - Missing parameters detected
   - Default values applied
   - Node connections preserved

4. **Error Scenarios**
   - Missing required parameters
   - Invalid JSON after replacement
   - Unresolved placeholders

5. **Utility Functions**
   - Template lookup by ID
   - Category filtering
   - COMFYUI_TEMPLATES array

### Running Tests

```bash
# All tests
npm test -- templates.test.ts

# Specific suite
npm test -- templates.test.ts -t "customizeTemplate"

# Watch mode
npm test -- templates.test.ts --watch
```

## Future Enhancements

Potential additions:

1. More specialized templates (depth2img, controlnet, etc.)
2. Parameter validation rules (regex patterns, ranges)
3. Template composition (combining templates)
4. Workflow graph visualization
5. Performance profiling per template
6. Version compatibility checks
7. Model requirement validation
8. Output format configuration

## Maintenance Guidelines

### Adding New Templates

1. Create template object with:
   - Unique ID
   - Name and description
   - All required parameters defined
   - Valid workflow nodes

2. Export from templates.ts

3. Add to COMFYUI_TEMPLATES array

4. Write tests covering:
   - Metadata validation
   - Customization with all parameters
   - Customization with defaults
   - Error cases

### Updating Existing Templates

- Preserve template IDs (used in references)
- Add new parameters as optional
- Update parameter descriptions
- Add test cases for changes
- Update documentation

### Validating Changes

```bash
# Type check
npx tsc --noEmit src/lib/comfyui/*.ts

# Run tests
npm test -- templates.test.ts

# Format
npm run format -- src/lib/comfyui/
```

## Known Limitations

1. **No Real-time Validation**: Parameters are only validated on customization
2. **No Model Checking**: Doesn't verify if referenced models exist on server
3. **String-Based Replacement**: Uses JSON string manipulation (fast but not AST-based)
4. **Fixed Node IDs**: Uses preset string IDs (can be changed by caller if needed)

## Performance Tips

1. **Reuse Templates**: Don't re-import templates repeatedly
2. **Cache Customized Workflows**: Store results if using same parameters multiple times
3. **Batch Operations**: Customize multiple workflows in parallel
4. **Stream Results**: Don't wait for all customizations before sending first workflow

## Troubleshooting

### Issue: "Missing required parameters"

- Check `result.missingParameters` array
- Ensure all required parameters are provided
- See parameter definitions in template

### Issue: "Unresolved placeholders"

- Parameter name doesn't match placeholder
- Check spelling in both template and parameters object
- Ensure all placeholders are in required or provided parameters

### Issue: "Failed to customize template"

- Check parameters for circular references
- Verify parameter values are JSON-serializable
- Check ComfyUI types compatibility

## References

- ComfyUI: https://github.com/comfyanonymous/ComfyUI
- Stable Diffusion: https://github.com/CompVis/stable-diffusion
- Node Documentation: See ComfyUI node_class_mappings

## License

Part of Multi-Modal Generation Studio
