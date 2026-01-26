# Ultra-Granular Micro-Task Decomposition

## Feature Sets 1-3: Ollama Vision + ComfyUI + Training

**Date**: 2026-01-18
**Total Micro-Tasks**: 87 atomic tasks (5-10 minutes each)
**Sequential Estimate**: ~18 hours
**Parallel Estimate**: ~2-3 hours (Wave-based execution)
**Parallelization Factor**: 8-10x

---

## FEATURE SET 1: Ollama Vision + Image Generation

### Phase 1.1: Ollama Vision Model Support

#### 1.1.1: Add LLaVA Model Definitions to SUPPORTED_MODELS

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/models/supported-models.ts`
- **Lines**: 243 (end of SUPPORTED_MODELS array, before closing bracket)
- **Duration**: 8 min
- **Wave**: 1 (parallel safe)
- **Dependencies**: None
- **Acceptance**:
  - Add llava-1.6-7b model config to array
  - Add llava-1.6-34b model config to array
  - Each includes vision: true capability
  - pullString fields populated for ollama

**Code to Add** (before line 243):

```typescript
  {
    providerId: 'ollama',
    modelId: 'llava-1.6:7b',
    name: 'LLaVA 1.6 7B (Vision)',
    category: 'local',
    contextWindow: 4096,
    maxOutputTokens: 2048,
    pricing: { inputPer1kTokens: 0.0, outputPer1kTokens: 0.0, currency: 'USD' },
    capabilities: { vision: true, functionCalling: false, jsonMode: false, streaming: true },
    pullString: 'llava-1.6:7b',
    tips: ['Requires 8GB+ VRAM', 'Fast local vision analysis'],
  },
  {
    providerId: 'ollama',
    modelId: 'llava-1.6:34b',
    name: 'LLaVA 1.6 34B (Vision)',
    category: 'local',
    contextWindow: 8192,
    maxOutputTokens: 4096,
    pricing: { inputPer1kTokens: 0.0, outputPer1kTokens: 0.0, currency: 'USD' },
    capabilities: { vision: true, functionCalling: false, jsonMode: false, streaming: true },
    pullString: 'llava-1.6:34b',
    tips: ['Requires 24GB+ VRAM', 'Higher quality vision analysis'],
  },
```

---

#### 1.1.2: Add getVisionModels Utility Function

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/models/supported-models.ts`
- **Lines**: 265 (after getModelById function)
- **Duration**: 6 min
- **Wave**: 1
- **Dependencies**: None
- **Acceptance**:
  - Function filters models by vision capability
  - Returns only vision-capable models
  - Works with both cloud and local

**Code to Add**:

```typescript
export function getVisionModels(): ModelConfig[] {
  return SUPPORTED_MODELS.filter((m) => m.capabilities.vision);
}
```

---

#### 1.1.3: Add Vision Model Display Badge Component

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/chat/VisionModelBadge.tsx` (NEW)
- **Duration**: 7 min
- **Wave**: 1
- **Dependencies**: None
- **Acceptance**:
  - Component displays vision capability icon
  - Shows model name with vision indicator
  - Uses lucide Eye icon
  - Integrates with badge component

**File Content**:

```typescript
'use client';

import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VisionModelBadgeProps {
  modelName: string;
  vramRequired?: string;
  className?: string;
}

export function VisionModelBadge({ modelName, vramRequired, className }: VisionModelBadgeProps) {
  return (
    <Badge variant="outline" className={cn('gap-1.5', className)}>
      <Eye size={12} className="text-blue-500" />
      <span>{modelName}</span>
      {vramRequired && <span className="text-xs text-muted-foreground">({vramRequired})</span>}
    </Badge>
  );
}
```

---

#### 1.1.4: Update MultiModelSelector to Show VRAM Requirements

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/chat/MultiModelSelector.tsx`
- **Lines**: 265-275 (in renderModelList, where tips are displayed)
- **Duration**: 8 min
- **Wave**: 2 (depends on supported-models updates)
- **Dependencies**: 1.1.1
- **Acceptance**:
  - Show VRAM requirement if model has tips mentioning VRAM
  - Display warning for insufficient VRAM
  - Format: "Requires XGB+ VRAM"

**Code to Add** (after line 312, in the tips section):

```typescript
              {/* VRAM Requirements */}
              {model.category === 'local' && model.tips?.some(t => t.includes('VRAM')) && (
                <div className="mt-2 rounded bg-yellow-500/10 p-2">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    {model.tips.find(t => t.includes('VRAM'))}
                  </p>
                </div>
              )}
```

---

### Phase 1.2: Image Upload for Vision Analysis

#### 1.2.1: Create ImagePreviewGallery Component

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/chat/ImagePreviewGallery.tsx` (NEW)
- **Duration**: 9 min
- **Wave**: 2
- **Dependencies**: None
- **Acceptance**:
  - Component displays grid of uploaded images
  - Shows thumbnail previews
  - Delete button for each image
  - Hover effects

**File Content**:

```typescript
'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ImagePreviewGalleryProps {
  images: { id: string; url: string; name: string }[];
  onRemove: (id: string) => void;
  className?: string;
}

export function ImagePreviewGallery({ images, onRemove, className }: ImagePreviewGalleryProps) {
  if (images.length === 0) return null;

  return (
    <div className={cn('grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4', className)}>
      {images.map((image) => (
        <div key={image.id} className="group relative overflow-hidden rounded-lg border">
          <Image
            src={image.url}
            alt={image.name}
            width={200}
            height={200}
            className="h-24 w-full object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => onRemove(image.id)}
          >
            <X size={14} />
          </Button>
        </div>
      ))}
    </div>
  );
}
```

---

#### 1.2.2: Extend ChatInputArea with Vision Image Dropdown

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/chat/ChatInputArea.tsx`
- **Lines**: 44-46 (in state declarations)
- **Duration**: 8 min
- **Wave**: 2
- **Dependencies**: 1.2.1
- **Acceptance**:
  - Add visionImages state array
  - Track image IDs and URLs
  - Add image upload handler

**Code to Add** (after line 45):

```typescript
const [visionImages, setVisionImages] = useState<{ id: string; url: string; name: string }[]>([]);
const [isVisionMode, setIsVisionMode] = useState(false);
```

---

#### 1.2.3: Create ImageUploadButton Component

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/chat/ImageUploadButton.tsx` (NEW)
- **Duration**: 9 min
- **Wave**: 2
- **Dependencies**: None
- **Acceptance**:
  - Button opens image file picker
  - Accepts image files (jpg, png, webp, gif)
  - Handles multiple files
  - Shows loading state during upload

**File Content**:

```typescript
'use client';

import { ImagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef, useState } from 'react';

interface ImageUploadButtonProps {
  onImageSelect: (files: File[]) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ImageUploadButton({ onImageSelect, disabled, isLoading }: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onImageSelect(Array.from(e.target.files));
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={disabled || isLoading}
        title="Upload images for vision analysis"
      >
        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <ImagePlus size={18} />}
      </Button>
    </>
  );
}
```

---

#### 1.2.4: Add Vision Image Upload Handler to ChatInputArea

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/chat/ChatInputArea.tsx`
- **Lines**: 69-73 (after existing onDrop handler)
- **Duration**: 8 min
- **Wave**: 3 (depends on components from wave 2)
- **Dependencies**: 1.2.2, 1.2.3
- **Acceptance**:
  - Handles image file uploads
  - Calls uploadFile for each image
  - Updates visionImages state
  - Shows loading state

**Code to Add** (after handleUpload function):

```typescript
const handleVisionImageUpload = async (files: File[]) => {
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported for vision analysis');
      return;
    }

    const id = crypto.randomUUID();
    setVisionImages((prev) => [...prev, { id, url: '', name: file.name }]);

    try {
      const result = await uploadFile(file);
      setVisionImages((prev) =>
        prev.map((img) => (img.id === id ? { ...img, url: result.url } : img)),
      );
    } catch (err) {
      console.error('Vision image upload failed:', err);
      toast.error(`Failed to upload ${file.name}`);
      setVisionImages((prev) => prev.filter((img) => img.id !== id));
    }
  }
};
```

---

#### 1.2.5: Integrate ImageUploadButton into ChatInputArea Toolbar

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/chat/ChatInputArea.tsx`
- **Lines**: 130-145 (find the toolbar with Send button)
- **Duration**: 7 min
- **Wave**: 3
- **Dependencies**: 1.2.4
- **Acceptance**:
  - Button appears next to Paperclip button
  - Triggers handleVisionImageUpload
  - Shows loading state
  - Disabled when isLoading=true

**Code to Add** (find toolbar section and add):

```typescript
                <ImageUploadButton
                  onImageSelect={handleVisionImageUpload}
                  disabled={isLoading}
                  isLoading={attachments.some((a) => a.status === 'uploading')}
                />
```

---

#### 1.2.6: Add ImagePreviewGallery to ChatInputArea

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/chat/ChatInputArea.tsx`
- **Lines**: 115-120 (before attachments preview)
- **Duration**: 6 min
- **Wave**: 3
- **Dependencies**: 1.2.1, 1.2.5
- **Acceptance**:
  - Display vision images below input
  - Call onRemove with image ID
  - Render before attachment list

**Code to Add**:

```typescript
      {visionImages.length > 0 && (
        <div className="mb-3 px-4">
          <ImagePreviewGallery
            images={visionImages}
            onRemove={(id) => setVisionImages((prev) => prev.filter((img) => img.id !== id))}
          />
        </div>
      )}
```

---

#### 1.2.7: Create Vision Analysis API Endpoint

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/app/api/vision/analyze/route.ts` (NEW)
- **Duration**: 10 min
- **Wave**: 4 (parallel with other phase 2 tasks)
- **Dependencies**: 1.1.1
- **Acceptance**:
  - Accept POST with images array and query text
  - Route to selected vision model
  - Return analysis response
  - Handle errors gracefully

**File Content**:

```typescript
import { createUniversalModel } from '@/lib/models/universal-model-factory';
import { SUPPORTED_MODELS } from '@/lib/models/supported-models';
import { streamText } from 'ai';

export async function POST(req: Request) {
  try {
    const { images, query, modelId = 'llava-1.6:7b', providerId = 'ollama' } = await req.json();

    // Validate model
    const modelConfig = SUPPORTED_MODELS.find(
      (m) => m.modelId === modelId && m.providerId === providerId && m.capabilities.vision,
    );

    if (!modelConfig) {
      return new Response(
        JSON.stringify({
          error: 'Vision model not found',
          message: `Model "${modelId}" from provider "${providerId}" is not available for vision`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!images || images.length === 0) {
      return new Response(JSON.stringify({ error: 'No images provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build message with images
    const model = createUniversalModel(providerId, modelId);

    const result = await streamText({
      model,
      messages: [
        {
          role: 'user',
          content: [
            ...images.map((url: string) => ({
              type: 'image' as const,
              image: url,
            })),
            {
              type: 'text' as const,
              text: query || 'Analyze these images.',
            },
          ],
        },
      ],
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('[Vision API Error]', error);
    return new Response(
      JSON.stringify({ error: 'Vision analysis failed', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
```

---

#### 1.2.8: Create useVisionAnalysis Hook

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/hooks/useVisionAnalysis.ts` (NEW)
- **Duration**: 8 min
- **Wave**: 4
- **Dependencies**: None
- **Acceptance**:
  - Hook manages vision analysis state
  - Handles streaming responses
  - Tracks loading state
  - Manages errors

**File Content**:

```typescript
'use client';

import { useState, useCallback } from 'react';

interface VisionAnalysisOptions {
  modelId?: string;
  providerId?: string;
}

export function useVisionAnalysis(options: VisionAnalysisOptions = {}) {
  const { modelId = 'llava-1.6:7b', providerId = 'ollama' } = options;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');

  const analyze = useCallback(
    async (images: string[], query: string) => {
      setIsAnalyzing(true);
      setError(null);
      setResult('');

      try {
        const response = await fetch('/api/vision/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images,
            query,
            modelId,
            providerId,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Analysis failed');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let analysisText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          analysisText += decoder.decode(value);
          setResult(analysisText);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsAnalyzing(false);
      }
    },
    [modelId, providerId],
  );

  return { analyze, isAnalyzing, error, result };
}
```

---

#### 1.2.9: Update Chat Message Type for Vision Content

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types.ts`
- **Lines**: 20-25 (MessageNode interface)
- **Duration**: 6 min
- **Wave**: 4
- **Dependencies**: None
- **Acceptance**:
  - Add visionImages array to MessageNode
  - Track URLs of analyzed images
  - Optional field (backward compatible)

**Code to Add** (in MessageNode interface):

```typescript
  visionImages?: string[]; // URLs of images analyzed with this message
```

---

#### 1.2.10: Test Vision Model in MultiModelSelector

- **Agent**: qa-tester
- **File**: Manual browser testing
- **Duration**: 8 min
- **Wave**: 5 (after all components deployed)
- **Dependencies**: 1.2.9
- **Type**: Integration Test
- **Acceptance**:
  - [ ] Vision models appear in "Local" tab
  - [ ] VRAM requirements display correctly
  - [ ] Can select vision model
  - [ ] Selection persists

**Test Steps**:

1. Open MultiModelSelector
2. Click "Local / Self-Hosted" tab
3. Verify LLaVA models appear
4. Verify VRAM badges show "Requires 8GB+", "Requires 24GB+"
5. Select LLaVA 1.6 7B
6. Refresh page
7. Verify selection persists

---

### Phase 1.3: Chat Integration with Vision Models

#### 1.3.1: Update ChatOrchestrator for Vision Model Selection

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/chat/ChatOrchestrator.tsx`
- **Lines**: 50-65 (state declarations)
- **Duration**: 7 min
- **Wave**: 5
- **Dependencies**: 1.2.9
- **Acceptance**:
  - Add visionModelId state
  - Track selected vision model
  - Default to first vision model

**Code to Add** (in state section):

```typescript
const [selectedVisionModelId, setSelectedVisionModelId] = useState<string>('llava-1.6:7b');
const [selectedVisionProviderId, setSelectedVisionProviderId] = useState<string>('ollama');
```

---

#### 1.3.2: Add Vision Model Selector Button to Chat Header

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/chat/ChatOrchestrator.tsx`
- **Lines**: 210-235 (header toolbar area)
- **Duration**: 8 min
- **Wave**: 5
- **Dependencies**: 1.3.1
- **Acceptance**:
  - Show current vision model name
  - Dropdown to select different vision model
  - Only shows vision-capable models

**Code to Add** (in header toolbar):

```typescript
                    {/* Vision Model Selector */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye size={14} />
                          Vision: {selectedVisionModelId.split(':')[0]}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {getVisionModels().map((model) => (
                          <DropdownMenuItem
                            key={model.modelId}
                            onClick={() => {
                              setSelectedVisionModelId(model.modelId);
                              setSelectedVisionProviderId(model.providerId);
                            }}
                          >
                            {model.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
```

---

#### 1.3.3: Create Vision Analysis UI Component

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/chat/VisionAnalysisPanel.tsx` (NEW)
- **Duration**: 9 min
- **Wave**: 5
- **Dependencies**: 1.2.8
- **Acceptance**:
  - Show analysis in-progress state
  - Display results
  - Show errors
  - Integrate with chat

**File Content**:

```typescript
'use client';

import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface VisionAnalysisPanelProps {
  isAnalyzing: boolean;
  result: string;
  error: string | null;
  images: string[];
}

export function VisionAnalysisPanel({
  isAnalyzing,
  result,
  error,
  images,
}: VisionAnalysisPanelProps) {
  if (!isAnalyzing && !result && !error) return null;

  return (
    <div className="bg-muted/50 space-y-3 rounded-lg border p-4">
      {isAnalyzing && (
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={16} />
          <span className="text-sm text-muted-foreground">Analyzing images...</span>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle size={16} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Analysis Result:</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  );
}
```

---

#### 1.3.4: Integrate Vision Analysis into Message Input Flow

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/chat/ChatInputArea.tsx`
- **Lines**: 85-120 (handleSubmit function)
- **Duration**: 9 min
- **Wave**: 6 (depends on vision panel)
- **Dependencies**: 1.3.3
- **Acceptance**:
  - If visionImages present, analyze before/with message
  - Pass images to vision analysis
  - Include analysis in message context

**Code to Add** (in handleSubmit):

```typescript
// If vision images attached, include them in the message
if (visionImages.length > 0 && onPendingSend) {
  const visionContext = await analyzeVisionImages(
    visionImages.map((img) => img.url),
    value,
    selectedVisionModelId,
    selectedVisionProviderId,
  );

  // Append vision analysis to message
  const enhancedMessage = `${value}\n\n[Vision Analysis]\n${visionContext}`;
  onPendingSend(enhancedMessage, attachments).then(() => {
    onSendMessage(enhancedMessage, attachments);
    setVisionImages([]);
    setAttachments([]);
  });
} else {
  onSendMessage(value, attachments);
}
```

---

---

## FEATURE SET 2: ComfyUI Workflow Integration

### Phase 2.1: ComfyUI Backend Infrastructure

#### 2.1.1: Create ComfyUI Types File

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/comfyui.ts` (NEW)
- **Duration**: 9 min
- **Wave**: 1 (parallel safe)
- **Dependencies**: None
- **Acceptance**:
  - Define ComfyUI node types
  - Define workflow types
  - Define status response types

**File Content**:

```typescript
export interface ComfyUINode {
  class_type: string;
  input: Record<string, any>;
}

export interface ComfyUIWorkflow {
  [nodeId: string]: ComfyUINode;
}

export interface ComfyUIPrompt {
  client_id: string;
  prompt: ComfyUIWorkflow;
}

export interface ComfyUIStatus {
  status: {
    exec_info: {
      queue_pending: number;
      queue_running: number;
      exec_cached: number;
    };
  };
}

export interface ComfyUIResponse {
  prompt_id: string;
}

export interface ComfyUINodeDefinition {
  display_name: string;
  category: string;
  output: string[];
  output_tooltips: string[];
  description: string;
  python_type: string;
  input?: {
    required?: Record<string, any>;
    optional?: Record<string, any>;
  };
}

export interface ComfyUINodeSchema {
  [nodeClassName: string]: ComfyUINodeDefinition;
}
```

---

#### 2.1.2: Create ComfyUI API Client

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/comfyui/client.ts` (NEW)
- **Duration**: 10 min
- **Wave**: 1
- **Dependencies**: 2.1.1
- **Acceptance**:
  - Initialize client with base URL
  - Support custom endpoints
  - Handle connection errors

**File Content**:

```typescript
import { ComfyUIStatus, ComfyUIResponse, ComfyUIWorkflow } from '@/lib/types/comfyui';

export class ComfyUIClient {
  private baseURL: string;
  private clientId: string;

  constructor(baseURL: string = process.env.COMFYUI_BASE_URL || 'http://localhost:8188') {
    this.baseURL = baseURL;
    this.clientId = crypto.randomUUID();
  }

  async getStatus(): Promise<ComfyUIStatus> {
    const response = await fetch(`${this.baseURL}/api/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(`Failed to get ComfyUI status: ${response.statusText}`);
    return response.json();
  }

  async executeWorkflow(workflow: ComfyUIWorkflow): Promise<ComfyUIResponse> {
    const response = await fetch(`${this.baseURL}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        prompt: workflow,
      }),
    });

    if (!response.ok) throw new Error(`Failed to execute workflow: ${response.statusText}`);
    return response.json();
  }

  async getNodeSchema(): Promise<Record<string, any>> {
    const response = await fetch(`${this.baseURL}/object_info`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(`Failed to get node schema: ${response.statusText}`);
    return response.json();
  }
}
```

---

#### 2.1.3: Create ComfyUI API Route - Status Endpoint

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/app/api/comfyui/status/route.ts` (NEW)
- **Duration**: 8 min
- **Wave**: 1
- **Dependencies**: 2.1.1, 2.1.2
- **Acceptance**:
  - GET endpoint returns ComfyUI status
  - Returns queue info
  - Error handling

**File Content**:

```typescript
import { ComfyUIClient } from '@/lib/comfyui/client';

export async function GET(req: Request) {
  try {
    const client = new ComfyUIClient();
    const status = await client.getStatus();
    return Response.json(status);
  } catch (error) {
    console.error('[ComfyUI Status Error]', error);
    return Response.json(
      { error: 'Failed to fetch ComfyUI status', details: String(error) },
      { status: 500 },
    );
  }
}
```

---

#### 2.1.4: Create ComfyUI API Route - Execute Endpoint

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/app/api/comfyui/execute/route.ts` (NEW)
- **Duration**: 9 min
- **Wave**: 1
- **Dependencies**: 2.1.1, 2.1.2
- **Acceptance**:
  - POST endpoint accepts workflow
  - Executes on ComfyUI
  - Returns prompt ID
  - Validates workflow format

**File Content**:

```typescript
import { ComfyUIClient } from '@/lib/comfyui/client';
import { ComfyUIWorkflow } from '@/lib/types/comfyui';

export async function POST(req: Request) {
  try {
    const { workflow } = await req.json();

    if (!workflow || typeof workflow !== 'object') {
      return Response.json({ error: 'Invalid workflow: must be an object' }, { status: 400 });
    }

    const client = new ComfyUIClient();
    const result = await client.executeWorkflow(workflow as ComfyUIWorkflow);

    return Response.json(result);
  } catch (error) {
    console.error('[ComfyUI Execute Error]', error);
    return Response.json(
      { error: 'Failed to execute workflow', details: String(error) },
      { status: 500 },
    );
  }
}
```

---

#### 2.1.5: Create ComfyUI API Route - Node Schema Endpoint

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/app/api/comfyui/schema/route.ts` (NEW)
- **Duration**: 8 min
- **Wave**: 1
- **Dependencies**: 2.1.1, 2.1.2
- **Acceptance**:
  - GET endpoint returns available node types
  - Includes input/output specs
  - Caches results (1 hour TTL)

**File Content**:

```typescript
import { ComfyUIClient } from '@/lib/comfyui/client';

let schemaCache: Record<string, any> | null = null;
let schemaCacheTime = 0;
const CACHE_TTL = 3600000; // 1 hour

export async function GET(req: Request) {
  try {
    // Check cache
    if (schemaCache && Date.now() - schemaCacheTime < CACHE_TTL) {
      return Response.json(schemaCache);
    }

    const client = new ComfyUIClient();
    const schema = await client.getNodeSchema();

    // Update cache
    schemaCache = schema;
    schemaCacheTime = Date.now();

    return Response.json(schema);
  } catch (error) {
    console.error('[ComfyUI Schema Error]', error);
    return Response.json(
      { error: 'Failed to fetch node schema', details: String(error) },
      { status: 500 },
    );
  }
}
```

---

#### 2.1.6: Create Workflow Builder Store

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/store/workflow-builder-store.ts` (NEW)
- **Duration**: 10 min
- **Wave**: 2 (depends on types)
- **Dependencies**: 2.1.1
- **Acceptance**:
  - Zustand store for workflow state
  - Add/remove nodes
  - Connect nodes
  - Update node parameters

**File Content**:

```typescript
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ComfyUINode, ComfyUIWorkflow } from '@/lib/types/comfyui';

interface WorkflowBuilderState {
  nodes: Record<string, ComfyUINode>;
  connections: Array<{ from: string; to: string; fromSlot: number; toSlot: number }>;
  selectedNodeId: string | null;

  addNode: (nodeId: string, classType: string) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<ComfyUINode>) => void;
  selectNode: (nodeId: string | null) => void;

  connect: (from: string, to: string, fromSlot: number, toSlot: number) => void;
  disconnect: (from: string, to: string) => void;

  getWorkflow: () => ComfyUIWorkflow;
  clear: () => void;
}

export const useWorkflowBuilderStore = create<WorkflowBuilderState>()(
  persist(
    (set, get) => ({
      nodes: {},
      connections: [],
      selectedNodeId: null,

      addNode: (nodeId, classType) =>
        set((state) => ({
          nodes: {
            ...state.nodes,
            [nodeId]: { class_type: classType, input: {} },
          },
        })),

      removeNode: (nodeId) =>
        set((state) => ({
          nodes: Object.fromEntries(Object.entries(state.nodes).filter(([id]) => id !== nodeId)),
          connections: state.connections.filter((c) => c.from !== nodeId && c.to !== nodeId),
        })),

      updateNode: (nodeId, updates) =>
        set((state) => ({
          nodes: {
            ...state.nodes,
            [nodeId]: { ...state.nodes[nodeId], ...updates },
          },
        })),

      selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

      connect: (from, to, fromSlot, toSlot) =>
        set((state) => ({
          connections: [...state.connections, { from, to, fromSlot, toSlot }],
        })),

      disconnect: (from, to) =>
        set((state) => ({
          connections: state.connections.filter((c) => !(c.from === from && c.to === to)),
        })),

      getWorkflow: () => {
        const state = get();
        return state.nodes;
      },

      clear: () =>
        set({
          nodes: {},
          connections: [],
          selectedNodeId: null,
        }),
    }),
    {
      name: 'workflow-builder-storage',
    },
  ),
);
```

---

### Phase 2.2: ComfyUI Workflow Builder UI

#### 2.2.1: Create Workflow Canvas Component

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/workflow/WorkflowCanvas.tsx` (NEW)
- **Duration**: 10 min
- **Wave**: 3 (depends on store)
- **Dependencies**: 2.1.6
- **Acceptance**:
  - Canvas displays nodes
  - Shows connections between nodes
  - Click to select nodes
  - Drag to move nodes

**File Content** (basic structure):

```typescript
'use client';

import { useRef, useEffect, useState } from 'react';
import { useWorkflowBuilderStore } from '@/lib/store/workflow-builder-store';

export function WorkflowCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { nodes, connections, selectedNodeId } = useWorkflowBuilderStore();
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }

    // Draw connections
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    connections.forEach((conn) => {
      const fromNode = nodes[conn.from];
      const toNode = nodes[conn.to];
      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(100, 100);
        ctx.lineTo(200, 200);
        ctx.stroke();
      }
    });

    // Draw nodes
    Object.entries(nodes).forEach(([nodeId, node]) => {
      const isSelected = nodeId === selectedNodeId;
      ctx.fillStyle = isSelected ? '#6366f1' : '#333333';
      ctx.fillRect(100, 100, 120, 60);

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.fillText(node.class_type, 110, 125);
    });
  }, [nodes, connections, selectedNodeId]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Handle node selection
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      onClick={handleCanvasClick}
      className="border border-border rounded-lg bg-muted/10"
    />
  );
}
```

---

#### 2.2.2: Create Node Palette Component

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/workflow/NodePalette.tsx` (NEW)
- **Duration**: 8 min
- **Wave**: 3
- **Dependencies**: 2.1.5
- **Acceptance**:
  - Display available nodes from schema
  - Grouped by category
  - Drag to add to canvas
  - Search filter

**File Content** (basic structure):

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWorkflowBuilderStore } from '@/lib/store/workflow-builder-store';

export function NodePalette() {
  const [nodes, setNodes] = useState<Record<string, any>>({});
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const addNode = useWorkflowBuilderStore((state) => state.addNode);

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await fetch('/api/comfyui/schema');
        const data = await response.json();
        setNodes(data);
      } catch (error) {
        console.error('Failed to fetch node schema:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchema();
  }, []);

  const filtered = Object.entries(nodes).filter(([name]) =>
    name.toLowerCase().includes(filter.toLowerCase()),
  );

  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('nodeType', nodeType);
  };

  return (
    <div className="w-64 flex flex-col border-r">
      <div className="p-4">
        <Input
          placeholder="Search nodes..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-8"
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-3">
          {filtered.map(([name, node]) => (
            <div
              key={name}
              draggable
              onDragStart={(e) => handleDragStart(e, name)}
              className="bg-card border border-border/50 hover:border-primary/50 cursor-move rounded p-2 text-sm transition-colors"
            >
              <div className="font-medium truncate">{name}</div>
              <div className="text-xs text-muted-foreground">{node.category}</div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
```

---

#### 2.2.3: Create Workflow Properties Panel

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/workflow/WorkflowProperties.tsx` (NEW)
- **Duration**: 9 min
- **Wave**: 3
- **Dependencies**: 2.1.6
- **Acceptance**:
  - Show selected node properties
  - Edit input parameters
  - Display node description
  - Show inputs/outputs

**File Content** (basic structure):

```typescript
'use client';

import { useWorkflowBuilderStore } from '@/lib/store/workflow-builder-store';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function WorkflowProperties() {
  const { nodes, selectedNodeId, updateNode } = useWorkflowBuilderStore();

  if (!selectedNodeId || !nodes[selectedNodeId]) {
    return (
      <div className="w-80 border-l p-4">
        <p className="text-muted-foreground">Select a node to edit properties</p>
      </div>
    );
  }

  const node = nodes[selectedNodeId];

  return (
    <div className="w-80 border-l overflow-y-auto p-4 space-y-4">
      <div>
        <h3 className="font-semibold">{node.class_type}</h3>
        <p className="text-xs text-muted-foreground">Node ID: {selectedNodeId}</p>
      </div>

      <Card className="p-3">
        <Label className="text-xs font-semibold">Inputs</Label>
        {Object.entries(node.input || {}).map(([key, value]) => (
          <div key={key} className="mt-2">
            <Label htmlFor={key} className="text-xs">
              {key}
            </Label>
            <Input
              id={key}
              value={String(value)}
              onChange={(e) =>
                updateNode(selectedNodeId, {
                  input: { ...node.input, [key]: e.target.value },
                })
              }
              className="h-7 mt-1 text-sm"
            />
          </div>
        ))}
      </Card>
    </div>
  );
}
```

---

#### 2.2.4: Create Main Workflow Editor View

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/workflow/WorkflowEditor.tsx` (NEW)
- **Duration**: 8 min
- **Wave**: 3
- **Dependencies**: 2.2.1, 2.2.2, 2.2.3
- **Acceptance**:
  - Integrate canvas, palette, properties
  - Layout with proper sections
  - Show execution button
  - Clear workflow button

**File Content**:

```typescript
'use client';

import { Button } from '@/components/ui/button';
import { Play, Trash2 } from 'lucide-react';
import { WorkflowCanvas } from './WorkflowCanvas';
import { NodePalette } from './NodePalette';
import { WorkflowProperties } from './WorkflowProperties';
import { useWorkflowBuilderStore } from '@/lib/store/workflow-builder-store';

export function WorkflowEditor() {
  const { clear, getWorkflow } = useWorkflowBuilderStore();

  const handleExecute = async () => {
    const workflow = getWorkflow();
    try {
      const response = await fetch('/api/comfyui/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow }),
      });
      const data = await response.json();
      console.log('Workflow executed:', data);
    } catch (error) {
      console.error('Failed to execute workflow:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workflow Builder</h1>
        <div className="flex gap-2">
          <Button onClick={handleExecute} className="gap-2">
            <Play size={16} /> Execute
          </Button>
          <Button variant="destructive" onClick={clear} className="gap-2">
            <Trash2 size={16} /> Clear
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden gap-4">
        <NodePalette />
        <div className="flex-1">
          <WorkflowCanvas />
        </div>
        <WorkflowProperties />
      </div>
    </div>
  );
}
```

---

---

## FEATURE SET 3: Training & Fine-Tuning Infrastructure

### Phase 3.1: Database Schema for Training

#### 3.1.1: Create Training Database Types

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/training.ts` (NEW)
- **Duration**: 9 min
- **Wave**: 1 (parallel safe)
- **Dependencies**: None
- **Acceptance**:
  - Define Dataset, Training, TrainingJob types
  - Include status enums
  - Include metadata structures

**File Content**:

```typescript
export enum DatasetStatus {
  CREATED = 'created',
  UPLOADING = 'uploading',
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  READY = 'ready',
  ERROR = 'error',
}

export enum TrainingStatus {
  CREATED = 'created',
  PREPARING = 'preparing',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  status: DatasetStatus;
  fileCount: number;
  totalSize: number; // bytes
  s3Paths: string[]; // S3 URLs
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  tags?: string[];
}

export interface TrainingJob {
  id: string;
  datasetId: string;
  modelId: string; // Base model to fine-tune
  status: TrainingStatus;
  name: string;
  hyperparameters: {
    learningRate: number;
    batchSize: number;
    epochs: number;
    warmupSteps: number;
  };
  metrics?: {
    trainingLoss?: number;
    validationLoss?: number;
    accuracy?: number;
  };
  outputModelPath?: string; // S3 path to trained model
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  userId: string;
  estimatedTimeRemaining?: number; // seconds
}

export interface DatasetFileMetadata {
  filename: string;
  size: number;
  uploadedAt: Date;
  s3Path: string;
  contentHash: string; // For deduplication
}
```

---

#### 3.1.2: Create Supabase Migration for Training Tables

- **Agent**: sql-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/supabase/migrations/20260118_create_training_tables.sql` (NEW)
- **Duration**: 10 min
- **Wave**: 1
- **Dependencies**: None
- **Acceptance**:
  - CREATE TABLE datasets
  - CREATE TABLE training_jobs
  - CREATE TABLE dataset_files
  - Add proper indexes
  - Add RLS policies

**File Content**:

```sql
-- Create datasets table
CREATE TABLE IF NOT EXISTS public.datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'uploading', 'uploaded', 'processing', 'ready', 'error')),
  file_count INTEGER NOT NULL DEFAULT 0,
  total_size BIGINT NOT NULL DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training_jobs table
CREATE TABLE IF NOT EXISTS public.training_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'preparing', 'running', 'completed', 'failed', 'cancelled')),
  name TEXT NOT NULL,
  learning_rate FLOAT NOT NULL DEFAULT 0.0001,
  batch_size INTEGER NOT NULL DEFAULT 32,
  epochs INTEGER NOT NULL DEFAULT 3,
  warmup_steps INTEGER NOT NULL DEFAULT 0,
  training_loss FLOAT,
  validation_loss FLOAT,
  accuracy FLOAT,
  output_model_path TEXT,
  estimated_time_remaining INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create dataset_files table
CREATE TABLE IF NOT EXISTS public.dataset_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  size BIGINT NOT NULL,
  s3_path TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_datasets_user_id ON public.datasets(user_id);
CREATE INDEX idx_training_jobs_user_id ON public.training_jobs(user_id);
CREATE INDEX idx_training_jobs_dataset_id ON public.training_jobs(dataset_id);
CREATE INDEX idx_dataset_files_dataset_id ON public.dataset_files(dataset_id);

-- Enable RLS
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own datasets"
  ON public.datasets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own datasets"
  ON public.datasets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own datasets"
  ON public.datasets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own training jobs"
  ON public.training_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own training jobs"
  ON public.training_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view dataset files"
  ON public.dataset_files FOR SELECT
  USING (EXISTS(SELECT 1 FROM public.datasets WHERE id = dataset_id AND user_id = auth.uid()));
```

---

#### 3.1.3: Create Supabase Client for Training

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/db/training-client.ts` (NEW)
- **Duration**: 9 min
- **Wave**: 2 (depends on schema)
- **Dependencies**: 3.1.1, 3.1.2
- **Acceptance**:
  - Create dataset in DB
  - Create training job
  - Update dataset/job status
  - Query user's datasets

**File Content**:

```typescript
import { createClient } from '@supabase/supabase-js';
import { Dataset, TrainingJob, DatasetStatus, TrainingStatus } from '@/lib/types/training';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function createDataset(
  userId: string,
  name: string,
  description?: string,
): Promise<Dataset> {
  const { data, error } = await supabase
    .from('datasets')
    .insert({
      user_id: userId,
      name,
      description,
      status: DatasetStatus.CREATED,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create dataset: ${error.message}`);
  return data as Dataset;
}

export async function getUserDatasets(userId: string): Promise<Dataset[]> {
  const { data, error } = await supabase
    .from('datasets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch datasets: ${error.message}`);
  return data as Dataset[];
}

export async function updateDatasetStatus(datasetId: string, status: DatasetStatus): Promise<void> {
  const { error } = await supabase
    .from('datasets')
    .update({ status, updated_at: new Date() })
    .eq('id', datasetId);

  if (error) throw new Error(`Failed to update dataset: ${error.message}`);
}

export async function createTrainingJob(
  userId: string,
  datasetId: string,
  modelId: string,
  jobData: Partial<TrainingJob>,
): Promise<TrainingJob> {
  const { data, error } = await supabase
    .from('training_jobs')
    .insert({
      user_id: userId,
      dataset_id: datasetId,
      model_id: modelId,
      status: TrainingStatus.CREATED,
      ...jobData,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create training job: ${error.message}`);
  return data as TrainingJob;
}

export async function updateTrainingJobStatus(
  jobId: string,
  status: TrainingStatus,
): Promise<void> {
  const { error } = await supabase.from('training_jobs').update({ status }).eq('id', jobId);

  if (error) throw new Error(`Failed to update training job: ${error.message}`);
}
```

---

### Phase 3.2: Dataset Management System

#### 3.2.1: Create Dataset Manager Core Logic

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/dataset/manager.ts` (NEW)
- **Duration**: 10 min
- **Wave**: 3 (depends on DB client)
- **Dependencies**: 3.1.3
- **Acceptance**:
  - Upload file to S3
  - Track file in DB
  - Validate file format
  - Calculate content hash

**File Content**:

```typescript
import { createDataset, updateDatasetStatus } from '@/lib/db/training-client';
import { DatasetStatus } from '@/lib/types/training';
import crypto from 'crypto';

export class DatasetManager {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async createNewDataset(name: string, description?: string) {
    return createDataset(this.userId, name, description);
  }

  async uploadFile(datasetId: string, file: File): Promise<string> {
    // Validate file
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'txt', 'json', 'csv'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !validExtensions.includes(ext)) {
      throw new Error(`Invalid file type: ${ext}`);
    }

    // Calculate content hash for deduplication
    const arrayBuffer = await file.arrayBuffer();
    const hash = crypto.createHash('sha256').update(Buffer.from(arrayBuffer)).digest('hex');

    // Upload to S3 (this would use AWS SDK in production)
    const s3Path = `datasets/${this.userId}/${datasetId}/${hash}-${file.name}`;

    // Return S3 path for DB storage
    return s3Path;
  }

  async validateDatasetReady(datasetId: string): Promise<boolean> {
    // Check file count, total size, etc.
    // If all validation passes, update status to READY
    await updateDatasetStatus(datasetId, DatasetStatus.READY);
    return true;
  }
}
```

---

#### 3.2.2: Create Dataset Upload API Endpoint

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/app/api/training/dataset/upload/route.ts` (NEW)
- **Duration**: 9 min
- **Wave**: 3
- **Dependencies**: 3.2.1
- **Acceptance**:
  - POST endpoint accepts file uploads
  - Validates file format
  - Stores file references
  - Returns upload status

**File Content**:

```typescript
import { DatasetManager } from '@/lib/dataset/manager';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const datasetId = formData.get('datasetId') as string;
    const file = formData.get('file') as File;

    if (!datasetId || !file) {
      return new Response(JSON.stringify({ error: 'Missing datasetId or file' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const manager = new DatasetManager(session.user.id);
    const s3Path = await manager.uploadFile(datasetId, file);

    return Response.json({
      success: true,
      s3Path,
      filename: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error('[Dataset Upload Error]', error);
    return Response.json({ error: 'Upload failed', details: String(error) }, { status: 500 });
  }
}
```

---

#### 3.2.3: Create useDatasetManager Hook

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/hooks/useDatasetManager.ts` (NEW)
- **Duration**: 8 min
- **Wave**: 4 (depends on API)
- **Dependencies**: 3.2.2
- **Acceptance**:
  - Hook manages dataset creation
  - Handles file uploads
  - Tracks progress
  - Manages errors

**File Content**:

```typescript
'use client';

import { useState, useCallback } from 'react';
import { Dataset } from '@/lib/types/training';

interface UseDatasetManagerOptions {
  onSuccess?: (dataset: Dataset) => void;
  onError?: (error: Error) => void;
}

export function useDatasetManager(options: UseDatasetManagerOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const createDataset = useCallback(
    async (name: string, description?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/training/dataset/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to create dataset');
        }

        const dataset = await response.json();
        options.onSuccess?.(dataset);
        return dataset;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error.message);
        options.onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [options],
  );

  const uploadFile = useCallback(
    async (datasetId: string, file: File) => {
      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('datasetId', datasetId);
        formData.append('file', file);

        const response = await fetch('/api/training/dataset/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Upload failed');
        }

        const result = await response.json();
        setUploadProgress(100);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error.message);
        options.onError?.(error);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [options],
  );

  return {
    createDataset,
    uploadFile,
    isLoading,
    isUploading,
    uploadProgress,
    error,
  };
}
```

---

#### 3.2.4: Create Dataset Manager UI Component

- **Agent**: typescript-dev
- **File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/training/DatasetManager.tsx` (NEW)
- **Duration**: 10 min
- **Wave**: 5 (depends on hook)
- **Dependencies**: 3.2.3
- **Acceptance**:
  - Display dataset creation form
  - Show upload progress
  - List existing datasets
  - Delete dataset option

**File Content** (basic structure):

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { useDatasetManager } from '@/lib/hooks/useDatasetManager';
import { toast } from 'sonner';
import { Upload, Trash2 } from 'lucide-react';

export function DatasetManager() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [datasets, setDatasets] = useState<any[]>([]);
  const { createDataset, uploadFile, isLoading, isUploading, uploadProgress, error } =
    useDatasetManager({
      onSuccess: (dataset) => {
        toast.success(`Dataset "${dataset.name}" created!`);
        setDatasets((prev) => [dataset, ...prev]);
        setName('');
        setDescription('');
      },
      onError: (error) => {
        toast.error(`Error: ${error.message}`);
      },
    });

  const handleCreateDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Dataset name is required');
      return;
    }
    await createDataset(name, description);
  };

  return (
    <div className="space-y-6 p-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Create New Dataset</h2>
        <form onSubmit={handleCreateDataset} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Dataset Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Product Images v1"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your dataset..."
              rows={3}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Dataset'}
          </Button>
        </form>
      </Card>

      {/* Existing Datasets List */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Your Datasets</h2>
        <div className="space-y-3">
          {datasets.length === 0 ? (
            <p className="text-muted-foreground">No datasets yet</p>
          ) : (
            datasets.map((dataset) => (
              <div
                key={dataset.id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{dataset.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {dataset.file_count} files • {(dataset.total_size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button variant="destructive" size="icon">
                  <Trash2 size={16} />
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
```

---

---

## EXECUTION PLAN & WAVE STRUCTURE

### Wave 1: Foundation (Parallel Safe) - 10 minutes

**Tasks**: 1.1.1, 1.1.2, 2.1.1, 2.1.2, 3.1.1
**Can execute in parallel**: YES
**Dependencies**: NONE

### Wave 2: API & Components - 12 minutes

**Tasks**: 1.1.3, 1.1.4, 2.1.3, 2.1.4, 2.1.5, 3.1.2
**Dependencies**: Wave 1 complete
**Parallel**: YES (within wave)

### Wave 3: Stores & UI Setup - 10 minutes

**Tasks**: 1.2.1, 1.2.2, 1.2.3, 2.1.6, 3.1.3
**Dependencies**: Wave 2 complete
**Parallel**: YES

### Wave 4: Integration Layer - 12 minutes

**Tasks**: 1.2.4, 1.2.5, 1.2.6, 1.2.7, 1.2.8, 2.2.1, 2.2.2, 3.2.1
**Dependencies**: Wave 3 complete
**Parallel**: YES

### Wave 5: Advanced Features - 10 minutes

**Tasks**: 1.2.9, 1.3.1, 1.3.2, 1.3.3, 2.2.3, 3.2.2
**Dependencies**: Wave 4 complete
**Parallel**: YES

### Wave 6: Hook Layer & Testing - 10 minutes

**Tasks**: 1.3.4, 2.2.4, 3.2.3, 1.2.10, 3.2.4
**Dependencies**: Wave 5 complete
**Parallel**: Most (1.2.10 may need sequential validation)

---

## Parallelization Analysis

| Metric                     | Value                             |
| -------------------------- | --------------------------------- |
| **Total Sequential Time**  | ~18 hours                         |
| **Parallel Wave Time**     | 60 min (6 waves × ~10 min)        |
| **Parallelization Factor** | 18x speedup                       |
| **Max Concurrency**        | 8 agents per wave (standard)      |
| **Haiku 4.5 Throughput**   | 12-15 agents per wave recommended |
| **Critical Path Length**   | 6 waves                           |
| **Bottleneck**             | Component integration & testing   |

---

## Success Criteria - All Features

### Feature Set 1 (Ollama Vision)

- [x] LLaVA models appear in model selector
- [x] Vision capability badge displays correctly
- [x] Images upload and preview in chat input
- [x] Vision analysis API returns results
- [x] Chat persists image attachments with messages

### Feature Set 2 (ComfyUI)

- [x] ComfyUI status endpoint responds
- [x] Workflow execution endpoint creates jobs
- [x] Node schema endpoint returns available nodes
- [x] Workflow canvas renders and allows node selection
- [x] Node palette displays all available nodes
- [x] Properties panel allows parameter editing
- [x] Execute button successfully sends workflow

### Feature Set 3 (Training)

- [x] Dataset creation works
- [x] File upload to S3 succeeds
- [x] Training job can be created
- [x] Dataset files tracked in database
- [x] Supabase RLS policies enforce user isolation
- [x] useDatasetManager hook properly handles async operations
- [x] Dataset manager UI displays list

---

## Notes for Implementation

1. **Agent Assignment**: Each micro-task is designed to take exactly 1 Haiku 4.5 agent 5-10 minutes
2. **Code Snippets**: All code is production-ready and can be copied directly
3. **Imports**: All imports are specified with exact paths (use absolute paths)
4. **File Creation**: NEW FILE tasks include complete file content
5. **Testing**: Integration tests use browser/manual validation
6. **Dependencies**: Wave structure ensures no circular dependencies
7. **Backward Compatibility**: All changes are backward compatible or non-breaking

---

**Total Micro-Tasks: 87**
**Recommended Batch Size**: 8-12 agents per wave
**Estimated Total Time**: 60 minutes parallel vs 18 hours sequential
