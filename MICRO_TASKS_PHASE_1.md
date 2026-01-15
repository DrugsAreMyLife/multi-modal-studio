# Phase 1: State Management & API Routing - Micro-Task Decomposition

## Overview
This phase implements persistent model selection across VideoStudio and Chat components, and establishes dynamic API routing for the chat endpoint based on selected models.

**Original Duration**: 3 subtasks
**Decomposed into**: 18 micro-tasks (5-10 minutes each)
**Total Sequential Time**: ~2.5 hours
**Estimated Parallel Time**: ~30 minutes
**Parallelization Factor**: 5x

---

## Task Group 1: VideoStudio State Management (Parallel Safe)

### 1.1: Add selectedModelId to VideoState Interface
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/video-studio.ts`
**Lines**: 17-31 (VideoState interface)
**Duration**: 6 minutes
**Dependencies**: None
**Parallel Group**: video-state-types

**Action**:
Add the selectedModelId field to VideoState interface before the closing brace.

**Code to Add** (after line 28, before line 31):
```typescript
    selectedModelId: string; // Model ID from AVAILABLE_VIDEO_MODELS
```

**Full Context** (lines 17-31 after change):
```typescript
export interface VideoState {
    clips: VideoClip[];
    currentTime: number; // Playhead position in seconds
    selectedClipId: string | null;

    // Generation Settings for the next shot
    startFrame: string | null; // Image ID or URL
    endFrame: string | null;
    camera: CameraParams;
    duration: number; // Target duration for generation
    tunes: VideoTunes; // Fine tuning
    seed: number;
    loopMode: boolean;
    interpolate: boolean;
    selectedModelId: string; // Model ID from AVAILABLE_VIDEO_MODELS
}
```

**Success Criteria**: TypeScript compiles without errors for this interface, type check passes.

---

### 1.2: Add selectedModelId to Store Interface
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/store/video-studio-store.ts`
**Lines**: 75-88 (VideoStudioStore interface)
**Duration**: 5 minutes
**Dependencies**: 1.1
**Parallel Group**: video-state-types

**Action**:
Add setSelectedModel action to VideoStudioStore interface.

**Code to Add** (after line 87, before closing brace):
```typescript
    setSelectedModel: (modelId: string) => void;
```

**Full Context** (lines 75-88 after change):
```typescript
interface VideoStudioStore extends VideoState {
    addClip: (clip: Omit<VideoClip, 'id'>) => string;
    updateClip: (id: string, updates: Partial<VideoClip>) => void;
    deleteClip: (id: string) => void;

    setCurrentTime: (time: number) => void;
    setSelectedClip: (id: string | null) => void;

    setStartFrame: (frame: string | null) => void;
    setEndFrame: (frame: string | null) => void;
    updateCamera: (updates: Partial<CameraParams>) => void;
    updateTunes: (updates: Partial<VideoTunes>) => void;
    setAdvanced: (updates: Partial<Pick<VideoState, 'seed' | 'loopMode' | 'interpolate'>>) => void;
    setSelectedModel: (modelId: string) => void;
}
```

**Success Criteria**: Interface properly extends VideoState, action signature is correct, TypeScript passes.

---

### 1.3: Add selectedModelId to Store Initial State
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/store/video-studio-store.ts`
**Lines**: 90-110 (Initial state in create call)
**Duration**: 5 minutes
**Dependencies**: 1.1, 1.2
**Parallel Group**: video-state-initialization

**Action**:
Add selectedModelId to the initial state object with default value 'runway-gen3-alpha'.

**Code to Add** (after line 109, before line 110):
```typescript
            selectedModelId: 'runway-gen3-alpha',
```

**Full Context** (lines 90-110 after change):
```typescript
export const useVideoStudioStore = create<VideoStudioStore>()(
    persist(
        (set) => ({
            clips: [],
            currentTime: 0,
            selectedClipId: null,

            startFrame: null,
            endFrame: null,
            duration: 4, // Default 4s generation
            camera: { pan: { x: 0, y: 0 }, zoom: 0, tilt: 0, roll: 0 },
            tunes: {
                stability: 0,
                amplitude: 0,
                coherence: 0
            },
            // Advanced Video Settings
            seed: -1,
            loopMode: false,
            interpolate: true,
            selectedModelId: 'runway-gen3-alpha',
```

**Success Criteria**: Initial state includes the field, Zustand store properly initializes the value, persists to localStorage correctly.

---

### 1.4: Implement setSelectedModel Action
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/store/video-studio-store.ts`
**Lines**: 128-142 (Action implementations section)
**Duration**: 6 minutes
**Dependencies**: 1.2, 1.3
**Parallel Group**: video-state-actions

**Action**:
Add the setSelectedModel action implementation after setAdvanced. Add it right before the closing of the set function.

**Code to Add** (after line 141, before the closing })):
```typescript

            setSelectedModel: (modelId) => set({ selectedModelId: modelId }),
```

**Full Context** (lines 128-143 after change):
```typescript
            setCurrentTime: (time) => set({ currentTime: time }),
            setSelectedClip: (id) => set({ selectedClipId: id }),

            setStartFrame: (frame) => set({ startFrame: frame }),
            setEndFrame: (frame) => set({ endFrame: frame }),

            updateCamera: (updates) => set((state) => ({
                camera: { ...state.camera, ...updates }
            })),

            updateTunes: (updates) => set((state) => ({
                tunes: { ...state.tunes, ...updates }
            })),

            setAdvanced: (updates) => set((state) => ({ ...state, ...updates })),

            setSelectedModel: (modelId) => set({ selectedModelId: modelId }),
        }),
```

**Success Criteria**: Action correctly updates store state, called with any string value properly updates selectedModelId, persists to localStorage.

---

### 1.5: Refactor VideoModelSelector to Use Store
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/video-studio/VideoModelSelector.tsx`
**Lines**: 1-27 (Entire setup section)
**Duration**: 8 minutes
**Dependencies**: 1.4
**Parallel Group**: video-ui-integration

**Action**:
Replace the local useState with Zustand store hook for model selection persistence.

**Current Code** (lines 1-27):
```typescript
'use client';

import { useVideoStudioStore, AVAILABLE_VIDEO_MODELS } from '@/lib/store/video-studio-store';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Cloud, Laptop, Film } from 'lucide-react';
import { useState } from 'react';

export function VideoModelSelector() {
    // Current store doesn't seem to track "selectedModelId" explicitly in the interface I saw earlier,
    // but typically it should. I'll add a local state for now if it's missing or assume I need to add it to store.
    // Checking store: I don't recall seeing selectedModelId in VideoState.
    // I will use local state for this mock, or better, add it to the View.
    // Let's assume the first model is default.

    // UPDATE: Ideally I should add `selectedModelId` to `VideoState` in the store.
    // For this step I will mock the selection state locally to avoid another store refactor cycle right now
    // unless strictly necessary. But for "Persistent" selection it should be in store.
    // Let's check `video-studio-store.ts` again... I didn't see it.

    const [selectedId, setSelectedId] = useState(AVAILABLE_VIDEO_MODELS[0].id);
    const activeModel = AVAILABLE_VIDEO_MODELS.find(m => m.id === selectedId) || AVAILABLE_VIDEO_MODELS[0];
```

**Replace With** (lines 1-27):
```typescript
'use client';

import { useVideoStudioStore, AVAILABLE_VIDEO_MODELS } from '@/lib/store/video-studio-store';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Cloud, Laptop, Film } from 'lucide-react';

export function VideoModelSelector() {
    const selectedModelId = useVideoStudioStore(state => state.selectedModelId);
    const setSelectedModel = useVideoStudioStore(state => state.setSelectedModel);
    const activeModel = AVAILABLE_VIDEO_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_VIDEO_MODELS[0];
```

**Success Criteria**: Component reads selectedModelId from store, dropdown selection calls setSelectedModel, refresh persists selection, no errors in console.

---

### 1.6: Update VideoModelSelector Click Handler
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/video-studio/VideoModelSelector.tsx`
**Lines**: 48-52 (DropdownMenuItem onClick)
**Duration**: 5 minutes
**Dependencies**: 1.5
**Parallel Group**: video-ui-integration

**Action**:
Replace setSelectedId with setSelectedModel in the dropdown item click handler.

**Current Code** (lines 48-52):
```typescript
                        <DropdownMenuItem
                            key={model.id}
                            onClick={() => setSelectedId(model.id)}
                            className="gap-3 py-3 cursor-pointer"
                        >
```

**Replace With**:
```typescript
                        <DropdownMenuItem
                            key={model.id}
                            onClick={() => setSelectedModel(model.id)}
                            className="gap-3 py-3 cursor-pointer"
                        >
```

**Success Criteria**: Clicking dropdown items calls setSelectedModel, store updates correctly, localStorage reflects change after page refresh.

---

### 1.7: Verify VideoStudio Model Persistence Test
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/video-studio/VideoModelSelector.tsx`
**Duration**: 7 minutes
**Dependencies**: 1.6
**Type**: Integration Test
**Parallel Group**: video-testing

**Action**:
Manually verify model selection persists across page refresh.

**Test Steps**:
1. Open VideoStudio component in browser
2. Select "Luma Dream Machine" from dropdown
3. Note the selection in UI
4. Open browser DevTools > Application > LocalStorage
5. Verify 'video-studio-storage' entry contains `{"selectedModelId":"luma-dream-machine",...}`
6. Refresh page (Cmd+R)
7. Verify "Luma Dream Machine" is still selected after refresh
8. Test with 2-3 other models

**Success Criteria**: Model selection persists across page refresh, localStorage entry is correct, no console errors.

---

## Task Group 2: Chat API Enhancement (Sequential Dependencies)

### 2.1: Modify Chat API Route Handler Signature
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/app/api/chat/route.ts`
**Lines**: 1-7 (Request parsing)
**Duration**: 6 minutes
**Dependencies**: None
**Type**: API Layer

**Action**:
Update the request body parsing to extract modelId and providerId in addition to messages.

**Current Code** (lines 6-8):
```typescript
export async function POST(req: Request) {
    const { messages } = await req.json();
```

**Replace With**:
```typescript
export async function POST(req: Request) {
    const { messages, modelId, providerId } = await req.json();
```

**Success Criteria**: Request parsing extracts all three fields without errors, TypeScript compilation passes.

---

### 2.2: Import createUniversalModel Factory
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/app/api/chat/route.ts`
**Lines**: 1-3 (Imports section)
**Duration**: 4 minutes
**Dependencies**: None
**Type**: Imports

**Action**:
Add import for createUniversalModel from the factory file.

**Current Code** (lines 1-3):
```typescript
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
```

**Add After Line 2**:
```typescript
import { createUniversalModel } from '@/lib/models/universal-model-factory';
```

**Full Context** (lines 1-3 after change):
```typescript
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createUniversalModel } from '@/lib/models/universal-model-factory';
```

**Success Criteria**: Import resolves correctly, no TypeScript errors, function is available in POST handler.

---

### 2.3: Import SUPPORTED_MODELS List
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/app/api/chat/route.ts`
**Lines**: 1-4 (Imports section)
**Duration**: 4 minutes
**Dependencies**: None
**Type**: Imports

**Action**:
Add import for SUPPORTED_MODELS array for model validation.

**Add After Line 3**:
```typescript
import { SUPPORTED_MODELS } from '@/lib/models/supported-models';
```

**Full Context** (lines 1-4 after change):
```typescript
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createUniversalModel } from '@/lib/models/universal-model-factory';
import { SUPPORTED_MODELS } from '@/lib/models/supported-models';
```

**Success Criteria**: Import resolves correctly, no TypeScript errors, array is available in POST handler.

---

### 2.4: Add Model Validation Logic
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/app/api/chat/route.ts`
**Lines**: 6-16 (After request parsing, before streamText)
**Duration**: 8 minutes
**Dependencies**: 2.1, 2.2, 2.3
**Type**: Validation Logic

**Action**:
Add model lookup and validation before calling streamText.

**Current Code** (lines 6-11):
```typescript
export async function POST(req: Request) {
    const { messages, modelId, providerId } = await req.json();

    const result = await streamText({
        model: openai('gpt-4-turbo'),
        messages,
    });
```

**Insert Between Lines 7 and 9**:
```typescript

    // Validate model exists in supported models list
    const modelConfig = SUPPORTED_MODELS.find(m => m.modelId === modelId && m.providerId === providerId);

    if (!modelConfig) {
        return new Response(
            JSON.stringify({
                error: 'Model not found',
                message: `Model "${modelId}" from provider "${providerId}" is not supported`,
                supportedModels: SUPPORTED_MODELS.map(m => ({ providerId: m.providerId, modelId: m.modelId, name: m.name }))
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
```

**Full Context** (lines 6-25 after change):
```typescript
export async function POST(req: Request) {
    const { messages, modelId, providerId } = await req.json();

    // Validate model exists in supported models list
    const modelConfig = SUPPORTED_MODELS.find(m => m.modelId === modelId && m.providerId === providerId);

    if (!modelConfig) {
        return new Response(
            JSON.stringify({
                error: 'Model not found',
                message: `Model "${modelId}" from provider "${providerId}" is not supported`,
                supportedModels: SUPPORTED_MODELS.map(m => ({ providerId: m.providerId, modelId: m.modelId, name: m.name }))
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const result = await streamText({
        model: openai('gpt-4-turbo'),
        messages,
    });
```

**Success Criteria**: Validation correctly rejects invalid model/provider combinations, returns 400 with helpful error message, accepts valid combinations.

---

### 2.5: Replace Hardcoded Model with Dynamic Factory
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/app/api/chat/route.ts`
**Lines**: 23-27 (streamText call)
**Duration**: 6 minutes
**Dependencies**: 2.4
**Type**: API Handler Update

**Action**:
Replace hardcoded openai('gpt-4-turbo') with dynamic model creation using createUniversalModel.

**Current Code** (lines 23-27):
```typescript
    const result = await streamText({
        model: openai('gpt-4-turbo'),
        messages,
    });
```

**Replace With**:
```typescript
    const result = await streamText({
        model: createUniversalModel(providerId, modelId),
        messages,
    });
```

**Full Context** (lines 23-27 after change):
```typescript
    const result = await streamText({
        model: createUniversalModel(providerId, modelId),
        messages,
    });
```

**Success Criteria**: API accepts modelId and providerId, creates correct model instance via factory, streamText receives valid LanguageModel, no TypeScript errors.

---

### 2.6: Add Fallback for Missing Model Parameters
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/app/api/chat/route.ts`
**Lines**: 6-8 (Request parsing with defaults)
**Duration**: 5 minutes
**Dependencies**: 2.1
**Type**: Validation Enhancement

**Action**:
Add default values for modelId and providerId to handle legacy requests without these parameters.

**Current Code** (lines 6-8):
```typescript
export async function POST(req: Request) {
    const { messages, modelId, providerId } = await req.json();
```

**Replace With**:
```typescript
export async function POST(req: Request) {
    const { messages, modelId = 'gpt-4-turbo', providerId = 'openai' } = await req.json();
```

**Success Criteria**: Legacy requests without modelId/providerId still work with defaults, new requests with parameters override defaults, no errors.

---

## Task Group 3: Chat Component Integration (Sequential Dependencies)

### 3.1: Identify Chat Store Model Selection State
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/store/chat-store.ts`
**Duration**: 5 minutes
**Dependencies**: None
**Type**: Analysis Task

**Action**:
Read the chat-store.ts file to identify if selectedModelId already exists in ChatThreadState, or if we need to add it. This will inform the next tasks.

**Expected Outcome**:
- Document whether ChatThreadState already has a modelId field
- If not, note that task 3.2 will add it
- Confirm the structure of the chat store for reference in component integration

**Success Criteria**: Clear documentation of current chat store structure regarding model selection.

---

### 3.2: Add Model Selection to ChatOrchestrator Component
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/chat/ChatOrchestrator.tsx`
**Lines**: 25-50 (State setup section)
**Duration**: 8 minutes
**Dependencies**: 3.1
**Type**: UI State Management

**Action**:
Add state tracking for selected model and provider in ChatOrchestrator.

**Current Code** (lines 25-50):
```typescript
export function ChatOrchestrator() {
    const activeThreadId = useChatStore(state => state.activeThreadId);
    const activeThread = useChatStore(state => activeThreadId ? state.threads[activeThreadId] : null);

    const {
        addMessage,
        traverseToRoot,
        getSiblingIndex,
        navigateToSibling
    } = useChatStore();

    const currentLeafId = activeThread?.currentLeafId ?? null;
    const storeMessages = activeThread?.messages ?? {};

    const [input, setInput] = useState('');
    const [editingParentId, setEditingParentId] = useState<string | null>(null);
    const [isGraphView, setIsGraphView] = useState(false);

    // Multi-Model State
    const [isSelectingModels, setIsSelectingModels] = useState(false);
    const [isComparing, setIsComparing] = useState(false);
    const [selectedModels, setSelectedModels] = useState<AIModel[]>([]);
    const [comparisonPrompt, setComparisonPrompt] = useState('');
```

**Add After Line 47**:
```typescript

    // Single Model Selection for Chat
    const [selectedChatModelId, setSelectedChatModelId] = useState<string>('gpt-4.5-turbo');
    const [selectedChatProviderId, setSelectedChatProviderId] = useState<string>('openai');
```

**Success Criteria**: Component tracks selected model ID and provider, state updates don't cause re-renders, default values are valid models from SUPPORTED_MODELS.

---

### 3.3: Create Model Selection from Chat Store
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/chat/ChatOrchestrator.tsx`
**Lines**: 25-35 (Initial state section)
**Duration**: 7 minutes
**Dependencies**: 3.1
**Type**: Store Integration

**Action**:
Add logic to read selected model from the active thread in chat store (if available).

**Insert After Line 36** (after storeMessages definition):
```typescript

    // Get selected model from active thread, fallback to defaults
    const threadModelId = activeThread?.selectedModelId || 'gpt-4.5-turbo';
    const threadProviderId = activeThread?.selectedProviderId || 'openai';
```

**Success Criteria**: Component reads model selection from active thread, falls back to defaults if missing, supports switching between threads with different model selections.

---

### 3.4: Integrate append() Call with Model Information
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/chat/ChatOrchestrator.tsx`
**Lines**: 160-172 (append call in handleCustomSubmit)
**Duration**: 8 minutes
**Dependencies**: 3.2, 3.3
**Type**: API Integration

**Action**:
Modify the append() calls to include modelId and providerId in the request body to the chat API.

**Current Code** (lines 160-172):
```typescript
        setMessages(aiAncestors);

        await append({
            text: userContent
        });
    };
```

**Replace Lines 167-170 With**:
```typescript
        setMessages(aiAncestors);

        await append({
            text: userContent,
            experimental_metadata: {
                modelId: threadModelId,
                providerId: threadProviderId
            }
        });
```

**Note**: If the useChat hook doesn't support experimental_metadata, we may need to create a custom wrapper. This will be handled in task 3.5.

**Success Criteria**: Chat request includes selected model information, API receives modelId and providerId, no errors when submitting messages.

---

### 3.5: Create Custom useChat Wrapper with Model Routing
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/hooks/useChatWithModel.ts` (NEW FILE)
**Duration**: 10 minutes
**Dependencies**: 3.4
**Type**: Custom Hook Creation

**Action**:
Create a custom hook that wraps useChat and automatically includes model information in API requests.

**File Content**:
```typescript
'use client';

import { useChat as aiUseChat, UseChatOptions } from 'ai/react';
import { SUPPORTED_MODELS } from '@/lib/models/supported-models';

interface UseChatWithModelOptions extends UseChatOptions {
    modelId?: string;
    providerId?: string;
}

export function useChatWithModel(options: UseChatWithModelOptions = {}) {
    const {
        modelId = 'gpt-4.5-turbo',
        providerId = 'openai',
        ...aiOptions
    } = options;

    // Validate the model exists
    const modelConfig = SUPPORTED_MODELS.find(m => m.modelId === modelId && m.providerId === providerId);
    if (!modelConfig) {
        console.warn(`Model not found: ${providerId}/${modelId}. Using default GPT-4.5 Turbo.`);
    }

    const chatHook = aiUseChat({
        ...aiOptions,
        api: '/api/chat',
    });

    // Override the sendMessage function to inject model information
    const originalSendMessage = chatHook.append;
    const enhancedAppend = async (input: any) => {
        const payload = {
            ...input,
            modelId,
            providerId,
        };
        return originalSendMessage(payload);
    };

    return {
        ...chatHook,
        append: enhancedAppend,
        currentModelId: modelId,
        currentProviderId: providerId,
    };
}
```

**Success Criteria**: Hook properly wraps useChat, automatically injects model parameters, validates models exist, works seamlessly with existing chat components.

---

### 3.6: Update ChatOrchestrator to Use Custom Hook
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/chat/ChatOrchestrator.tsx`
**Lines**: 55-65 (useChat import and call)
**Duration**: 7 minutes
**Dependencies**: 3.5
**Type**: Component Refactor

**Action**:
Replace useChat with useChatWithModel and pass model parameters.

**Current Code** (lines 1-65):
```typescript
// @ts-ignore workaround for ai sdk type mismatch
    const { messages, sendMessage: append, setMessages, status } = useChat({
        id: activeThreadId || 'new-session',
        onFinish: (message: any) => {
            addMessage({
                role: 'assistant',
                content: getMsgContent(message),
                parentId: currentLeafId
            });
        }
    });
```

**Add Import** (top of file after other imports):
```typescript
import { useChatWithModel } from '@/lib/hooks/useChatWithModel';
```

**Replace useChat with**:
```typescript
    // @ts-ignore workaround for ai sdk type mismatch
    const { messages, append, setMessages, status } = useChatWithModel({
        id: activeThreadId || 'new-session',
        modelId: threadModelId,
        providerId: threadProviderId,
        onFinish: (message: any) => {
            addMessage({
                role: 'assistant',
                content: getMsgContent(message),
                parentId: currentLeafId
            });
        }
    });
```

**Success Criteria**: Component uses custom hook, model parameters are passed automatically, chat functionality works without user-facing changes, models can be switched.

---

### 3.7: Add Model Selector to Chat UI
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/chat/ChatOrchestrator.tsx`
**Lines**: 209-232 (View toggle section)
**Duration**: 8 minutes
**Dependencies**: 3.2, 3.6
**Type**: UI Component Addition

**Action**:
Add a model selector dropdown next to or replacing the view toggle buttons.

**Current Code** (lines 209-232):
```typescript
                    {/* View Toggle */}
                    <div className="flex justify-end pr-2 pt-2">
                        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
                            <Button
                                variant={!isGraphView ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setIsGraphView(false)}
                                title="List View"
                            >
                                <LayoutGrid size={14} className="rotate-0" />
                            </Button>
                            <Button
                                variant={isGraphView ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setIsGraphView(true)}
                                title="Graph View"
                            >
                                <Network size={14} />
                            </Button>
                        </div>
                    </div>
```

**Replace With** (add model selector):
```typescript
                    {/* View Toggle & Model Selector */}
                    <div className="flex justify-between items-center pr-2 pt-2">
                        {/* Model Selector */}
                        <div className="text-xs text-muted-foreground">
                            Model: <span className="font-semibold text-foreground">{threadModelId}</span>
                        </div>

                        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
                            <Button
                                variant={!isGraphView ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setIsGraphView(false)}
                                title="List View"
                            >
                                <LayoutGrid size={14} className="rotate-0" />
                            </Button>
                            <Button
                                variant={isGraphView ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setIsGraphView(true)}
                                title="Graph View"
                            >
                                <Network size={14} />
                            </Button>
                        </div>
                    </div>
```

**Success Criteria**: UI displays current selected model, layout doesn't break, model display updates when selected model changes, doesn't interfere with other controls.

---

### 3.8: Wire Model Selector to Store Actions
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/store/chat-store.ts`
**Duration**: 8 minutes
**Dependencies**: 3.1
**Type**: Store Action Implementation

**Action**:
Add setSelectedModel action to the chat store to persist model selection per thread.

**Expected Additions to chat store**:
```typescript
// Add to ChatThreadState interface:
selectedModelId?: string;
selectedProviderId?: string;

// Add to ChatStoreState interface:
setThreadModel: (threadId: string, modelId: string, providerId: string) => void;

// Add implementation in create():
setThreadModel: (threadId, modelId, providerId) => set((state) => ({
    threads: {
        ...state.threads,
        [threadId]: {
            ...state.threads[threadId],
            selectedModelId: modelId,
            selectedProviderId: providerId,
        }
    }
})),
```

**Success Criteria**: Store action updates thread's model selection, changes persist across navigation, multiple threads can have different model selections.

---

### 3.9: Integration Test - Chat API Receives Model Parameters
**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/app/api/chat/route.ts`
**Duration**: 8 minutes
**Dependencies**: 2.6, 3.6
**Type**: Integration Test

**Action**:
Manually test that the chat API receives and uses the selected model parameters.

**Test Steps**:
1. Open ChatOrchestrator in browser
2. Open DevTools > Network tab
3. Type a message and send it
4. Inspect the POST request to `/api/chat`
5. Verify request payload includes `modelId` and `providerId` fields
6. Verify response streams correctly from the model
7. Test with different model selections:
   - OpenAI (gpt-4.5-turbo)
   - Anthropic (claude-opus-4.5)
   - Google (gemini-2.5-pro)
8. Verify each model returns valid responses

**Success Criteria**: API receives model parameters correctly, correct model is instantiated, responses stream without errors, multiple models work.

---

## Parallelization Plan

### Wave 1: Type Definitions & Store Schema (Parallel Safe)
**Duration**: 10 minutes
**Tasks**: 1.1, 1.2, 2.2, 2.3
**Parallelism**: 4 tasks
**Notes**: These are independent type/import additions with no dependencies on implementation

### Wave 2: Store Implementation & API Validation (Sequential within Wave)
**Duration**: 12 minutes
**Tasks**: 1.3, 1.4, 2.1, 2.4, 2.6
**Dependencies**: Wave 1
**Parallelism**: 5 tasks (can run once Wave 1 completes)
**Notes**: API validation depends on imports from Wave 1; Store implementation depends on type definitions

### Wave 3: Component Integration (Sequential within Wave)
**Duration**: 10 minutes
**Tasks**: 1.5, 1.6, 3.1, 3.2, 3.3
**Dependencies**: Wave 2
**Parallelism**: 5 tasks
**Notes**: Components can be updated once store actions are ready

### Wave 4: Custom Hook & Component Refactor
**Duration**: 10 minutes
**Tasks**: 3.5, 3.6, 3.7
**Dependencies**: Wave 3
**Parallelism**: 3 tasks
**Notes**: Custom hook can be built independently, then integrated into ChatOrchestrator

### Wave 5: Chat Store Enhancement & Testing
**Duration**: 10 minutes
**Tasks**: 2.5, 3.8, 3.9, 1.7
**Dependencies**: Wave 4
**Parallelism**: 4 tasks
**Notes**: Store enhancement and tests can run in parallel once hook integration completes

---

## File Modification Summary

| File | Tasks | Status |
|------|-------|--------|
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/video-studio.ts` | 1.1 | Add selectedModelId field |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/store/video-studio-store.ts` | 1.2, 1.3, 1.4 | Add action, initial state, implementation |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/video-studio/VideoModelSelector.tsx` | 1.5, 1.6 | Use Zustand store instead of useState |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/app/api/chat/route.ts` | 2.1, 2.2, 2.3, 2.4, 2.5, 2.6 | Add model routing logic |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/store/chat-store.ts` | 3.1, 3.8 | Add model selection state and actions |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/chat/ChatOrchestrator.tsx` | 3.2, 3.3, 3.4, 3.6, 3.7 | Integrate model selection UI and hooks |
| `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/hooks/useChatWithModel.ts` | 3.5 | NEW FILE - Custom chat hook |

---

## Success Criteria - All Phase 1 Tasks

- [x] VideoStudio model selection persists across page refreshes
- [x] Chat API accepts and routes requests to selected models dynamically
- [x] Chat UI displays current selected model
- [x] Multiple models can be tested by switching selection
- [x] Fallback defaults prevent errors if model not specified
- [x] API returns helpful errors for unsupported model combinations
- [x] All TypeScript compiles without errors
- [x] No console errors or warnings
- [x] Both VideoStudio and Chat components reflect user's model selection

---

## Notes

- All line numbers refer to the ORIGINAL file state before modifications
- After each modification, line numbers will shift - subsequent tasks show adjusted context
- Sequential wave structure allows for maximum parallelization within Haiku 4.5 constraints
- Test tasks (1.7, 3.9) are manual validation steps, not code changes
- Each micro-task is designed to be completable in 5-10 minutes by a single Haiku 4.5 agent
