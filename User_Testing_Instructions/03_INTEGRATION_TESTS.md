# Integration & End-to-End Tests

**Test Suite**: Cross-Feature Integration
**Features Tested**: Complete user journeys, state persistence, error handling
**Estimated Time**: 10 minutes

---

## Test 3.1: Complete User Journey - New User

**Objective**: Test the complete flow for a brand new user from first visit to conversation.

### Test Scenario

Simulating a user who has never visited the app before.

### Prerequisites

- Clear browser cache and localStorage
- Fresh browser session (incognito/private mode recommended)
- At least OPENAI_API_KEY configured

### Test Steps

1. **First Visit**
   - Navigate to http://localhost:3000
   - Page should load successfully
   - Default UI state should be clean

2. **Automatic Thread Creation**
   - Chat interface should be visible
   - A default thread should be auto-created
   - Thread title: "New Conversation"
   - Model: "GPT-4.5 Turbo" (default)

3. **First Message**
   - Type: "Hello! This is my first message."
   - Click Send or press Enter
   - Message should appear in chat
   - AI should respond
   - Thread title should auto-update (if title generation implemented)

4. **Model Exploration**
   - Click model dropdown
   - Browse available models
   - Select a different model (e.g., "Claude 4.5 Sonnet")
   - Send another message
   - Verify it uses new model

5. **Create Second Thread**
   - Click "New Chat" or similar button
   - New thread created
   - Should default to "GPT-4.5 Turbo" again
   - Previous thread preserved

6. **Switch Between Threads**
   - Switch to first thread
   - Should show Claude as selected model
   - Switch to second thread
   - Should show GPT-4.5 Turbo
   - Messages preserved in both

7. **Refresh & Verify Persistence**
   - Refresh page (F5)
   - All threads should still exist
   - Model selections preserved
   - Conversation history intact

### Expected Results

✅ **PASS Criteria**:

- Smooth onboarding experience
- Default thread auto-created
- First message works without setup
- Can explore and switch models easily
- Multiple threads work independently
- All data persists after refresh
- No errors in console

❌ **FAIL Criteria**:

- Errors on first load
- No default thread created
- Cannot send first message
- Model switching doesn't work
- Data lost on refresh
- Console errors

---

## Test 3.2: Multi-Tab Synchronization

**Objective**: Verify that model selection syncs across multiple browser tabs.

### Prerequisites

- Development server running
- Ability to open multiple tabs

### Test Steps

1. **Open Tab 1**
   - Navigate to app
   - Create thread with "GPT-5"
   - Send message

2. **Open Tab 2**
   - Same browser, new tab
   - Navigate to same app URL
   - Open same thread (should sync via localStorage)

3. **Change Model in Tab 1**
   - Switch to "Gemini 2.5 Pro" in Tab 1
   - Send message

4. **Refresh Tab 2**
   - Go to Tab 2
   - Refresh (F5)
   - Check model selection
   - Should show "Gemini 2.5 Pro"

5. **Change Model in Tab 2**
   - Switch to "Claude 4.5 Opus" in Tab 2
   - Refresh Tab 1
   - Should show "Claude 4.5 Opus"

### Expected Results

✅ **PASS Criteria**:

- Both tabs read from same localStorage
- Refreshing a tab picks up changes from other tab
- No data conflicts or corruption
- Last write wins (expected behavior)

⚠️ **Expected Limitation**:

- Real-time sync without refresh not implemented (would need BroadcastChannel API)
- This is acceptable for MVP

❌ **FAIL Criteria**:

- Tabs show different data after refresh
- localStorage corruption
- One tab's changes overwrite the other unpredictably

---

## Test 3.3: Error Handling & Recovery

**Objective**: Verify graceful error handling in various failure scenarios.

### Test Scenarios

#### Scenario A: Missing API Key

1. **Remove API Key**
   - Stop server
   - Remove OPENAI_API_KEY from .env
   - Restart server

2. **Attempt Message**
   - Select GPT model
   - Send message
   - Should see error (not a crash)
   - Error message should be helpful

3. **Add Key & Retry**
   - Stop server
   - Add API key back
   - Restart server
   - Send message again
   - Should work normally

#### Scenario B: Network Failure

1. **Disable Network**
   - In DevTools → Network tab
   - Set "Throttling" to "Offline"

2. **Send Message**
   - Should see network error
   - UI should show error state
   - Should not break the app

3. **Re-enable Network**
   - Set throttling back to "No throttling"
   - Retry message
   - Should work

#### Scenario C: Invalid Model Selection

1. **Corrupt localStorage**

   ```javascript
   // In browser console
   const storage = JSON.parse(localStorage.getItem('chat-storage'));
   storage.state.threads[storage.state.activeThreadId].modelId = 'invalid-model';
   localStorage.setItem('chat-storage', JSON.stringify(storage));
   ```

2. **Refresh Page**
   - App should handle invalid model gracefully
   - Should fall back to default or show error
   - Should not crash

### Expected Results

✅ **PASS Criteria**:

- All errors handled gracefully
- User-friendly error messages
- App remains functional after errors
- Can recover without page reload (where possible)
- No unhandled exceptions in console

❌ **FAIL Criteria**:

- App crashes on error
- White screen of death
- Cryptic error messages
- Unhandled exceptions
- Cannot recover without manual intervention

---

## Test 3.4: Migration from v1 to v2

**Objective**: Verify that existing users' data migrates correctly to the new schema.

### Prerequisites

- Ability to create v1 localStorage data

### Test Steps

1. **Create v1 State**

   ```javascript
   // Simulate old version without modelId/providerId
   const v1State = {
     state: {
       threads: {
         'test-thread-1': {
           id: 'test-thread-1',
           title: 'Old Thread',
           rootId: null,
           messages: {},
           currentLeafId: null,
           createdAt: Date.now(),
           updatedAt: Date.now(),
           // NO modelId or providerId
         },
       },
       activeThreadId: 'test-thread-1',
     },
     version: 1,
   };

   localStorage.setItem('chat-storage', JSON.stringify(v1State));
   ```

2. **Refresh Page**
   - Page loads
   - Migration should run automatically

3. **Verify Migration**

   ```javascript
   const v2State = JSON.parse(localStorage.getItem('chat-storage'));
   console.log('Version:', v2State.version); // Should be 2
   console.log('ModelId:', v2State.state.threads['test-thread-1'].modelId);
   // Should be 'gpt-4.5-turbo'
   console.log('ProviderId:', v2State.state.threads['test-thread-1'].providerId);
   // Should be 'openai'
   ```

4. **Test Migrated Thread**
   - Send message in migrated thread
   - Should use default model (GPT-4.5 Turbo)
   - No errors should occur

### Expected Results

✅ **PASS Criteria**:

- Migration runs automatically on v1 → v2
- All threads get default modelId and providerId
- No data loss (all messages preserved)
- Threads remain functional
- version field updates to 2

❌ **FAIL Criteria**:

- Migration doesn't run
- Data loss or corruption
- Threads become non-functional
- Migration runs multiple times

---

## Test 3.5: VideoStudio & Chat Independence

**Objective**: Verify that VideoStudio and Chat model selections are independent.

### Test Steps

1. **Set VideoStudio Model**
   - Navigate to VideoStudio
   - Select "Luma Dream Machine"

2. **Set Chat Model**
   - Navigate to Chat
   - Select "Claude 4.5 Opus"

3. **Verify Independence**
   - Go back to VideoStudio
   - Should still show "Luma Dream Machine"
   - Go back to Chat
   - Should still show "Claude 4.5 Opus"

4. **Check localStorage**

   ```javascript
   const video = JSON.parse(localStorage.getItem('video-studio-storage'));
   const chat = JSON.parse(localStorage.getItem('chat-storage'));

   console.log('VideoStudio model:', video.state.selectedModelId);
   // Should be "luma-dream-machine"

   console.log('Chat model:', chat.state.threads[chat.state.activeThreadId]?.modelId);
   // Should be "claude-opus-4.5"
   ```

5. **Refresh & Verify**
   - Refresh page
   - Check both VideoStudio and Chat
   - Both should maintain their selections

### Expected Results

✅ **PASS Criteria**:

- VideoStudio and Chat use separate stores
- Selections don't interfere with each other
- Both persist independently
- Separate localStorage keys used

❌ **FAIL Criteria**:

- Changing one affects the other
- Shared state between features
- One overwrites the other

---

## Test 3.6: Performance Under Load

**Objective**: Verify app remains responsive with multiple threads and long conversations.

### Test Steps

1. **Create Multiple Threads**
   - Create 10 threads
   - Each with different model
   - Each with 3-5 messages

2. **Switch Between Threads Rapidly**
   - Cycle through all 10 threads quickly
   - Measure UI responsiveness
   - Should not lag or freeze

3. **Long Conversation**
   - In one thread, send 20+ messages
   - Scroll through entire conversation
   - UI should remain smooth

4. **Check localStorage Size**

   ```javascript
   const storage = localStorage.getItem('chat-storage');
   console.log('Storage size:', (storage.length / 1024).toFixed(2), 'KB');
   ```

   - Should be reasonable (< 1MB for 10 threads)

5. **Refresh with Large State**
   - Refresh page
   - Should load within 2-3 seconds
   - No significant delay

### Expected Results

✅ **PASS Criteria**:

- Smooth performance with 10+ threads
- No lag when switching threads
- Long conversations scroll smoothly
- localStorage size is reasonable
- Fast page load even with large state

⚠️ **Acceptable**:

- Slight delay with 50+ threads (edge case)
- Very long conversations (100+ messages) may be slower

❌ **FAIL Criteria**:

- UI freezes with normal usage
- Significant lag with 10 threads
- Page won't load with moderate data
- localStorage quota exceeded

---

## Summary Checklist

After completing all Integration tests, verify:

- [ ] New user journey is smooth (Test 3.1)
- [ ] Multi-tab sync works correctly (Test 3.2)
- [ ] Errors are handled gracefully (Test 3.3)
- [ ] v1 to v2 migration works (Test 3.4)
- [ ] VideoStudio & Chat are independent (Test 3.5)
- [ ] Performance is acceptable (Test 3.6)

**All tests passed?** ✅ Integration verified! Move to production.
**Some tests failed?** ❌ Report critical issues immediately.

---

## Next Steps

If all tests pass:

1. Document any edge cases found
2. Update README with testing confirmation
3. Prepare for Phase 2 development
4. Consider adding automated E2E tests (Playwright/Cypress)
