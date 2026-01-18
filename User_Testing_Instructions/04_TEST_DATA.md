# Test Data & Setup Guide

**Purpose**: Provides sample data, API setup instructions, and test prompts for thorough testing.

---

## 🔑 Required API Keys

### Minimum Setup (Phase 1 Testing)

To test Phase 1 features, you need **at least 2 providers**:

```bash
# .env file - Minimum configuration
OPENAI_API_KEY=sk-...                    # Required (default model)
ANTHROPIC_API_KEY=sk-ant-...             # Recommended (test multi-provider)

# OR

OPENAI_API_KEY=sk-...                    # Required
GEMINI_API_KEY=...                       # Alternative to Anthropic
```

### Recommended Setup (Better Coverage)

For more comprehensive testing:

```bash
# Primary providers (frontier models)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...

# High-speed inference (FREE)
GROQ_API_KEY=...                         # Free, ultra-fast
```

### Full Setup (All 15 Models)

For complete test coverage:

```bash
# --- US Labs ---
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
XAI_API_KEY=...                          # For Grok

# --- Chinese Labs ---
DEEPSEEK_API_KEY=...

# --- High-Speed / Free ---
GROQ_API_KEY=...                         # Free tier available

# --- Universal Proxy ---
OPENROUTER_API_KEY=...                   # Access to Meta, Mistral, etc.

# --- Local Models (Optional) ---
OLLAMA_BASE_URL=http://localhost:11434/api  # If running Ollama
```

### How to Get API Keys

| Provider   | Sign-Up URL                          | Free Tier?      | Notes                 |
| ---------- | ------------------------------------ | --------------- | --------------------- |
| OpenAI     | https://platform.openai.com/api-keys | Yes ($5 credit) | Required for testing  |
| Anthropic  | https://console.anthropic.com/       | Yes ($5 credit) | Highly recommended    |
| Google     | https://aistudio.google.com/apikey   | Yes (free tier) | Large context window  |
| Groq       | https://console.groq.com/keys        | Yes (free)      | Ultra-fast inference  |
| DeepSeek   | https://platform.deepseek.com/       | Yes             | Cheap reasoning model |
| OpenRouter | https://openrouter.ai/keys           | Pay-as-you-go   | Access to many models |
| xAI        | https://x.ai/api                     | Beta access     | For Grok models       |

---

## 📝 Test Prompts

### Basic Functionality Tests

Use these prompts to test basic chat functionality:

```
1. "Hello! Please introduce yourself and tell me what you can do."

2. "What is your knowledge cutoff date?"

3. "Can you help me write a short poem about testing software?"

4. "Explain how React hooks work in simple terms."

5. "What are the main differences between TypeScript and JavaScript?"
```

### Model Identification Tests

Use these to verify which model is responding:

```
1. "What model are you? Please be specific."

2. "Who created you? What company or organization?"

3. "What are your capabilities? Can you see images? Can you call functions?"

4. "What is your context window size?"
```

Expected responses:

- **OpenAI models**: "I'm GPT-5/GPT-4.5..." → "I was created by OpenAI"
- **Anthropic models**: "I'm Claude..." → "I was created by Anthropic"
- **Google models**: "I'm Gemini..." → "I was created by Google"
- **DeepSeek models**: "I'm DeepSeek..." → "I was created by DeepSeek"

### Rate Limiting Tests

Send these rapidly to trigger rate limits (if applicable):

```
Send 10 quick messages within 10 seconds:

1. "Test 1"
2. "Test 2"
3. "Test 3"
... continue to 10
```

Expected: Retry logic should kick in, exponential backoff observed.

### Long Context Tests

For testing large context windows:

```
"I'm going to give you a long list and then ask you to remember something from the beginning.

[Copy 2000+ words of lorem ipsum or article text]

Now, what was the very first sentence I sent you?"
```

This tests:

- Context window handling
- Model memory across long conversations

---

## 🧪 Sample Conversations

### Scenario 1: Model Comparison

**Objective**: Compare responses from different models.

**Steps**:

1. Create thread with GPT-5
2. Ask: "Explain quantum computing in one paragraph."
3. Create thread with Claude 4.5 Opus
4. Ask same question
5. Create thread with Gemini 2.5 Pro
6. Ask same question
7. Compare responses

**Expected**: Different writing styles, explanations, but all accurate.

---

### Scenario 2: Model Switching

**Objective**: Test model switching within one conversation.

**Thread Timeline**:

```
[GPT-5]     "Hello! Start by telling me about yourself."
[GPT-5]     Response: "I'm GPT-5 by OpenAI..."

[Switch to Claude]

[Claude]    "Now what model are you?"
[Claude]    Response: "I'm Claude, made by Anthropic..."

[Switch to Gemini]

[Gemini]    "And now?"
[Gemini]    Response: "I'm Gemini by Google..."
```

**Verify**:

- Each response uses the correct model
- Conversation history preserved
- Model switches visible in UI

---

### Scenario 3: Multi-Turn Conversation

**Objective**: Test long-form conversation handling.

**Conversation Flow**:

```
User: "Let's write a story together. I'll start: 'Once upon a time in a small village...'"
AI: [Continues story]

User: "Great! Now add a twist where the main character discovers a secret."
AI: [Adds twist]

User: "Perfect! Can you summarize what we've written so far?"
AI: [Summarizes]

User: "Now write the ending."
AI: [Writes ending]
```

**Verify**:

- Model remembers earlier parts of story
- Coherent narrative throughout
- Summary is accurate

---

## 📊 Expected API Responses

### Successful Chat Request

```json
POST /api/chat
Request:
{
  "messages": [
    { "role": "user", "content": "Hello", "id": "msg-123" }
  ],
  "modelId": "gpt-4.5-turbo",
  "providerId": "openai"
}

Response:
Status: 200 OK
Content-Type: text/event-stream
Body: [Streaming chunks]
0:"Hello"
1:"!"
2:" I'm"
3:" GPT"
4:"-4.5"
...
```

### Invalid Model Request

```json
POST /api/chat
Request:
{
  "messages": [...],
  "modelId": "fake-model",
  "providerId": "fake-provider"
}

Response:
Status: 400 Bad Request
Body:
{
  "error": "Model not found",
  "message": "Model \"fake-model\" from provider \"fake-provider\" is not supported",
  "supportedModels": [
    { "providerId": "openai", "modelId": "gpt-5", "name": "GPT-5" },
    { "providerId": "openai", "modelId": "o3", "name": "o3 (Reasoning)" },
    ...
  ]
}
```

### Rate Limit Response

```json
Response:
Status: 429 Too Many Requests
Headers:
  Retry-After: 5

Body:
{
  "error": "Rate limited",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 5
}
```

---

## 💾 Sample localStorage Data

### Fresh Install (v2)

```json
{
  "state": {
    "threads": {
      "uuid-1": {
        "id": "uuid-1",
        "title": "New Conversation",
        "rootId": null,
        "messages": {},
        "currentLeafId": null,
        "createdAt": 1737158400000,
        "updatedAt": 1737158400000,
        "modelId": "gpt-4.5-turbo",
        "providerId": "openai"
      }
    },
    "activeThreadId": "uuid-1"
  },
  "version": 2
}
```

### Multi-Thread Example

```json
{
  "state": {
    "threads": {
      "thread-1": {
        "modelId": "gpt-5",
        "providerId": "openai",
        "title": "GPT-5 Test"
      },
      "thread-2": {
        "modelId": "claude-opus-4.5",
        "providerId": "anthropic",
        "title": "Claude Test"
      },
      "thread-3": {
        "modelId": "gemini-2.5-pro",
        "providerId": "google",
        "title": "Gemini Test"
      }
    },
    "activeThreadId": "thread-2"
  },
  "version": 2
}
```

---

## 🎬 VideoStudio Test Data

### Sample Models to Test

```javascript
// Test each of these in sequence
const videoModelsToTest = [
  'runway-gen3-alpha', // Default
  'luma-dream-machine', // Fast switching
  'kling-pro', // Different tier
  'sora-preview', // Experimental
  'svd-xt', // Local model
];
```

### Expected localStorage (Video)

```json
{
  "state": {
    "clips": [],
    "currentTime": 0,
    "selectedClipId": null,
    "startFrame": null,
    "endFrame": null,
    "camera": { "pan": { "x": 0, "y": 0 }, "zoom": 0, "tilt": 0, "roll": 0 },
    "duration": 4,
    "tunes": { "stability": 0, "amplitude": 0, "coherence": 0 },
    "seed": -1,
    "loopMode": false,
    "interpolate": true,
    "selectedModelId": "luma-dream-machine" // ← Should persist
  },
  "version": 0
}
```

---

## 🔍 Console Commands for Testing

### Check Active Thread Model

```javascript
// View current thread's model
const storage = JSON.parse(localStorage.getItem('chat-storage'));
const activeId = storage.state.activeThreadId;
const activeThread = storage.state.threads[activeId];

console.log({
  threadId: activeId,
  title: activeThread.title,
  modelId: activeThread.modelId,
  providerId: activeThread.providerId,
});
```

### List All Threads

```javascript
const storage = JSON.parse(localStorage.getItem('chat-storage'));
Object.values(storage.state.threads).forEach((t) => {
  console.log(`📝 "${t.title}" → ${t.modelId} (${t.providerId})`);
});
```

### Simulate v1 Data (Migration Testing)

```javascript
// Create old version data without modelId/providerId
const v1Data = {
  state: {
    threads: {
      'old-thread': {
        id: 'old-thread',
        title: 'Legacy Thread',
        rootId: null,
        messages: {},
        currentLeafId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        // NO modelId or providerId
      },
    },
    activeThreadId: 'old-thread',
  },
  version: 1,
};

localStorage.setItem('chat-storage', JSON.stringify(v1Data));
location.reload(); // Trigger migration
```

### Force Specific Model

```javascript
// Temporarily force a model for testing
const storage = JSON.parse(localStorage.getItem('chat-storage'));
const activeId = storage.state.activeThreadId;
storage.state.threads[activeId].modelId = 'deepseek-reasoner';
storage.state.threads[activeId].providerId = 'deepseek';
localStorage.setItem('chat-storage', JSON.stringify(storage));
location.reload();
```

---

## 📋 Test Account Setup

### Recommended Test Users

Create these test "personas" for thorough testing:

1. **Fresh User**
   - Clear cache and localStorage
   - Never visited app before
   - Tests: Default experience, onboarding

2. **Power User**
   - 10+ threads with different models
   - Long conversation histories
   - Tests: Performance, multi-threading

3. **Legacy User**
   - Simulate v1 data (see console command above)
   - Tests: Migration, backwards compatibility

4. **Limited API Keys**
   - Only OPENAI_API_KEY configured
   - Tests: Graceful degradation, error messages

---

## 🎯 Success Criteria Reference

After running tests with this data, verify:

- ✅ All API calls succeed with correct keys
- ✅ Models respond appropriately to prompts
- ✅ Model identification prompts return expected responses
- ✅ localStorage matches expected structure
- ✅ No console errors during normal operation

**Ready to Test**: All test data and setup complete!
