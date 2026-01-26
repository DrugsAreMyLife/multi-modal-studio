# UI Audit - Remediation Checklist

**Report Date:** January 26, 2026
**Priority Classification:** CRITICAL | HIGH | MEDIUM | LOW
**Estimated Effort:** 3 weeks (20 working days)

---

## CRITICAL Issues (Must Fix Before Release)

### Week 1: Core Functionality Fixes

- [ ] **Issue #1: Fix AudioStudio useState hook**
  - File: `/src/components/audio-studio/AudioStudio.tsx`
  - Lines: 68-70
  - Change: Replace `useState(() => { fetchVoices(); })` with `useEffect(() => { fetchVoices(); }, [])`
  - Effort: 15 minutes
  - Test: Verify voices load on component mount
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #2: Remove `as any` type casting**
  - File: `/src/components/workflow/WorkflowStudio.tsx`
  - Lines: 38-40
  - Change: Create proper TypeScript types for LLMNode and ImageNode
  - Effort: 1 hour
  - Test: Compile with strict TypeScript, no type errors
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #3: Fix infinite polling in ImageStudio**
  - File: `/src/components/image-studio/ImageStudio.tsx`
  - Lines: 81-104
  - Changes:
    - [ ] Add status validation (check for expected values)
    - [ ] Add error handling for polling failures
    - [ ] Add timeout after maxAttempts
    - [ ] Show user feedback during polling
  - Effort: 2 hours
  - Test:
    - [ ] Poll timeout after 60 seconds
    - [ ] Invalid status handled gracefully
    - [ ] Network error during polling handled
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #3b: Fix infinite polling in VideoStudio**
  - File: `/src/components/video-studio/VideoStudio.tsx`
  - Lines: 113-149
  - Changes: Same as ImageStudio fix above
  - Effort: 1 hour
  - Test: Same test cases
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #3c: Fix infinite polling in WorkflowStudio**
  - File: `/src/components/workflow/WorkflowStudio.tsx`
  - Lines: 133-149
  - Changes: Same as ImageStudio fix above
  - Effort: 1 hour
  - Test: Same test cases
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #4: Fix error handling in ChatInputArea**
  - File: `/src/components/chat/ChatInputArea.tsx`
  - Lines: 141-147
  - Changes:
    - [ ] Add proper error type checking
    - [ ] Handle PULL_REQUIRED case with UI feedback
    - [ ] Show user-friendly error messages
  - Effort: 1 hour
  - Test:
    - [ ] Send message with model that needs pulling
    - [ ] Verify pull UI appears
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #5: Add useCallback memoization**
  - File: `/src/components/layout/Shell.tsx`
  - Lines: 311, and similar patterns throughout
  - Changes:
    - [ ] Wrap toggleFocused in useCallback
    - [ ] Review other onClick handlers
    - [ ] Add proper dependencies
  - Effort: 30 minutes
  - Test: Render count should decrease on focus toggle
  - Owner: [Assign]
  - PR: [Link]

### Week 2: Accessibility Critical Fixes

- [ ] **Issue #13: Add ARIA labels (Part 1: Navigation)**
  - File: `/src/components/layout/Sidebar.tsx`
  - Lines: All buttons
  - Changes:
    - [ ] Add `aria-label` to all nav buttons
    - [ ] Add `aria-current` to active nav item
    - [ ] Add `aria-hidden="true"` to decorative icons
  - Effort: 30 minutes
  - Test:
    - [ ] Screen reader reads all labels
    - [ ] Current page indicated to assistive tech
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #13: Add ARIA labels (Part 2: Studio Components)**
  - Files: All studio component buttons
  - Changes:
    - [ ] Audit all buttons in ImageStudio.tsx
    - [ ] Audit all buttons in VideoStudio.tsx
    - [ ] Audit all buttons in AudioStudio.tsx
    - [ ] Audit all buttons in ChatOrchestrator.tsx
    - [ ] Audit all buttons in TrainingMonitor.tsx
    - [ ] Audit all buttons in WorkflowStudio.tsx
  - Effort: 3 hours total
  - Test: Screen reader compatibility testing
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #13: Add ARIA labels (Part 3: Form Inputs)**
  - Files: All form inputs across components
  - Changes:
    - [ ] Add aria-label or aria-labelledby
    - [ ] Add aria-describedby for help text
    - [ ] Add aria-invalid for validation state
  - Effort: 2 hours
  - Test: Screen reader reads all labels and descriptions
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #14: Implement keyboard navigation**
  - Files: All studio components
  - Changes:
    - [ ] Add Escape key handler to close panels
    - [ ] Add Ctrl/Cmd+Enter to submit forms
    - [ ] Add Tab navigation support
    - [ ] Test with keyboard-only navigation
  - Effort: 4 hours
  - Test:
    - [ ] Navigate app with Tab key only
    - [ ] Submit form with Ctrl+Enter
    - [ ] Close panels with Escape
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #15: Fix color contrast (Critical colors)**
  - Files: Multiple
  - Changes:
    - [ ] Audit all text colors with WAVE or axe
    - [ ] Replace non-compliant colors
    - [ ] Test in light and dark modes
    - [ ] Test with color blindness simulator
  - Effort: 2 hours
  - Test:
    - [ ] WAVE shows no contrast errors
    - [ ] All colors >= 4.5:1 contrast ratio
    - [ ] Readable in all color blindness modes
  - Owner: [Assign]
  - PR: [Link]

### Week 3: Error Handling & UX Fixes

- [ ] **Issue #6: Improve error boundary recovery**
  - File: `/src/components/shared/ErrorBoundary.tsx`
  - Changes:
    - [ ] Remove full page reload
    - [ ] Add "Try Again" button
    - [ ] Add fallback UI option
    - [ ] Preserve some state if possible
  - Effort: 1.5 hours
  - Test:
    - [ ] Crash studio
    - [ ] Click "Try Again" - studio recovers
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #7: Add API response validation**
  - Files: ImageStudio, VideoStudio, WorkflowStudio
  - Changes:
    - [ ] Create response schema interfaces
    - [ ] Add validation functions
    - [ ] Handle schema mismatches
    - [ ] Add helpful error messages
  - Effort: 2 hours
  - Test:
    - [ ] API returns non-matching schema
    - [ ] Error message is helpful
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #8: Add fetch timeout support**
  - Files: All fetch calls throughout codebase
  - Changes:
    - [ ] Create fetchWithTimeout utility
    - [ ] Apply to all API calls
    - [ ] Add timeout error handling
    - [ ] Set reasonable timeout (30 seconds)
  - Effort: 2 hours
  - Test:
    - [ ] Network disabled
    - [ ] Request times out gracefully
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #9: Standardize loading state handling**
  - Files: VideoStudio, ImageStudio, all sharing features
  - Changes:
    - [ ] Add loading state to share button
    - [ ] Add loading state to export button
    - [ ] Add progress indicator for long operations
    - [ ] Show elapsed time if > 10 seconds
  - Effort: 1.5 hours
  - Test:
    - [ ] Generate long operation and verify feedback
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #10: Fix disabled button styling**
  - Files: Button component and usage
  - Changes:
    - [ ] Ensure `disabled:opacity-50` applied everywhere
    - [ ] Test disabled state visibility
    - [ ] Add aria-disabled attribute
    - [ ] Add title tooltip explaining why disabled
  - Effort: 1 hour
  - Test:
    - [ ] All disabled buttons clearly visible
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #11: Improve form validation feedback**
  - Files: ImageStudio, VideoStudio, AudioStudio
  - Changes:
    - [ ] Add character counter to prompts
    - [ ] Show validation errors
    - [ ] Add minimum length indicators
    - [ ] Show why button is disabled
  - Effort: 1.5 hours
  - Test:
    - [ ] Empty prompt shows message
    - [ ] Character count displays
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #12: Improve clipboard feedback**
  - Files: ImageStudio, VideoStudio, etc.
  - Changes:
    - [ ] Add error handling for clipboard API
    - [ ] Show fallback copy dialog if clipboard fails
    - [ ] Add visual button state change
    - [ ] Extend toast timeout for long links
  - Effort: 1 hour
  - Test:
    - [ ] Copy to clipboard works
    - [ ] Fallback dialog appears if clipboard fails
  - Owner: [Assign]
  - PR: [Link]

---

## HIGH Priority Issues (Recommended Before Release)

### Quick Wins (< 1 hour each)

- [ ] **Issue #16: Component decomposition (AudioStudio)**
  - File: `/src/components/audio-studio/AudioStudio.tsx` (607 lines)
  - Changes:
    - [ ] Extract VoicePanel to separate file
    - [ ] Extract QwenPanel to separate file
    - [ ] Extract WaveformSection to separate file
    - [ ] Extract ClipGrid to separate file
  - Effort: 3 hours (decomposition)
  - Test: Functionality unchanged after split
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #16: Component decomposition (ChatOrchestrator)**
  - File: `/src/components/chat/ChatOrchestrator.tsx` (576 lines)
  - Changes:
    - [ ] Extract MessageList to separate file
    - [ ] Extract ChatView to separate file
    - [ ] Extract ComparisonView to separate file
  - Effort: 2 hours
  - Test: Functionality unchanged after split
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #17: Refactor provider routing**
  - File: `/src/components/video-studio/VideoStudio.tsx`
  - Changes:
    - [ ] Create provider mapping in config
    - [ ] Replace string matching with lookup
    - [ ] Do same for ImageStudio
  - Effort: 30 minutes
  - Test: All providers still routed correctly
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #18: Add progress display**
  - File: `/src/components/video-studio/VideoStudio.tsx`
  - Changes:
    - [ ] Add progress state
    - [ ] Calculate progress percentage
    - [ ] Show in UI during generation
    - [ ] Apply to ImageStudio too
  - Effort: 1 hour
  - Test: Progress updates during generation
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #19: Add JSON parsing error handling**
  - Files: Multiple (apply as pattern)
  - Changes:
    - [ ] Wrap response.json() in try-catch
    - [ ] Add helpful error messages
    - [ ] Log response body for debugging
  - Effort: 1 hour (create utility) + 1 hour (apply)
  - Test: API returns non-JSON, error is helpful
  - Owner: [Assign]
  - PR: [Link]

### Medium Effort (1-2 hours each)

- [ ] **Issue #20: Standardize component styling**
  - Files: All components
  - Changes:
    - [ ] Audit padding (use p-4 or p-6 consistently)
    - [ ] Audit gaps (use gap-2, gap-4, gap-6)
    - [ ] Audit borders (use design system colors)
    - [ ] Replace magic color values
  - Effort: 2 hours
  - Test: Visual consistency throughout app
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Issue #21: Improve console logging**
  - Files: All components with console.error
  - Changes:
    - [ ] Add context to all error logs
    - [ ] Include timestamp
    - [ ] Include relevant IDs/URLs
    - [ ] Use consistent format
  - Effort: 1 hour
  - Test: Logs have useful context
  - Owner: [Assign]
  - PR: [Link]

---

## MEDIUM Priority Issues (Nice to Have)

### Code Quality & Documentation

- [ ] **Issue #22: Add JSDoc comments**
  - Files: Complex functions
  - Changes:
    - [ ] Document all custom hooks
    - [ ] Document all export functions
    - [ ] Add parameter descriptions
    - [ ] Add return type descriptions
  - Effort: 2 hours
  - Test: IDE tooltips show documentation
  - Owner: [Assign]
  - PR: [Link]

### Testing & Validation

- [ ] **Add unit tests for error handling**
  - Files: Error boundaries, API calls
  - Effort: 2 hours
  - Test: Tests pass, coverage improved
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Add integration tests for polling**
  - Files: Image/Video/Workflow generation
  - Effort: 2 hours
  - Test: Polling handles all edge cases
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Add accessibility tests**
  - Files: All components
  - Effort: 2 hours
  - Tools: axe-core, jest-axe
  - Test: Accessibility tests pass
  - Owner: [Assign]
  - PR: [Link]

- [ ] **Lighthouse performance audit**
  - Effort: 1 hour
  - Tools: Google Lighthouse
  - Target: Score > 80
  - Owner: [Assign]
  - PR: [Link]

---

## LOW Priority Issues (Future Improvements)

- [ ] Responsive design improvements (tablet)
- [ ] Mobile layout optimization
- [ ] Dark mode color refinement
- [ ] Animation performance optimization
- [ ] Bundle size analysis and reduction
- [ ] SEO optimization
- [ ] Analytics integration
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring

---

## Implementation Timeline

### Week 1: Critical Functionality (5 days)

```
Day 1: Issue #1-2 (useState, type casting) - 1.5 hours
       Issue #3a-3c (polling fixes) - 4 hours
Day 2: Issue #4 (error handling) - 1 hour
       Issue #5 (useCallback) - 0.5 hours
       Issue #13a (ARIA labels nav) - 0.5 hours
Day 3: Issue #13b (ARIA labels studios) - 3 hours
       Issue #15 (color contrast) - 2 hours
Day 4: Issue #13c (ARIA labels forms) - 2 hours
       Issue #14 (keyboard nav) - 4 hours
Day 5: Buffer for issues found during testing - 8 hours
```

### Week 2: Error Handling & UX (5 days)

```
Day 1: Issue #6 (error boundary) - 1.5 hours
       Issue #7 (API validation) - 2 hours
       Issue #8 (fetch timeout) - 2 hours
Day 2: Issue #9 (loading states) - 1.5 hours
       Issue #10 (disabled styling) - 1 hour
       Issue #11 (form validation) - 1.5 hours
       Issue #12 (clipboard) - 1 hour
Day 3-5: Buffer and testing - 8 hours/day
```

### Week 3: Code Quality & Testing (5 days)

```
Day 1-2: Issue #16 (component decomposition) - 5 hours
         Issue #17-19 (code improvements) - 3 hours
Day 3: Issue #20-21 (styling/logging) - 2 hours
       Issue #22 (JSDoc) - 2 hours
Day 4-5: Testing and validation - 8 hours/day
```

---

## Verification Checklist

### Before marking DONE:

- [ ] Code compiles without errors
- [ ] No TypeScript errors (strict mode)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No console errors or warnings
- [ ] Accessibility tests pass
- [ ] Lighthouse score > 80
- [ ] No memory leaks detected
- [ ] Tested in light and dark modes
- [ ] Tested on multiple browsers (Chrome, Firefox, Safari)
- [ ] Tested on tablet (768px viewport)
- [ ] Keyboard navigation works completely
- [ ] Screen reader compatible (NVDA or JAWS)
- [ ] Color contrast WCAG AA compliant
- [ ] No console.error logs
- [ ] Error recovery tested manually
- [ ] Performance benchmarked

---

## Sign-Off

| Role               | Name   | Date   | Status       |
| ------------------ | ------ | ------ | ------------ |
| Project Lead       | [Name] | [Date] | [ ] Approved |
| QA Lead            | [Name] | [Date] | [ ] Approved |
| Accessibility Lead | [Name] | [Date] | [ ] Approved |
| Security Lead      | [Name] | [Date] | [ ] Approved |

---

## Notes

- Assign issues to team members based on expertise
- Create GitHub issues for each item for tracking
- Use branch naming: `audit/issue-{number}-description`
- Each fix should have a corresponding test
- Run full test suite before merging
- Update this checklist as progress is made
- Report blocker issues immediately to project lead

---

**Document owner:** QA & Accessibility Team
**Last updated:** January 26, 2026
