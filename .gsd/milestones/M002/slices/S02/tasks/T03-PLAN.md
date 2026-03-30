---
estimated_steps: 9
estimated_files: 2
skills_used: []
---

# T03: Browser-verify continuity panel shows callout and correct hygiene for command-center

End-to-end browser verification of the completed S02 changes. Start the dev server if not running, navigate to the cockpit, select command-center, and assert:
1. checkpointHygiene badge shows the correct status (should be 'ok' since lastAutoCheckpoint is recent)
2. If hygiene is 'stale', the callout box is visible with the handoff command string; if 'ok', the compact confirmation line is shown
3. latestWork shows the resumeRecap sentence (not raw currentGoal)
4. checkpointCount and lastCheckpointReason are visible in the panel
5. nextAction.blockers is empty (stale continuity with ok hygiene should not block)
6. No TypeScript errors (npx tsc --noEmit)
7. No console errors in the browser

This is a verification-only task — if all assertions pass without code changes, that is the expected outcome. Only fix bugs discovered during verification.

## Inputs

- `server.js`
- `src/App.tsx`

## Expected Output

- `server.js`
- `src/App.tsx`

## Verification

npx tsc --noEmit
