# UI/UX Audit - Detailed Issues & Fixes

## CRITICAL ISSUES

### Issue #1: useState Hook Called with Callback Instead of useEffect

**Severity:** CRITICAL (Violates React hooks rules)
**File:** `/src/components/audio-studio/AudioStudio.tsx`
**Lines:** 68-70

**Current Code:**

```typescript
useState(() => {
  fetchVoices();
});
```

**Problem:**

- `useState` expects a value or function returning a value, not a side effect
- This violates React hooks rules
- Behavior is unpredictable and will cause warnings in development
- Voice list may not load properly on component mount

**Correct Implementation:**

```typescript
useEffect(() => {
  fetchVoices();
}, []); // Empty dependency array - run once on mount
```

**Impact:** HIGH - Core feature (voice loading) may not work
**Test Case:** Component should load available voices on first render without console warnings

---

### Issue #2: Unsafe Type Casting with `as any` in ReactFlow Nodes

**Severity:** CRITICAL (Type safety bypass)
**File:** `/src/components/workflow/WorkflowStudio.tsx`
**Lines:** 38-40

**Current Code:**

```typescript
const nodeTypes: NodeTypes = {
  llm: LLMNode as any,
  image: ImageNode as any,
};
```

**Problem:**

- `as any` defeats TypeScript's type checking
- Errors in LLMNode or ImageNode won't be caught at compile time
- Runtime errors may occur unexpectedly
- Violates TypeScript best practices

**Correct Implementation:**

```typescript
import type { NodeTypes } from '@xyflow/react';

const nodeTypes: NodeTypes = {
  llm: LLMNode,
  image: ImageNode,
} as const satisfies NodeTypes;
```

**Alternative (if NodeTypes doesn't match):**
Create a type-safe wrapper:

```typescript
interface CustomNodeTypes extends NodeTypes {
  llm: typeof LLMNode;
  image: typeof ImageNode;
}
```

**Impact:** CRITICAL - Type safety compromised
**Test Case:** Components should compile with no type errors

---

### Issue #3: Infinite Polling Loop Without Timeout or Max Attempts

**Severity:** CRITICAL (Memory leak risk)
**File:** `/src/components/image-studio/ImageStudio.tsx`
**Lines:** 81-104

**Current Code:**

```typescript
let status = data.status || 'pending';
let imageUrl = null;
let attempts = 0;
const maxAttempts = 60; // 60 seconds timeout

while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  attempts++;

  const statusRes = await fetch(`/api/generate/image/status?jobId=${data.jobId}`, {
    headers: getApiHeaders(),
  });

  if (statusRes.ok) {
    const statusData = await statusRes.json();
    status = statusData.status;
    if (status === 'completed') {
      imageUrl = statusData.result_url;
    } else if (status === 'failed') {
      throw new Error(statusData.error || 'Generation failed');
    }
  }
}
```

**Problems:**

1. If API returns unexpected status value, polling continues forever
2. No handling for network errors during polling
3. maxAttempts check won't help if status is neither 'completed', 'failed', nor expected values
4. No user feedback during polling (UI may appear frozen)

**Improved Implementation:**

```typescript
let status = data.status || 'pending';
let imageUrl = null;
let attempts = 0;
const maxAttempts = 30;
const pollInterval = 2000;

try {
  while (attempts < maxAttempts) {
    if (status === 'completed') {
      if (!imageUrl) throw new Error('Completed but no image URL returned');
      break;
    }

    if (status === 'failed') {
      throw new Error(statusData?.error || 'Generation failed');
    }

    // Unexpected status - log and timeout
    if (!['pending', 'processing'].includes(status)) {
      console.warn(`Unexpected status: ${status}`);
      throw new Error(`Invalid generation status: ${status}`);
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
    attempts++;

    const statusRes = await fetch(`/api/generate/image/status?jobId=${data.jobId}`, {
      headers: getApiHeaders(),
    });

    if (!statusRes.ok) {
      throw new Error(`Status check failed: ${statusRes.status}`);
    }

    const statusData = await statusRes.json();
    status = statusData.status;

    if (status === 'completed') {
      imageUrl = statusData.result_url;
    }
  }

  if (attempts >= maxAttempts) {
    throw new Error(`Generation timeout after ${maxAttempts * 2}s`);
  }

  if (!imageUrl) {
    throw new Error('Generation completed but no image available');
  }

  setGeneratedImage(imageUrl);
  // ... rest of success handling
} catch (err) {
  setError(err instanceof Error ? err.message : 'Generation failed');
  throw err;
}
```

**Same issue in:**

- `/src/components/video-studio/VideoStudio.tsx` (Lines 113-149)
- `/src/components/workflow/WorkflowStudio.tsx` (Lines 133-149)

**Impact:** HIGH - Potential memory leak and stuck UI state
**Test Cases:**

- API returns unexpected status value
- Network failure during polling
- Poll timeout after 60 seconds

---

### Issue #4: Unsafe Error Type Assertion

**Severity:** CRITICAL (Error handling vulnerability)
**File:** `/src/components/chat/ChatInputArea.tsx`
**Lines:** 141-147

**Current Code:**

```typescript
.catch((e) => {
  if (e.message !== 'PULL_REQUIRED') {
    console.error('Send failed:', e);
    toast.error('An error occurred while preparing your message');
  }
  // If PULL_REQUIRED, we just stop here.
});
```

**Problem:**

- Assumes error object has `.message` property (may not always exist)
- Throws error silently if it's PULL_REQUIRED without user notification
- No recovery path for PULL_REQUIRED case
- User left confused when action fails silently

**Correct Implementation:**

```typescript
.catch((e) => {
  const error = e instanceof Error ? e : new Error(String(e));
  const message = error.message || 'Unknown error';

  if (message === 'PULL_REQUIRED') {
    // Handle model pull requirement
    setModelToPull({ id: modelId, pullString: selectedModel?.pullString || '' });
    setPendingAction({ content: value, attachments });
  } else {
    console.error('Send failed:', error);
    toast.error(`Failed to send message: ${message}`);
  }
});
```

**Impact:** HIGH - Poor error handling and user feedback
**Test Case:** Send message with model that needs pulling

---

### Issue #5: Missing useCallback Memoization on Event Handler

**Severity:** CRITICAL (Performance degradation)
**File:** `/src/components/layout/Shell.tsx`
**Lines:** 311

**Current Code:**

```typescript
const { isFocused, toggleFocused } = useUIStore();

// Later:
<Button
  onClick={() => toggleFocused()}
  // ...
>
```

**Problem:**

- Inline arrow function created on every render
- All children re-render unnecessarily when parent updates
- useUIStore action not wrapped in useCallback
- Can cause cascade of re-renders

**Correct Implementation:**

```typescript
const { isFocused, toggleFocused } = useUIStore();
const handleToggleFocused = useCallback(() => {
  toggleFocused();
}, [toggleFocused]); // Include if toggleFocused changes

// Later:
<Button
  onClick={handleToggleFocused}
  // ...
>
```

**Impact:** MEDIUM - Performance degradation in focus mode toggle
**Test Case:** Toggle focus mode multiple times and check render count

---

## HIGH PRIORITY ISSUES

### Issue #6: Missing Error Recovery in Error Boundaries

**Severity:** HIGH (Poor user experience on crash)
**File:** `/src/components/shared/ErrorBoundary.tsx`
**Lines:** 37-40

**Current Code:**

```typescript
private handleReset = () => {
  this.setState({ hasError: false, error: null });
  window.location.reload();
};
```

**Problem:**

- Only option is full page reload
- All user state/progress lost
- No way to continue with other studios
- Page reload doesn't work if there's a persistent backend issue

**Better Implementation:**

```typescript
private handleReset = () => {
  // Try to recover from error boundary state only
  this.setState({ hasError: false, error: null });
  // Don't reload unless necessary
};

// Add fallback route:
private handleNavigateHome = () => {
  window.location.href = '/';
};

// In render:
<div className="flex flex-col gap-2">
  <Button
    onClick={this.handleReset}
    variant="outline"
  >
    Try Again
  </Button>
  <Button
    onClick={this.handleNavigateHome}
    variant="ghost"
  >
    Go Back to Dashboard
  </Button>
  {this.props.fallback && (
    <Button
      onClick={() => this.props.fallback?.()}
      variant="secondary"
    >
      Use Fallback UI
    </Button>
  )}
</div>
```

**Impact:** HIGH - Users cannot recover from error without losing work
**Test Case:** Crash studio and verify recovery options

---

### Issue #7: API Response Parsing Assumes Fixed Schema

**Severity:** HIGH (Fragile API integration)
**File:** `/src/components/image-studio/ImageStudio.tsx`
**Lines:** 74-78

**Current Code:**

```typescript
const data = await response.json();

if (!data.success) {
  throw new Error(data.error || 'Failed to generate image');
}

if (data.jobId) {
  // ... polling logic
} else if (data.images && data.images.length > 0) {
  // ... handle images directly
}
```

**Problem:**

- Assumes all endpoints return `{ success, error }` format
- No validation of response structure
- Brittle to API changes
- May break if API behavior differs slightly

**Better Implementation:**

```typescript
// Define response schema
interface GenerateImageResponse {
  success: boolean;
  error?: string;
  jobId?: string;
  images?: Array<{ url: string }>;
  status?: string;
}

// Add validation
function isValidGenerateResponse(data: unknown): data is GenerateImageResponse {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.success === 'boolean';
}

// Use with error handling
const data = await response.json();

if (!isValidGenerateResponse(data)) {
  throw new Error('Invalid response format from API');
}

if (!data.success) {
  throw new Error(data.error || 'Failed to generate image');
}
```

**Similar issues in:**

- `/src/components/video-studio/VideoStudio.tsx` (Line 90)
- `/src/components/workflow/WorkflowStudio.tsx` (Lines 131, 151)

**Impact:** HIGH - API changes may break functionality
**Test Case:** Mock API returning different response format

---

### Issue #8: Missing Network Timeout on Fetch Calls

**Severity:** HIGH (Users may wait indefinitely)
**File:** Multiple components

**Example from `/src/components/image-studio/ImageStudio.tsx` Line 57:**

```typescript
const response = await fetch('/api/generate/image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...getApiHeaders() },
  body: JSON.stringify({
    /* ... */
  }),
  // Missing: timeout!
});
```

**Problem:**

- fetch() has no built-in timeout
- Browser may wait 2+ minutes before timing out
- User thinks request is hung
- No way to cancel long requests

**Correct Implementation:**

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

try {
  const response = await fetch('/api/generate/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getApiHeaders() },
    body: JSON.stringify({
      /* ... */
    }),
    signal: controller.signal, // Add timeout signal
  });
  clearTimeout(timeoutId);
  // ... handle response
} catch (err) {
  if (err instanceof DOMException && err.name === 'AbortError') {
    throw new Error('Request timed out after 30 seconds');
  }
  throw err;
}
```

**Or use a utility:**

```typescript
const fetchWithTimeout = (url: string, options: RequestInit & { timeout?: number } = {}) => {
  const { timeout = 30000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  return fetch(url, { ...fetchOptions, signal: controller.signal }).finally(() =>
    clearTimeout(timeoutId),
  );
};
```

**Impact:** HIGH - UX degradation when requests hang
**Test Case:** Disable network and attempt to generate content

---

### Issue #9: Inconsistent Loading State Handling

**Severity:** HIGH (Confusing UX)
**File:** Multiple components, example: `/src/components/video-studio/VideoStudio.tsx` Line 350

**Current Code:**

```typescript
<Button
  onClick={handleRender}
  disabled={isGenerating || !prompt.trim()}
>
  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video size={16} />}
  {isGenerating ? 'Rendering...' : 'Render Clip'}
</Button>
```

**Good aspects:**

- Shows loading state
- Button disabled during operation
- Icon changes to spinner

**Missing aspects:**

- Share button doesn't show loading state (Line 321)
- No progress percentage
- No way to cancel long operations

**Better Implementation:**

```typescript
<Button
  onClick={handleRender}
  disabled={isGenerating || !prompt.trim()}
  className={cn(
    'transition-all',
    isGenerating && 'opacity-60'
  )}
>
  {isGenerating ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin" />
      Rendering... (2m 34s elapsed)
    </>
  ) : (
    <>
      <Video size={16} />
      Render Clip
    </>
  )}
</Button>

{isGenerating && (
  <Progress value={progress} className="mt-2" />
)}
```

**Impacted components:**

- Video share button
- Image share button
- Training start button

**Impact:** HIGH - Users don't know if action is processing
**Test Case:** Generate video and monitor UI feedback

---

### Issue #10: Disabled Button State Not Visually Distinct

**Severity:** HIGH (Accessibility issue)
**File:** Multiple components

**Example:** `/src/components/image-studio/ImageStudio.tsx` Line 390

**Current Code:**

```html
<button disabled="{isGenerating" || !prompt.trim()}>Generate</button>
```

**Problem:**

- Button component uses `disabled:opacity-50` (from button.tsx Line 8)
- Some disabled buttons may not show visual change
- Users might click disabled button expecting action
- Accessibility: not clear to assistive technology users

**Better Implementation:**

```typescript
// In button.tsx - ensure strong disabled state:
const buttonVariants = cva(
  "inline-flex items-center justify-center ... disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
  // ...
);

// Then in components, add aria-disabled for clarity:
<Button
  disabled={isGenerating || !prompt.trim()}
  aria-disabled={isGenerating || !prompt.trim()}
  title={!prompt.trim() ? 'Please enter a prompt to generate' : ''}
>
  Generate
</Button>
```

**Impact:** MEDIUM - Poor UX and accessibility
**Test Case:** UI should clearly show disabled state

---

### Issue #11: Form Validation Feedback Insufficient

**Severity:** HIGH (User confusion)
**File:** `/src/components/image-studio/ImageStudio.tsx` Lines 300-305

**Current Code:**

```typescript
<Label>Prompt</Label>
<Textarea
  placeholder="Describe your image..."
  className="bg-background/50 focus-visible:ring-primary/30 min-h-[120px] resize-none border-white/5"
  value={prompt}
  onChange={(e) => setPrompt(e.target.value)}
/>
```

**Problems:**

- No character counter
- No validation feedback
- Placeholder text isn't instructions
- No minimum length requirement shown
- Button disabled but user doesn't know why

**Better Implementation:**

```typescript
const maxPromptLength = 1000;
const isPromptValid = prompt.trim().length > 0 && prompt.length <= maxPromptLength;

<div className="space-y-2">
  <div className="flex items-center justify-between">
    <Label>Prompt</Label>
    <span className={cn(
      'text-xs',
      prompt.length > maxPromptLength
        ? 'text-destructive'
        : 'text-muted-foreground'
    )}>
      {prompt.length}/{maxPromptLength}
    </span>
  </div>
  <Textarea
    placeholder="Describe your image..."
    className="bg-background/50 min-h-[120px] resize-none border-white/5"
    value={prompt}
    onChange={(e) => setPrompt(e.target.value)}
    aria-invalid={!isPromptValid}
    aria-describedby="prompt-hint"
  />
  <p id="prompt-hint" className="text-xs text-muted-foreground">
    {prompt.length === 0 ? 'Required: Describe what you want to generate' : ''}
  </p>
</div>

<Button
  disabled={!isPromptValid || isGenerating}
  title={!isPromptValid ? 'Please enter a valid prompt' : ''}
>
  Generate
</Button>
```

**Similar issues in:**

- `/src/components/audio-studio/AudioStudio.tsx` (Line 435)
- `/src/components/video-studio/VideoStudio.tsx` (Line 240)

**Impact:** HIGH - Users unsure why generate button disabled
**Test Case:** Leave prompt empty and verify feedback

---

### Issue #12: Copy-to-Clipboard Without User Feedback

**Severity:** HIGH (Silent failure risk)
**File:** `/src/components/image-studio/ImageStudio.tsx` Lines 200-203

**Current Code:**

```typescript
const data = await response.json();
if (!data.success) throw new Error('Failed to generate share link');

setShareUrl(data.url);
navigator.clipboard.writeText(data.url);
toast.success('Share link copied to clipboard!');
```

**Problems:**

- Clipboard API may be unavailable (not HTTPS)
- Clipboard write may fail silently
- No feedback on button itself
- User may not see toast notification

**Better Implementation:**

```typescript
const handleGenerateShareLink = async () => {
  if (!generatedImage) return;
  setIsGeneratingShare(true);

  try {
    const response = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'image',
        content: { url: generatedImage },
        metadata: { prompt },
      }),
    });

    const data = await response.json();
    if (!data.success) throw new Error('Failed to generate share link');

    setShareUrl(data.url);

    // Try to copy with error handling
    try {
      await navigator.clipboard.writeText(data.url);
      toast.success('Share link copied to clipboard!');
      setIsShared(true);
      setTimeout(() => setIsShared(false), 3000);
    } catch (clipboardErr) {
      console.error('Clipboard write failed:', clipboardErr);
      // Fallback: show link in input for manual copy
      toast.info('Copy the link manually from the dialog');
      // Show dialog with link
    }
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to generate share link');
  } finally {
    setIsGeneratingShare(false);
  }
};
```

**Impact:** MEDIUM - Silent failures when copying links
**Test Case:** Generate share link and verify clipboard functionality

---

## ACCESSIBILITY ISSUES (CRITICAL)

### Issue #13: Missing ARIA Labels on Interactive Elements

**Severity:** CRITICAL (WCAG violation)
**Files:** All studio components

**Example from `/src/components/layout/Sidebar.tsx` Lines 61-77:**

**Current Code:**

```typescript
{navItems.map((item) => (
  <Button
    key={item.id}
    variant="ghost"
    size="icon"
    className={cn('hover:bg-muted h-10 w-full rounded-xl transition-all', ...)}
    onClick={() => onViewChange(item.id as ViewMode)}
    title={item.label}
  >
    <item.icon size={20} />
  </Button>
))}
```

**Problem:**

- Only uses `title` attribute (not read by all screen readers)
- No `aria-label` for screen reader users
- Icon-only button is inaccessible
- No indication of current view to assistive technology

**Correct Implementation:**

```typescript
{navItems.map((item) => (
  <Button
    key={item.id}
    variant="ghost"
    size="icon"
    className={cn('hover:bg-muted h-10 w-full rounded-xl transition-all', ...)}
    onClick={() => onViewChange(item.id as ViewMode)}
    aria-label={item.label}
    aria-current={currentView === item.id ? 'page' : undefined}
    title={item.label}
  >
    <item.icon size={20} aria-hidden="true" />
  </Button>
))}
```

**Required ARIA additions across all components:**

- `aria-label` on all icon buttons
- `aria-current` on active navigation items
- `role="main"` on main content areas
- `role="status"` on loading messages
- `aria-live="polite"` on dynamic updates
- `aria-describedby` on form inputs with help text

**Files needing accessibility audit:**

- `/src/components/layout/` (all)
- `/src/components/image-studio/` (all)
- `/src/components/video-studio/` (all)
- `/src/components/audio-studio/` (all)
- `/src/components/chat/` (all)
- `/src/components/ui/` (all form inputs)

**Impact:** CRITICAL - WCAG 2.1 AA non-compliant
**Test Case:** Navigate with keyboard only and screen reader

---

### Issue #14: No Keyboard Navigation Support

**Severity:** CRITICAL (WCAG violation)
**File:** All studio components

**Example:** `/src/components/image-studio/ImageStudio.tsx`

**Missing implementations:**

- No Escape key to close panels
- No Tab key navigation between inputs
- No Enter key to submit forms
- No arrow keys for selection

**Example Implementation:**

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Generate with Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (prompt.trim() && !isGenerating) {
        handleGenerate();
      }
    }

    // Clear with Escape
    if (e.key === 'Escape') {
      setPrompt('');
      setError(null);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [prompt, isGenerating, handleGenerate]);
```

**Also required:**

- Focus management when opening/closing dialogs
- Tab trap in modal components
- Skip to main content link
- Keyboard shortcut help (⌘K overlay)

**Impact:** CRITICAL - Keyboard-only users cannot use app
**Test Case:** Navigate entire app using only keyboard

---

### Issue #15: Color Contrast Not WCAG AA Compliant

**Severity:** CRITICAL (WCAG violation)
**File:** `/src/components/image-studio/ImageStudio.tsx` Line 352

**Current Code:**

```html
<button className="border-[#4A154B]/20 text-[#4A154B] hover:bg-[#4A154B] hover:text-white"></button>
```

**Problem:**

- `#4A154B` (Slack purple) on light background fails WCAG AA
- Contrast ratio likely < 4.5:1 (required for normal text)
- Users with color blindness cannot see text
- Users with low vision cannot read text

**How to test:**

```javascript
// Contrast ratio = (L1 + 0.05) / (L2 + 0.05) where L is relative luminance
// Need >= 4.5:1 for normal text, >= 3:1 for large text (18pt+)

const getLuminance = (hex) => {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const srgb = [r, g, b].map((x) => {
    x = x / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
};

const getContrast = (color1, color2) => {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

getContrast('#4A154B', '#ffffff'); // Should be >= 4.5
```

**Fixed Implementation:**

```typescript
// Use system colors that meet contrast requirements
<Button
  variant="outline"
  className="gap-2"
  onClick={handleShareToSlack}
>
  Post to Slack
</Button>

// Or if using Slack branding, ensure contrast:
<Button
  style={{
    // Slack color only in background, text must be white
    backgroundColor: '#611F69', // Darker Slack purple
    color: '#ffffff',
  }}
>
  Post to Slack
</Button>
```

**Tools to validate:**

- WebAIM Contrast Checker (webaim.org/resources/contrastchecker/)
- WAVE Chrome extension
- axe DevTools

**All custom colors need audit:**

- Verify against both light and dark backgrounds
- Test with all color blindness types (achromatopsia, deuteranopia, protanopia)

**Impact:** CRITICAL - Non-compliant with WCAG 2.1 AA
**Test Case:** Run WAVE or axe on all pages

---

## MEDIUM PRIORITY ISSUES

### Issue #16: Large Component Files Should Be Decomposed

**Severity:** MEDIUM (Code maintainability)

| File                         | Lines | Recommendation                                    |
| ---------------------------- | ----- | ------------------------------------------------- |
| MusicStudio.tsx              | 742   | Extract SoundBrowser, PatternEditor, MixerPanel   |
| AudioStudio.tsx              | 607   | Extract QwenPanel, VoiceSelector, AudioCanvas     |
| ChatOrchestrator.tsx         | 576   | Extract MessageList, ChatInput, BranchView        |
| MultiModelSelector.tsx       | 565   | Extract ModelCard, ComparisonView                 |
| UnifiedCanvas.tsx            | 442   | Extract ToolBar, PropertyPanel                    |
| TrainingMonitor.tsx          | 435   | Extract JobCard, LossChart, SampleGrid            |
| ImageStudio.tsx              | 400   | Extract PromptPanel, PreviewCanvas                |
| DynamicParameterControls.tsx | 392   | Extract SliderControl, TextControl, SelectControl |

**Recommended split for AudioStudio.tsx:**

```typescript
// File structure:
// - AudioStudio.tsx (orchestrator, ~150 lines)
// - AudioCanvas.tsx (waveform visualization)
// - AudioGenerator.tsx (generation logic)
// - VoicePanel.tsx (voice selection and tuning)
// - QwenPanel.tsx (Qwen-specific features)
// - Composer.tsx (DAW interface)

// Benefits:
// - Easier testing
// - Better code reusability
// - Simpler state management
// - Faster development iteration
```

**Impact:** MEDIUM - Code maintainability
**Test Case:** Components should still work after decomposition

---

### Issue #17: Provider Routing Uses String Matching (Fragile)

**Severity:** MEDIUM (Code maintainability)
**File:** `/src/components/video-studio/VideoStudio.tsx` Lines 62-70

**Current Code:**

```typescript
let provider: 'runway' | 'luma' | 'replicate' | 'openai' | 'google' | 'kling' | 'pika' | 'haiper' =
  'runway';
if (selectedModelId.includes('luma')) provider = 'luma';
if (selectedModelId.includes('replicate') || selectedModelId.includes('minimax'))
  provider = 'replicate';
if (selectedModelId.includes('sora')) provider = 'openai';
if (selectedModelId.includes('veo')) provider = 'google';
if (selectedModelId.includes('kling')) provider = 'kling';
if (selectedModelId.includes('pika')) provider = 'pika';
if (selectedModelId.includes('haiper')) provider = 'haiper';
```

**Problem:**

- Fragile string matching (what if modelId changes?)
- Not maintainable as models added
- Repetitive code
- Easy to introduce bugs

**Better Implementation:**

```typescript
// In lib/models/generation-models.ts
export interface GenerationModel {
  id: string;
  name: string;
  provider: Provider;
  // ... other fields
}

export const GENERATION_MODELS: GenerationModel[] = [
  {
    id: 'luma-photorealistic-4',
    name: 'Luma Photorealistic 4',
    provider: 'luma',
  },
  {
    id: 'runway-gen3',
    name: 'Runway Gen 3',
    provider: 'runway',
  },
  // ...
];

// In component:
const currentModel = getGenerationModelById(selectedModelId);
const provider = currentModel?.provider || 'runway';
```

**Impact:** MEDIUM - Code maintainability
**Test Case:** Add new model and ensure routing works

---

### Issue #18: Progress Display Missing for Long Operations

**Severity:** MEDIUM (UX feedback)
**File:** `/src/components/video-studio/VideoStudio.tsx` Line 94

**Current Code:**

```typescript
setStatus('Processing...');
// ... polling loop
// Status never updates with progress
```

**Better Implementation:**

```typescript
const [progress, setProgress] = useState(0);

// In polling loop:
// Estimate progress based on elapsed time
const elapsedSeconds = (Date.now() - generationStartTime) / 1000;
const estimatedProgress = Math.min(
  (elapsedSeconds / estimatedDuration) * 100,
  95 // Never reach 100 until actually complete
);
setProgress(estimatedProgress);

// In UI:
{isGenerating && (
  <div className="space-y-2">
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>{status}</span>
      <span>{Math.round(progress)}%</span>
    </div>
    <Progress value={progress} />
  </div>
)}
```

**Impact:** LOW - Nice-to-have UX enhancement
**Test Case:** Generate video and watch progress updates

---

### Issue #19: Response.json() Can Fail Without Error Handling

**Severity:** MEDIUM (Error handling)
**File:** Multiple components

**Example from `/src/components/image-studio/ImageStudio.tsx` Line 74:**

```typescript
const data = await response.json();
```

**Problem:**

- If response is not valid JSON, throws error
- Error message unhelpful to user
- No fallback if server returns HTML error page

**Better Implementation:**

```typescript
let data;
try {
  data = await response.json();
} catch (parseErr) {
  console.error('Failed to parse response:', parseErr);
  const text = await response.text();
  throw new Error(`Invalid response format: ${text.slice(0, 100)}`);
}

if (!response.ok) {
  throw new Error(data?.error || `HTTP ${response.status}`);
}
```

**Impact:** MEDIUM - Error handling
**Test Case:** API returns non-JSON response

---

## LOW PRIORITY ISSUES

### Issue #20: Inconsistent Component Styling

**Severity:** LOW (Design system consistency)

| Issue                  | Example                               | Fix                  |
| ---------------------- | ------------------------------------- | -------------------- |
| Padding inconsistency  | `p-4` vs `p-6`                        | Standardize to scale |
| Gap inconsistency      | `gap-1`, `gap-2`, `gap-4`             | Use consistent scale |
| Border opacity         | `border-white/5` vs `border-white/10` | Standardize          |
| Shadow inconsistency   | Custom shadows vs `shadow-lg`         | Use design tokens    |
| Font size magic values | `text-[10px]` vs `text-xs`            | Use semantic sizes   |

**Impact:** LOW - Visual consistency
**Test Case:** All components should follow design system

---

### Issue #21: Console.error Logs Without Context

**Severity:** LOW (Developer experience)
**File:** `/src/components/video-studio/VideoStudio.tsx` Line 144

**Current Code:**

```typescript
catch (err) {
  console.error('Polling error:', err);
}
```

**Better:**

```typescript
catch (err) {
  console.error('[VideoStudio] Polling error:', {
    jobId,
    error: err instanceof Error ? err.message : err,
    timestamp: new Date().toISOString(),
    url: `/api/generate/video/status?jobId=${jobId}`,
  });
}
```

**Impact:** LOW - Developer experience
**Test Case:** Check console logs have proper context

---

### Issue #22: Missing JSDoc Comments on Complex Functions

**Severity:** LOW (Code documentation)

**Example:**

```typescript
const getQwenSpeaker = useCallback(() => {
  // No documentation!
  if (!selectedVoiceId?.startsWith('qwen-')) return 'Aiden';
  // ...
}, [selectedVoiceId]);
```

**Better:**

```typescript
/**
 * Extract Qwen speaker name from voice ID
 * @param voiceId - Voice ID string like 'qwen-vivian'
 * @returns Speaker name for Qwen API, e.g., 'Vivian'
 */
const getQwenSpeaker = useCallback(() => {
  if (!selectedVoiceId?.startsWith('qwen-')) return 'Aiden';
  // ...
}, [selectedVoiceId]);
```

**Impact:** LOW - Code documentation
**Test Case:** JSDoc should appear in IDE tooltips

---

## Summary Table

| ID  | Issue                      | Severity | File               | Lines   | Status |
| --- | -------------------------- | -------- | ------------------ | ------- | ------ |
| 1   | useState with callback     | CRITICAL | AudioStudio.tsx    | 68-70   | OPEN   |
| 2   | Type casting to any        | CRITICAL | WorkflowStudio.tsx | 39-40   | OPEN   |
| 3   | Infinite polling loop      | CRITICAL | ImageStudio.tsx    | 81-104  | OPEN   |
| 4   | Unsafe error assertion     | CRITICAL | ChatInputArea.tsx  | 141-147 | OPEN   |
| 5   | Missing useCallback        | CRITICAL | Shell.tsx          | 311     | OPEN   |
| 6   | Error recovery             | HIGH     | ErrorBoundary.tsx  | 37-40   | OPEN   |
| 7   | API schema fragile         | HIGH     | ImageStudio.tsx    | 74-78   | OPEN   |
| 8   | Missing fetch timeout      | HIGH     | Multiple           | All     | OPEN   |
| 9   | Loading state inconsistent | HIGH     | Multiple           | All     | OPEN   |
| 10  | Disabled button styling    | HIGH     | Multiple           | All     | OPEN   |
| 11  | Form validation feedback   | HIGH     | ImageStudio.tsx    | 300-305 | OPEN   |
| 12  | Clipboard without feedback | HIGH     | ImageStudio.tsx    | 200-203 | OPEN   |
| 13  | Missing ARIA labels        | CRITICAL | All components     | All     | OPEN   |
| 14  | No keyboard navigation     | CRITICAL | All components     | All     | OPEN   |
| 15  | Color contrast fails       | CRITICAL | ImageStudio.tsx    | 352     | OPEN   |
| 16  | Large components           | MEDIUM   | Multiple           | All     | OPEN   |
| 17  | String matching routing    | MEDIUM   | VideoStudio.tsx    | 62-70   | OPEN   |
| 18  | Missing progress display   | MEDIUM   | VideoStudio.tsx    | 94      | OPEN   |
| 19  | JSON parsing error         | MEDIUM   | Multiple           | All     | OPEN   |
| 20  | Styling inconsistency      | LOW      | All                | All     | OPEN   |
| 21  | Console logging            | LOW      | Multiple           | All     | OPEN   |
| 22  | Missing JSDoc              | LOW      | Multiple           | All     | OPEN   |

---

**Report prepared by:** UI Functionality Auditor Agent
**Date:** January 26, 2026
