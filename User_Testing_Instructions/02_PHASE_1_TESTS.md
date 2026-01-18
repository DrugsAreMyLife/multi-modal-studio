# Phase 1 Model Selection - Test Cases

**Test Suite**: Phase 1 Implementation
**Features Tested**: VideoStudio Model Selection, Chat API Routing, useChatWithModel Hook
**Estimated Time**: 15 minutes

---

## Test 2.1: VideoStudio Model Selection & Persistence

**Objective**: Verify that VideoStudio model selection works and persists across page refreshes.

### Prerequisites

- Navigate to VideoStudio section
- Development server running

### Test Steps

1. **Navigate to VideoStudio**
   - Click "Video" tab/section in main navigation
   - VideoStudio interface should load

2. **Locate Model Selector**
   - Look for "Generation Model" dropdown
   - Should show current selection (default: "Runway Gen-3 Alpha")

3. **Open Model Dropdown**
   - Click the model selector button
   - Dropdown should display 11 video models:
     - Runway Gen-3 Alpha ✅ (default)
     - Luma Dream Machine
     - Kling 1.0 (Pro)
     - Hailuo (MiniMax)
     - Sora (Preview)
     - Stable Video Diffusion XT
     - Pika Labs 1.5
     - Stability Video
     - Genmo Mochi
     - PixVerse V2
     - Haiper 1.5

4. **Verify Model Metadata Display**
   - Each model should show:
     - ✅ Model name
     - ✅ Tier (ULTRA, PRO, STANDARD, EXPERIMENTAL)
     - ✅ Provider (cloud/local icon)
     - ✅ Max duration (e.g., "10s Max")

5. **Select Different Model**
   - Click "Luma Dream Machine"
   - Dropdown should close
   - UI should update to show "Luma Dream Machine" as selected

6. **Check localStorage**

   ```javascript
   // In browser console
   const videoStorage = JSON.parse(localStorage.getItem('video-studio-storage'));
   console.log('Selected model:', videoStorage.state.selectedModelId);
   // Should output: "luma-dream-machine"
   ```

7. **Refresh Page (F5)**
   - Page reloads
   - Navigate back to VideoStudio if needed
   - Verify "Luma Dream Machine" is still selected
   - Dropdown should highlight Luma when opened

8. **Test Multiple Selections**
   - Select "Kling 1.0 (Pro)"
   - Refresh page
   - Verify persistence
   - Select "Runway Gen-3 Alpha" again
   - Refresh
   - Should return to Runway

### Expected Results

✅ **PASS Criteria**:

- All 11 video models display in dropdown
- Model metadata (tier, duration) shows correctly
- Selecting a model updates UI immediately
- selectedModelId is saved to localStorage
- Page refresh preserves selection
- Multiple selection changes persist correctly

❌ **FAIL Criteria**:

- Missing models in dropdown
- Selection doesn't persist after refresh
- localStorage not updated
- UI doesn't update on selection
- Wrong model metadata

### Visual Reference

```
┌──────────────────────────────────────────┐
│ Generation Model                         │
│ ┌────────────────────────────────────┐  │
│ │ [Film Icon] Luma Dream Machine  ▼ │  │
│ │ PRO • cloud                        │  │
│ └────────────────────────────────────┘  │
│                                          │
│ Dropdown:                                │
│ ┌────────────────────────────────────┐  │
│ │ [Film] Runway Gen-3 Alpha          │  │
│ │       ULTRA • 10s Max              │  │
│ ├────────────────────────────────────┤  │
│ │ [Film] Luma Dream Machine    ✓    │  │ ← Selected
│ │       PRO • 5s Max                 │  │
│ ├────────────────────────────────────┤  │
│ │ [Film] Kling 1.0 (Pro)             │  │
│ │       PRO • 10s Max                │  │
│ └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

---

## Test 2.2: Chat API Dynamic Model Routing

**Objective**: Verify that the Chat API correctly routes requests to different model providers.

### Prerequisites

- API keys for at least 2 providers (e.g., OPENAI_API_KEY + ANTHROPIC_API_KEY)
- Network tab open in DevTools

### Test Steps

1. **Test Default Model (OpenAI)**
   - Create new chat thread
   - Send message: "Hello"
   - Open Network tab
   - Find POST request to `/api/chat`

2. **Inspect Request Payload**
   - Click the request
   - Go to "Payload" or "Request" tab
   - Verify request body contains:
     ```json
     {
       "messages": [...],
       "modelId": "gpt-4.5-turbo",
       "providerId": "openai"
     }
     ```

3. **Verify Server Response**
   - Response should be streaming (status 200)
   - Content-Type: `text/event-stream` or `text/plain; charset=utf-8`
   - Response should contain AI-generated text

4. **Test Anthropic Model**
   - Switch model to "Claude 4.5 Sonnet"
   - Send message: "What model are you?"
   - Check Network tab for new `/api/chat` request

5. **Inspect Anthropic Request**
   - Payload should show:
     ```json
     {
       "messages": [...],
       "modelId": "claude-sonnet-4.5",
       "providerId": "anthropic"
     }
     ```

6. **Test Google Model** (if API key available)
   - Switch to "Gemini 2.5 Flash"
   - Send message
   - Verify payload:
     ```json
     {
       "modelId": "gemini-2.5-flash",
       "providerId": "google"
     }
     ```

7. **Test Invalid Model**
   - Open browser console
   - Make manual API call:
     ```javascript
     fetch('/api/chat', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         messages: [{ role: 'user', content: 'Hi' }],
         modelId: 'invalid-model-xyz',
         providerId: 'fake-provider',
       }),
     })
       .then((r) => r.json())
       .then(console.log);
     ```
   - Should return 400 error with helpful message

### Expected Results

✅ **PASS Criteria**:

- Request payload includes correct modelId and providerId
- Different models route to correct providers
- Server creates appropriate model instance
- Streaming responses work for all models
- Invalid models return 400 with error message
- Error message lists supported models

❌ **FAIL Criteria**:

- Missing modelId or providerId in request
- Wrong provider used for model
- Invalid models don't return error
- Streaming fails
- No error message for invalid models

### Network Tab Reference

```
Request URL: http://localhost:3000/api/chat
Request Method: POST
Status Code: 200 OK

Request Payload:
{
  "messages": [
    { "role": "user", "content": "Hello", "id": "..." }
  ],
  "modelId": "claude-sonnet-4.5",
  "providerId": "anthropic"
}

Response Headers:
Content-Type: text/event-stream
Transfer-Encoding: chunked

Response Body:
0:"..."
1:"Hello"
2:"!"
...
```

---

## Test 2.3: Chat Model Switching Mid-Conversation

**Objective**: Verify that users can switch models in the middle of a conversation.

### Prerequisites

- Fresh chat thread
- Multiple API keys configured

### Test Steps

1. **Start Conversation with GPT-5**
   - Create new thread
   - Select "GPT-5" from dropdown
   - Send: "Hello, please introduce yourself"
   - Wait for response

2. **Switch to Claude Mid-Conversation**
   - Click model dropdown
   - Select "Claude 4.5 Opus"
   - Verify header updates to "Claude 4.5 Opus"
   - Send: "What model are you?"
   - Response should say Claude/Anthropic

3. **Switch to Gemini**
   - Select "Gemini 2.5 Pro"
   - Send: "And now what model are you?"
   - Response should mention Gemini/Google

4. **Verify Conversation History Preserved**
   - Scroll up to previous messages
   - All messages should still be visible
   - Thread should show mixed responses from different models

5. **Test Thread Switching**
   - Create second thread
   - Use different model (e.g., DeepSeek R1)
   - Switch back to first thread
   - Verify model reverts to last used in that thread

6. **Check localStorage for Both Threads**
   ```javascript
   const storage = JSON.parse(localStorage.getItem('chat-storage'));
   const threads = storage.state.threads;
   Object.values(threads).forEach((t) => {
     console.log(`Thread "${t.title}": ${t.modelId} (${t.providerId})`);
   });
   ```

### Expected Results

✅ **PASS Criteria**:

- Model can be switched at any point in conversation
- New messages use newly selected model
- Previous messages remain in history
- Each thread maintains independent model selection
- UI updates immediately on model change
- No loss of conversation history

❌ **FAIL Criteria**:

- Cannot switch models mid-conversation
- Model change doesn't take effect
- Conversation history is lost
- Threads interfere with each other's models
- UI doesn't update

### Conversation Flow Reference

```
Thread 1 Timeline:

[GPT-5]     User: "Hello, introduce yourself"
[GPT-5]     AI: "I'm GPT-5 by OpenAI..."

[Switch to Claude 4.5 Opus]

[Claude]    User: "What model are you?"
[Claude]    AI: "I'm Claude, made by Anthropic..."

[Switch to Gemini 2.5 Pro]

[Gemini]    User: "And now what model are you?"
[Gemini]    AI: "I'm Gemini by Google..."

✅ All messages preserved in history
✅ Each response uses the model active at that time
```

---

## Test 2.4: useChatWithModel Hook Integration

**Objective**: Verify that the custom hook correctly injects model parameters into all requests.

### Prerequisites

- Browser DevTools Console open
- React DevTools installed (optional but helpful)

### Test Steps

1. **Monitor Hook Behavior**
   - Open browser console
   - Add logging to track hook calls (optional, or just observe Network tab)

2. **Send Message with Default Model**
   - New thread (default: GPT-4.5 Turbo)
   - Send: "Test message 1"
   - Check Network tab → POST /api/chat
   - Verify payload has: `modelId: "gpt-4.5-turbo"`, `providerId: "openai"`

3. **Send Message with Custom Model**
   - Switch to "DeepSeek R1 (Reasoning)"
   - Send: "Test message 2"
   - Check Network tab
   - Verify payload has: `modelId: "deepseek-reasoner"`, `providerId: "deepseek"`

4. **Test Hook Re-renders**
   - Switch models rapidly (3-4 times within 5 seconds)
   - Send message after each switch
   - Verify:
     - No infinite re-render loops
     - Each message uses correct model
     - UI remains responsive

5. **Test with File Attachments** (if implemented)
   - Send message with attachment
   - Verify payload includes:
     - `modelId` and `providerId`
     - File attachment data
     - All other expected fields

6. **Verify useMemo Usage**
   ```javascript
   // In browser console (if React DevTools available)
   // Check that enhancedSendMessage is memoized
   // This prevents infinite loops
   ```

### Expected Results

✅ **PASS Criteria**:

- All messages include modelId and providerId
- Hook correctly wraps AI SDK's useChat
- No infinite re-render loops
- Model parameters injected even with attachments
- useMemo prevents unnecessary re-creations
- UI remains smooth and responsive

❌ **FAIL Criteria**:

- Messages missing modelId or providerId
- Infinite re-render loops
- Hook doesn't inject parameters
- Performance degradation
- Browser freezes or crashes

---

## Test 2.5: Model Dropdown UI/UX

**Objective**: Verify that the model selector dropdown is user-friendly and intuitive.

### Prerequisites

- Fresh browser session

### Test Steps

1. **Visual Design Check**
   - Dropdown should be visually appealing
   - Text should be readable
   - Icons should be clear
   - Sections should be well-organized

2. **Organization Verification**
   - Models grouped by provider (OpenAI, Anthropic, Google, Other)
   - Each section has header label
   - Sections separated by dividers

3. **Model Information Display**
   - Each model shows:
     - Name (large text)
     - Context window with comma separator
     - Pricing (or "Free")
   - Example: "Gemini 2.5 Pro" | "1,000,000 ctx • $0.00125/1K"

4. **Current Selection Highlight**
   - Currently selected model has different background (accent color)
   - Easy to identify at a glance

5. **Interaction Testing**
   - Click dropdown → Opens smoothly
   - Click model → Closes and updates
   - Click outside → Closes without selecting
   - Keyboard navigation (up/down arrows) works

6. **Responsiveness**
   - Dropdown width appropriate (not too wide/narrow)
   - Scrollable if needed (though 15 models should fit)
   - Doesn't overflow screen boundaries

### Expected Results

✅ **PASS Criteria**:

- Clean, professional UI design
- Clear organization by provider
- All model info visible and readable
- Current selection easily identifiable
- Smooth interactions (open/close/select)
- Responsive to window size
- Accessible (keyboard navigation works)

❌ **FAIL Criteria**:

- Cluttered or confusing layout
- Missing model information
- Hard to identify current selection
- Interaction bugs (won't close, etc.)
- UI overflow or layout breaking
- Not accessible

---

## Summary Checklist

After completing all Phase 1 tests, verify:

- [ ] VideoStudio model selection persists (Test 2.1)
- [ ] Chat API routes to correct providers (Test 2.2)
- [ ] Model switching works mid-conversation (Test 2.3)
- [ ] useChatWithModel hook injects parameters (Test 2.4)
- [ ] Model dropdown UI is user-friendly (Test 2.5)

**All tests passed?** ✅ Proceed to Integration tests
**Some tests failed?** ❌ Report issues using bug template

---

**Phase 1 Completion**: If all tests pass, Phase 1 is production-ready! 🎉
