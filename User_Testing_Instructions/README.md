# User Testing Instructions

Welcome to the Multi-Modal Generation Studio testing documentation! This folder contains comprehensive testing guides for manually verifying all implemented features.

## 📋 Testing Overview

**Phases Covered**: Phase 0 & Phase 1
**Total Test Cases**: 25+
**Estimated Testing Time**: 45-60 minutes
**Required Setup**: API keys for at least 2 providers (OpenAI + one other)

---

## 📁 Testing Documents

### Core Test Suites

1. **[01_PHASE_0_TESTS.md](01_PHASE_0_TESTS.md)** - Phase 0 Critical Features
   - Model metadata display
   - Rate limiting & retry logic
   - Prototype badge indicators
   - ChatThread model persistence

2. **[02_PHASE_1_TESTS.md](02_PHASE_1_TESTS.md)** - Phase 1 Model Selection
   - VideoStudio model selection
   - Chat API dynamic routing
   - Model switching in conversations
   - useChatWithModel hook integration

3. **[03_INTEGRATION_TESTS.md](03_INTEGRATION_TESTS.md)** - End-to-End Flows
   - Complete user journeys
   - Cross-feature interactions
   - State persistence across refresh
   - Error handling scenarios

### Supporting Documents

4. **[04_TEST_DATA.md](04_TEST_DATA.md)** - Test Data & Setup
   - Sample prompts to use
   - Expected API responses
   - Environment variable requirements
   - Test account setup

5. **[05_BUG_REPORT_TEMPLATE.md](05_BUG_REPORT_TEMPLATE.md)** - Report Issues
   - Bug report format
   - Screenshot guidelines
   - Console log instructions
   - Severity classification

---

## 🚀 Quick Start

### Prerequisites

1. **Environment Setup**

   ```bash
   # Copy .env.example to .env
   cp .env.example .env

   # Add at minimum:
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...  # Or GEMINI_API_KEY
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Start Development Server**

   ```bash
   npm run dev
   ```

4. **Open Browser**
   ```
   http://localhost:3000
   ```

---

## 📊 Testing Checklist

Use this checklist to track your testing progress:

### Phase 0 Tests (Critical Gaps)

- [ ] Model metadata displays correctly in UI
- [ ] Model pricing shows accurate values
- [ ] Context window sizes are visible
- [ ] Capabilities (vision, function calling) indicated
- [ ] Rate limiting triggers retry logic
- [ ] Exponential backoff delays observed
- [ ] RateLimitError displays user-friendly message
- [ ] Prototype badges appear on correct integrations
- [ ] Prototype integrations have disabled connect buttons
- [ ] ChatThread modelId persists across refresh

### Phase 1 Tests (Model Selection)

- [ ] VideoStudio model selector displays 11 models
- [ ] VideoStudio selected model persists after refresh
- [ ] Chat API accepts modelId parameter
- [ ] Chat API accepts providerId parameter
- [ ] Chat API validates unknown models (returns 400)
- [ ] Chat model dropdown displays 15 models
- [ ] Chat model dropdown organized by provider
- [ ] Switching chat models mid-conversation works
- [ ] Different threads can use different models
- [ ] Model selection shows in chat header

### Integration Tests

- [ ] New thread uses default model (GPT-4.5 Turbo)
- [ ] Legacy threads migrate to v2 with defaults
- [ ] Model switch updates localStorage immediately
- [ ] Multiple tabs sync model selection
- [ ] Error states handled gracefully
- [ ] Loading states show during API calls

---

## 🎯 Priority Test Cases

If time is limited, focus on these **critical paths** first:

### High Priority (Must Test)

1. **Model Switching in Chat** (Test 2.3)
   - Verifies core Phase 1 functionality
   - Tests useChatWithModel hook integration
   - Confirms API routing works

2. **VideoStudio Persistence** (Test 2.1)
   - Verifies localStorage persistence
   - Tests Zustand store integration
   - Confirms Phase 1 state management

3. **Rate Limit Handling** (Test 1.3)
   - Verifies error handling
   - Tests retry logic
   - Confirms user experience

### Medium Priority (Should Test)

4. **Model Metadata Display** (Test 1.1)
5. **Prototype Badges** (Test 1.4)
6. **Multi-Thread Model Selection** (Test 3.2)

### Low Priority (Nice to Test)

7. **Legacy Migration** (Test 3.4)
8. **Cross-Tab Sync** (Test 3.5)

---

## 🐛 Bug Reporting

If you find issues during testing:

1. **Check Console**: Open DevTools → Console tab
2. **Reproduce**: Try to reproduce the bug 2-3 times
3. **Document**: Use the bug report template (05_BUG_REPORT_TEMPLATE.md)
4. **Screenshot**: Include screenshots and console logs
5. **Report**: Create GitHub issue or notify developer

### Severity Levels

- **Critical**: Application crashes, data loss, security issue
- **Major**: Feature completely broken, no workaround
- **Minor**: Feature partially broken, workaround exists
- **Trivial**: UI glitch, typo, cosmetic issue

---

## 📈 Success Criteria

Testing is considered **successful** when:

- ✅ All High Priority tests pass
- ✅ At least 80% of Medium Priority tests pass
- ✅ No Critical or Major bugs found
- ✅ User experience feels smooth and intuitive
- ✅ Error messages are clear and helpful

---

## 🤝 Testing Tips

### For Testers

1. **Clear Cache**: Start with cleared browser cache and localStorage
2. **Fresh State**: Test both fresh installs and upgrades from v1
3. **Different Browsers**: Test on Chrome, Firefox, Safari if possible
4. **Network Tab**: Keep DevTools Network tab open to see API calls
5. **Take Notes**: Document unexpected behavior even if not a bug

### For Developers

1. **Watch Console**: Monitor browser console during testing
2. **Check Network**: Verify API requests have correct payloads
3. **Inspect State**: Use Redux DevTools or Zustand DevTools
4. **Review Logs**: Check server logs for API errors
5. **Profile Performance**: Use React DevTools Profiler

---

## 📞 Support

- **Documentation**: See [FULL_AUDIT_REPORT.md](../FULL_AUDIT_REPORT.md)
- **Implementation**: See [PHASE_1_ENHANCEMENTS_COMPLETE.md](../PHASE_1_ENHANCEMENTS_COMPLETE.md)
- **Questions**: Contact development team

---

**Last Updated**: 2026-01-17
**Version**: Phase 0 & 1 Testing
**Status**: Ready for Testing ✅
