# S04: Machine-level setup assistant (secondary stage) — UAT

**Milestone:** M003
**Written:** 2026-03-31T00:39:24.887Z

## S04 UAT: Machine-level setup assistant

### Setup
- A project with missing holistic-tool or gsd-tool (or simulate via toolOverrides)
- Command Center backend + frontend running

### Test cases

1. **Stage gate blocks machine-level when repo-local steps pending**
   - Select a project with both repo-local AND machine-level gaps
   - Bootstrap Plan shows machine-level card with banner: "Complete repo-local steps above before running machine-level setup."
   - View Instructions buttons are greyed and cursor:not-allowed
   - Expected: ✅

2. **Stage gate clears after all repo-local steps done**
   - Complete/dismiss all repo-local steps
   - Machine-level card: banner disappears, View Instructions buttons become active
   - Expected: ✅

3. **Instructions panel opens with install command**
   - Click View Instructions on a machine-level step
   - Panel opens showing correct install command for OS (npm/brew/winget)
   - Expected: ✅

4. **Clipboard copy**
   - Click Copy button in instructions panel
   - Button label changes to "Copied!" for ~2s then resets
   - No console errors
   - Expected: ✅

5. **Multi-variant tabs**
   - If multiple command variants available, tab row shows npm/brew/winget
   - Platform-native tab is highlighted by default
   - Clicking a different tab updates displayed command and Copy copies new command
   - Expected: ✅

6. **Verify button — tool present**
   - Click "I installed this — verify"
   - Button shows "Verifying…" then step transitions to done
   - Expected: ✅

7. **Verify button — tool missing**
   - When tool is not present, step stays in instructions state
   - Inline error: "Tool not detected yet — try running the install command, then verify again."
   - Expected: ✅

8. **No regressions to repo-local apply/confirm flow**
   - Repo-local Apply → confirm panel → Confirm applies step
   - Cancel returns to pending
   - Expected: ✅
