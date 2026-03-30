# S02: Continuity and checkpoint hygiene

**Goal:** Fix the checkpoint key-path bug in computeContinuity so hygiene reflects the auto-checkpoint timestamp correctly, enrich latestWork with resumeRecap, nuance the computeNextAction stale-blocker logic, and upgrade the App.tsx continuity panel to show a visible hygiene callout (not a footnote) with a concrete handoff command suggestion.
**Demo:** After this: After this: a selected repo shows freshness, last meaningful work, and reminders when Holistic continuity or checkpoint hygiene is stale or missing.

## Tasks
- [x] **T01: Fixed checkpoint key-path bug (passiveCapture.lastCheckpointAt / lastAutoCheckpoint), enriched continuity with checkpointCount/lastCheckpointReason/resumeRecap, and nuanced computeNextAction so stale+ok hygiene is no longer a hard blocker** — The checkpoint resolution in computeContinuity reads holisticState.lastCheckpointAt and holisticState.lastHandoffAt — neither of which exists at the top level of Holistic's state.json. The real path is holisticState.passiveCapture?.lastCheckpointAt (primary) and holisticState.lastAutoCheckpoint (fallback). This causes every repo with Holistic state to show checkpointHygiene: 'stale' with 'No explicit checkpoint timestamp found' even when a recent auto-checkpoint exists.

Also fix: latestWork should prefer activeSession.resumeRecap[0] over raw currentGoal when present. Return checkpointCount and lastCheckpointReason from activeSession in the continuity struct so the UI and future slices can use them.

Fix computeNextAction: currently treats any stale continuity as a hard blocker. Change it so stale+missing hygiene is a blocker but stale+ok/stale hygiene is not (just a soft reminder — the path is still clear).
  - Estimate: 45m
  - Files: server.js
  - Verify: node -e "const {execSync}=require('child_process'); const r=JSON.parse(execSync('curl -s http://localhost:3000/api/projects/1/plan').toString()); const c=r.continuity; if(c.checkpointHygiene==='stale' && c.hygieneNote&&c.hygieneNote.includes('No explicit')) process.exit(1); if(!c.checkpointCount) process.exit(2); console.log('OK',JSON.stringify({hygiene:c.checkpointHygiene,note:c.hygieneNote,count:c.checkpointCount,reason:c.lastCheckpointReason,latestWork:c.latestWork?.slice(0,60)})); process.exit(0)"
- [x] **T02: Added handoffCommand to server.js computeContinuity and replaced footnote hygiene note in App.tsx with a visible callout box showing the suggested command when hygiene is stale or missing** — The hygieneNote in the continuity panel is currently rendered as a tiny slate-500 text footnote inside the detail box. This is too subtle for a hygiene reminder that needs to be actionable. Replace it with a visible callout box when checkpointHygiene is 'stale' or 'missing', showing the hygieneNote text and a concrete suggested command. When hygiene is 'ok', show a compact confirmation line instead.

Also extend the ContinuityState interface to add checkpointCount?: number and lastCheckpointReason?: string | null, and display checkpointCount/lastCheckpointReason as a secondary hygiene quality line (e.g. '21 passive captures, last reason: post-commit') when both are present.

Command to suggest (cross-platform): show Windows path (.holistic\system\holistic.cmd handoff) on win32, Unix path (./.holistic/system/holistic handoff) otherwise. The server can inject this; alternatively the UI can display both variants. Use server injection: add a handoffCommand string to the continuity struct returned by the server.
  - Estimate: 45m
  - Files: src/App.tsx, server.js
  - Verify: npx tsc --noEmit && node -e "const {execSync}=require('child_process'); const r=JSON.parse(execSync('curl -s http://localhost:3000/api/projects/1/plan').toString()); if(!r.continuity.handoffCommand) process.exit(1); console.log('handoffCommand:',r.continuity.handoffCommand); process.exit(0)"
- [x] **T03: Browser-verified all S02 continuity panel assertions pass: hygiene badge, compact ok callout, resumeRecap latestWork, checkpoint count/reason, zero blockers, zero console errors** — End-to-end browser verification of the completed S02 changes. Start the dev server if not running, navigate to the cockpit, select command-center, and assert:
1. checkpointHygiene badge shows the correct status (should be 'ok' since lastAutoCheckpoint is recent)
2. If hygiene is 'stale', the callout box is visible with the handoff command string; if 'ok', the compact confirmation line is shown
3. latestWork shows the resumeRecap sentence (not raw currentGoal)
4. checkpointCount and lastCheckpointReason are visible in the panel
5. nextAction.blockers is empty (stale continuity with ok hygiene should not block)
6. No TypeScript errors (npx tsc --noEmit)
7. No console errors in the browser

This is a verification-only task — if all assertions pass without code changes, that is the expected outcome. Only fix bugs discovered during verification.
  - Estimate: 30m
  - Files: src/App.tsx, server.js
  - Verify: npx tsc --noEmit
