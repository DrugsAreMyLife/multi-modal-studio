# Phase 0 Critical Features - Test Cases

**Test Suite**: Phase 0 Implementation
**Features Tested**: Model Metadata, Rate Limiting, Prototype Badges, ChatThread Persistence
**Estimated Time**: 20 minutes

---

## Test 1.1: Model Metadata Display

**Objective**: Verify that all model metadata (pricing, context window, capabilities) displays correctly in the UI.

### Prerequisites

- Development server running
- Browser DevTools open

### Test Steps

1. **Open Chat Interface**
   - Navigate to http://localhost:3000
   - Click on the chat/conversation area

2. **Open Model Selector**
   - Click the "Model: GPT-4.5 Turbo ▼" button in the top-left
   - Dropdown menu should appear

3. **Verify Model Display**
   - Check that all models show:
     - ✅ Model name (e.g., "GPT-5")
     - ✅ Context window (e.g., "256,000 ctx")
     - ✅ Pricing (e.g., "$0.03/1K" or "Free")
   - Verify models are grouped by provider:
     - ✅ OPENAI section
     - ✅ ANTHROPIC section
     - ✅ GOOGLE section
     - ✅ OTHER PROVIDERS section

4. **Verify Metadata Accuracy**
   - **GPT-5**: 256,000 ctx • $0.03/1K
   - **Claude 4.5 Opus**: 200,000 ctx • $0.015/1K
   - **Gemini 2.5 Pro**: 1,000,000 ctx • $0.00125/1K
   - **DeepSeek R1**: 64,000 ctx • $0.00055/1K
   - **Groq models**: Should show "Free"

### Expected Results

✅ **PASS Criteria**:

- All 15 models display with complete metadata
- Pricing is accurate and formatted correctly
- Context windows use comma separators (e.g., "1,000,000")
- Free models show "Free" instead of "$0/1K"
- Models are grouped logically by provider

❌ **FAIL Criteria**:

- Missing model metadata
- Incorrect pricing or context window
- Models not grouped by provider
- UI rendering issues

### Screenshot Reference

![Model Dropdown](screenshots/model-dropdown.png)

---

## Test 1.2: Model Capabilities Verification

**Objective**: Verify that model capabilities (vision, function calling, JSON mode) are tracked correctly.

### Prerequisites

- Browser DevTools Console open

### Test Steps

1. **Open Browser Console**
   - Press F12 or Cmd+Option+I
   - Go to Console tab

2. **Query Model Capabilities**

   ```javascript
   // Run in browser console
   const models =
     window.__SUPPORTED_MODELS__ ||
     (await import('/src/lib/models/supported-models.ts')).SUPPORTED_MODELS;

   // Check a few models
   console.table(
     models.map((m) => ({
       name: m.name,
       vision: m.capabilities.vision,
       functionCalling: m.capabilities.functionCalling,
       jsonMode: m.capabilities.jsonMode,
       streaming: m.capabilities.streaming,
     })),
   );
   ```

3. **Verify Expected Capabilities**
   - **GPT-5**: vision ✅, functionCalling ✅, jsonMode ✅, streaming ✅
   - **Claude 4.5 Opus**: vision ✅, functionCalling ✅, jsonMode ✅, streaming ✅
   - **Gemini 2.5 Pro**: vision ✅, functionCalling ✅, jsonMode ✅, streaming ✅
   - **DeepSeek R1**: vision ❌, functionCalling ✅, jsonMode ✅, streaming ✅

### Expected Results

✅ **PASS Criteria**:

- All models have capabilities object
- Vision support correctly marked (frontier models have it)
- Function calling enabled for all models
- JSON mode enabled for all models
- Streaming enabled for all models

---

## Test 1.3: Rate Limiting & Retry Logic

**Objective**: Verify that rate limiting triggers retry logic with exponential backoff.

### Prerequisites

- API key with rate limits (or ability to simulate 429 responses)
- Network tab open in DevTools

### Test Steps

#### Option A: Real Rate Limit (If Available)

1. **Send Rapid Messages**
   - Open chat interface
   - Send multiple messages rapidly (5-10 messages within 10 seconds)
   - Watch for rate limit error

2. **Observe Retry Behavior**
   - Check Network tab for 429 responses
   - Look for retry attempts (up to 3 retries)
   - Verify exponential backoff delays:
     - 1st retry: ~1 second delay
     - 2nd retry: ~2 second delay
     - 3rd retry: ~4 second delay

#### Option B: Simulated Rate Limit (Mock)

1. **Modify API Route Temporarily**

   ```typescript
   // In src/app/api/chat/route.ts (temporary)
   export async function POST(req: Request) {
     // Force rate limit for testing
     return new Response(JSON.stringify({ error: 'Rate limited', retryAfter: 5 }), {
       status: 429,
       headers: { 'Retry-After': '5' },
     });
   }
   ```

2. **Send Message**
   - Send any message in chat
   - Should see retry attempts in console

3. **Restore Original Code**
   - Remove the test code after testing

### Expected Results

✅ **PASS Criteria**:

- 429 responses trigger retry logic
- Exponential backoff delays observed (1s → 2s → 4s)
- After 3 retries, user sees error message
- Error message is user-friendly: "Rate limit exceeded. Please try again later."
- Retry-After header is respected if present

❌ **FAIL Criteria**:

- No retry attempts on 429
- Immediate failure without backoff
- Infinite retry loop
- Unclear error message

### Console Output Reference

```
⚠️ Rate limited. Retrying in 1000ms... (attempt 1/3)
⚠️ Rate limited. Retrying in 2000ms... (attempt 2/3)
⚠️ Rate limited. Retrying in 4000ms... (attempt 3/3)
❌ RateLimitError: Rate limit exceeded. Please try again later.
```

---

## Test 1.4: Prototype Badge Indicators

**Objective**: Verify that prototype integrations show badges and have disabled connect buttons.

### Prerequisites

- Navigate to Integrations settings page

### Test Steps

1. **Open Integrations Page**
   - Click "Settings" in sidebar (if available)
   - OR navigate directly to integrations component
   - Look for StockAssetBrowser or IntegrationSettings component

2. **Identify Prototype Integrations**
   - Look for integrations with 🔧 "Prototype" badge
   - Expected prototypes:
     - ✅ YouTube Publisher
     - ✅ Slack Notifier

3. **Verify Badge Appearance**
   - Badge should be amber/yellow color
   - Text should say "Prototype"
   - Wrench icon (🔧) should be visible
   - Hover tooltip should explain: "This integration is not yet connected. Full functionality coming soon."

4. **Verify Button State**
   - "Connect" button should be disabled (grayed out)
   - Button should have reduced opacity
   - Clicking should do nothing

5. **Verify Working Integrations**
   - Non-prototype integrations (Unsplash, Pexels) should NOT have badge
   - Their "Connect" buttons should be enabled

### Expected Results

✅ **PASS Criteria**:

- Prototype badge appears on YouTube & Slack
- Badge is amber/yellow with wrench icon
- Tooltip explains prototype status
- Connect button is disabled for prototypes
- Connect button is enabled for working integrations
- Visual distinction is clear

❌ **FAIL Criteria**:

- Missing badges on prototypes
- Prototype integrations allow connection
- Wrong integrations marked as prototype
- No visual distinction

### Visual Reference

**Correct Display**:

```
┌─────────────────────────────────────┐
│ YouTube Publisher [🔧 Prototype]    │
│ Publish videos to YouTube           │
│                                      │
│ [Connect] ← DISABLED (grayed out)   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Unsplash                             │
│ Search free high-quality images     │
│                                      │
│ [Connect] ← ENABLED (clickable)     │
└─────────────────────────────────────┘
```

---

## Test 1.5: ChatThread Model Persistence

**Objective**: Verify that chat threads remember their selected model after page refresh.

### Prerequisites

- Browser with localStorage support
- Development server running

### Test Steps

1. **Create New Thread**
   - Open chat interface
   - Verify default model is "GPT-4.5 Turbo"

2. **Switch Model**
   - Click model dropdown
   - Select "Claude 4.5 Sonnet"
   - Verify header updates to show "Claude 4.5 Sonnet"

3. **Send Message**
   - Type: "Hello, what model are you?"
   - Send message
   - Verify response comes from Claude (check API call in Network tab)

4. **Refresh Page**
   - Press F5 or Cmd+R
   - Wait for page to reload

5. **Verify Model Persisted**
   - Thread should still show "Claude 4.5 Sonnet" in header
   - Model dropdown should highlight Claude when opened
   - Next message should use Claude (not reset to default)

6. **Check localStorage**
   ```javascript
   // In browser console
   const chatStorage = JSON.parse(localStorage.getItem('chat-storage'));
   console.log(
     'Active thread model:',
     chatStorage.state.threads[chatStorage.state.activeThreadId]?.modelId,
   );
   ```

   - Should output: "claude-sonnet-4.5"

### Expected Results

✅ **PASS Criteria**:

- Model selection persists across page refresh
- localStorage contains correct modelId
- Subsequent messages use the selected model
- UI displays correct model after refresh
- No regression to default model

❌ **FAIL Criteria**:

- Model resets to default after refresh
- localStorage is empty or incorrect
- UI shows wrong model
- API calls use wrong model

---

## Test 1.6: Multi-Thread Model Independence

**Objective**: Verify that different threads can use different models simultaneously.

### Prerequisites

- Ability to create multiple threads

### Test Steps

1. **Create Thread 1**
   - Create new conversation
   - Select "GPT-5"
   - Send message: "What model are you?"

2. **Create Thread 2**
   - Create another new conversation
   - Select "Gemini 2.5 Pro"
   - Send message: "What model are you?"

3. **Switch Between Threads**
   - Switch back to Thread 1
   - Verify header shows "GPT-5"
   - Switch to Thread 2
   - Verify header shows "Gemini 2.5 Pro"

4. **Send Messages**
   - In Thread 1: Send another message → Should use GPT-5
   - In Thread 2: Send another message → Should use Gemini

5. **Refresh Page**
   - Refresh browser
   - Switch between threads
   - Verify each thread remembers its model

### Expected Results

✅ **PASS Criteria**:

- Each thread maintains independent model selection
- Switching threads updates UI to show correct model
- Messages use the thread's selected model
- Refresh preserves all thread models
- No model bleed between threads

---

## Summary Checklist

After completing all Phase 0 tests, verify:

- [ ] Model metadata displays correctly (Test 1.1)
- [ ] Model capabilities are accurate (Test 1.2)
- [ ] Rate limiting triggers retry logic (Test 1.3)
- [ ] Prototype badges appear and function correctly (Test 1.4)
- [ ] Chat thread model persists after refresh (Test 1.5)
- [ ] Multiple threads maintain independent models (Test 1.6)

**All tests passed?** ✅ Proceed to Phase 1 tests
**Some tests failed?** ❌ Report issues using bug template
