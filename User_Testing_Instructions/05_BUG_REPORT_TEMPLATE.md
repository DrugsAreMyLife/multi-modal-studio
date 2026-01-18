# Bug Report Template

Use this template when reporting issues found during testing.

---

## 🐛 Bug Report

**Date**: YYYY-MM-DD
**Tester**: [Your Name]
**Environment**: [Chrome 120 / Firefox 121 / Safari 17]
**Build**: [Phase 0+1 / commit hash if known]

---

### Issue Summary

**Brief Description** (one sentence):

**Severity**: [Critical / Major / Minor / Trivial]

**Component**: [Chat / VideoStudio / API / UI / Other]

**Related Test Case**: [e.g., Test 2.3 - Model Switching]

---

### Steps to Reproduce

1.
2.
3.
4.

---

### Expected Behavior

What should happen:

---

### Actual Behavior

What actually happens:

---

### Screenshots

Attach screenshots here:

- [ ] Screenshot of issue
- [ ] Screenshot of browser console (if errors present)
- [ ] Screenshot of Network tab (if API issue)

---

### Browser Console Logs

```
[Paste relevant console output here]
```

---

### Network Request Details

**Request URL**:

**Request Method**:

**Status Code**:

**Request Payload**:

```json
{
  // Paste request body
}
```

**Response**:

```json
{
  // Paste response body
}
```

---

### localStorage State

```json
{
  // Paste relevant localStorage data
}
```

---

### Reproduction Rate

How often does this occur?

- [ ] Always (100%)
- [ ] Frequently (>50%)
- [ ] Sometimes (10-50%)
- [ ] Rarely (<10%)

---

### Impact Assessment

**User Impact**:

- [ ] Blocks all usage (application unusable)
- [ ] Blocks specific feature
- [ ] Workaround exists
- [ ] Cosmetic only

**Business Impact**:

- [ ] Data loss risk
- [ ] Security concern
- [ ] Poor user experience
- [ ] Minimal impact

---

### Workaround (if any)

Steps to work around this issue:

---

### Additional Context

Any other relevant information:

---

## Severity Guidelines

### Critical (P0)

- Application crashes completely
- Data loss occurs
- Security vulnerability
- No workaround exists
- **Action**: Fix immediately

### Major (P1)

- Core feature completely broken
- Affects majority of users
- Workaround is difficult
- **Action**: Fix before next release

### Minor (P2)

- Feature partially broken
- Affects some users
- Easy workaround exists
- **Action**: Fix when possible

### Trivial (P3)

- Cosmetic issue
- Typo or minor UI glitch
- No functional impact
- **Action**: Fix in future release

---

## Example Bug Reports

### Example 1: Critical Bug

```
Issue Summary: Application crashes when switching to Gemini model

Severity: Critical
Component: Chat
Related Test: Test 2.3

Steps to Reproduce:
1. Open chat with default GPT-4.5 Turbo
2. Send one message
3. Click model dropdown
4. Select "Gemini 2.5 Pro"
5. Application white screens and crashes

Expected: Model switches smoothly, UI updates
Actual: White screen, console shows TypeError

Console Error:
TypeError: Cannot read property 'modelId' of undefined
  at ChatOrchestrator.tsx:48

Reproduction Rate: Always (100%)
Impact: Blocks all Gemini usage

Workaround: None - app unusable after crash
```

---

### Example 2: Minor Bug

```
Issue Summary: Model dropdown has typo in "Gemini" label

Severity: Trivial
Component: UI
Related Test: Test 2.5

Steps to Reproduce:
1. Open model dropdown
2. Look at Google section
3. See "Gemeni 2.5 Pro" instead of "Gemini 2.5 Pro"

Expected: "Gemini 2.5 Pro"
Actual: "Gemeni 2.5 Pro"

Reproduction Rate: Always (100%)
Impact: Cosmetic only - no functional impact

Workaround: None needed, just a typo
```

---

## Submission

After filling out this template:

1. **Save** as markdown file: `bug-report-YYYY-MM-DD-[issue-name].md`
2. **Attach** all screenshots to same folder
3. **Submit** via:
   - GitHub Issues (preferred)
   - Email to development team
   - Slack channel
   - Project management tool

---

**Template Version**: 1.0
**Last Updated**: 2026-01-17
