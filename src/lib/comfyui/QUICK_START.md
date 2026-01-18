# ComfyUI Templates - Quick Start Guide

## Installation

The templates are already integrated into the project. Just import and use:

```typescript
import { txt2imgBasicTemplate, customizeTemplate, getTemplateById } from '@/lib/comfyui';
```

## 5-Minute Guide

### 1. Basic Text-to-Image

```typescript
import { txt2imgBasicTemplate, customizeTemplate } from '@/lib/comfyui';

const result = customizeTemplate(txt2imgBasicTemplate, {
  prompt: 'a cat wearing sunglasses',
  negative_prompt: 'blurry',
});

if (result.success) {
  console.log('Workflow ready:', result.workflow);
}
```

### 2. Image Enhancement (Image-to-Image)

```typescript
import { img2imgTemplate, customizeTemplate } from '@/lib/comfyui';

const result = customizeTemplate(img2imgTemplate, {
  image_path: '/path/to/image.png',
  prompt: 'enhance details, 4k quality',
  denoise_strength: 0.3,
});

if (result.success) {
  // Use result.workflow
}
```

### 3. Remove/Replace Objects (Inpainting)

```typescript
import { inpaintTemplate, customizeTemplate } from '@/lib/comfyui';

const result = customizeTemplate(inpaintTemplate, {
  image_path: '/path/to/photo.png',
  mask_path: '/path/to/mask.png',
  prompt: 'blue sky',
});
```

### 4. Upscale Image

```typescript
import { upscaleTemplate, customizeTemplate } from '@/lib/comfyui';

const result = customizeTemplate(upscaleTemplate, {
  image_path: '/path/to/image.png',
  scale_factor: 4,
});
```

### 5. Custom Style (LoRA)

```typescript
import { loraGenerationTemplate, customizeTemplate } from '@/lib/comfyui';

const result = customizeTemplate(loraGenerationTemplate, {
  lora_name: 'my_style.safetensors',
  prompt: 'portrait in my style',
  lora_strength: 0.8,
});
```

## Send to ComfyUI Server

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

// Usage
const result = customizeTemplate(txt2imgBasicTemplate, { prompt: 'test' });
if (result.success) {
  const promptId = await executeWorkflow(result.workflow);
  console.log('Executing with ID:', promptId);
}
```

## Common Parameters

### Text-to-Image

- `prompt` (required) - What to generate
- `negative_prompt` - What to avoid
- `width`, `height` - Image dimensions (64-2048)
- `steps` - Quality (1-100, default 20)
- `cfg` - Prompt strength (0.1-30, default 7.5)
- `seed` - For reproducibility (-1 = random)

### Image-to-Image

- `image_path` (required) - Source image
- `denoise_strength` - How much to change (0-1)
- Other parameters same as text-to-image

### Inpainting

- `image_path` (required) - Base image
- `mask_path` (required) - White areas to edit
- `prompt` (required) - What to paint
- Other parameters same as text-to-image

### Upscaling

- `image_path` (required) - Image to upscale
- `scale_factor` - 2x, 4x, 6x, or 8x

### LoRA

- `lora_name` (required) - Model filename
- `lora_strength` - Influence (0-2, default 1.0)
- Other parameters same as text-to-image

## Error Handling

```typescript
const result = customizeTemplate(template, params);

if (!result.success) {
  // Missing required parameters
  if (result.missingParameters?.length) {
    console.error('Missing:', result.missingParameters);
  }

  // Other error
  console.error('Error:', result.error);
}
```

## Template Discovery

```typescript
import { getTemplateById, getTemplatesByCategory, COMFYUI_TEMPLATES } from '@/lib/comfyui';

// Find specific template
const template = getTemplateById('txt2img-basic');

// Find by category
const advanced = getTemplatesByCategory('advanced');

// List all
COMFYUI_TEMPLATES.forEach((t) => console.log(t.name));
```

## Default Parameters

All numeric parameters have sensible defaults:

```
width: 512
height: 512
steps: 20
cfg: 7.5
seed: -1 (random)
denoise_strength: 0.75
scale_factor: 4
lora_strength: 1.0
```

## Tips

1. **Random Results**: Use `seed: -1` for different outputs
2. **Reproducibility**: Use specific seed values
3. **Faster Generation**: Lower `steps` (default 20 is good)
4. **Better Quality**: Increase `cfg` (but can be weird >15)
5. **Preserve Original**: Lower `denoise_strength` for img2img
6. **Detailed Mask**: White areas are edited in inpainting

## Real-World Example

```typescript
async function generatePortrait() {
  // Customize template
  const result = customizeTemplate(loraGenerationTemplate, {
    lora_name: 'portrait_style.safetensors',
    prompt: 'a professional portrait photograph, studio lighting',
    negative_prompt: 'blurry, low quality, cartoon',
    width: 512,
    height: 512,
    steps: 25,
    cfg: 7.5,
    seed: Math.floor(Math.random() * 1000000),
    lora_strength: 0.8,
  });

  if (!result.success) {
    console.error('Failed to customize:', result.error);
    return null;
  }

  // Send to ComfyUI
  const response = await fetch('http://localhost:8188/prompt', {
    method: 'POST',
    body: JSON.stringify(result.workflow),
  });

  const data = await response.json();
  console.log('Generation started:', data.prompt_id);

  return data.prompt_id;
}
```

## Next Steps

- See **README.md** for detailed documentation
- See **examples.ts** for 10 working examples
- See **IMPLEMENTATION_NOTES.md** for architecture
- Check **templates.test.ts** for test patterns

## Troubleshooting

**"Missing required parameters"**

- Check which parameter is required (listed with \*)
- All parameters shown in examples are required or have defaults

**"Unresolved placeholders"**

- Typo in parameter name?
- Check exact spelling against template definition

**Workflow rejected by server**

- Checkpoint path exists?
- Model/LoRA file available on server?
- ComfyUI version compatible?

**Connection refused (http://localhost:8188)**

- Is ComfyUI running?
- Check correct host/port
- Check firewall settings

## Support

- Check examples.ts for working code
- Run tests: `npm test -- templates.test.ts`
- Read IMPLEMENTATION_NOTES.md for details
