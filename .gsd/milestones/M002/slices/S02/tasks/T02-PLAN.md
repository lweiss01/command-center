---
estimated_steps: 3
estimated_files: 2
skills_used: []
---

# T02: Upgrade App.tsx continuity panel: extend interface and replace footnote with hygiene callout

The hygieneNote in the continuity panel is currently rendered as a tiny slate-500 text footnote inside the detail box. This is too subtle for a hygiene reminder that needs to be actionable. Replace it with a visible callout box when checkpointHygiene is 'stale' or 'missing', showing the hygieneNote text and a concrete suggested command. When hygiene is 'ok', show a compact confirmation line instead.

Also extend the ContinuityState interface to add checkpointCount?: number and lastCheckpointReason?: string | null, and display checkpointCount/lastCheckpointReason as a secondary hygiene quality line (e.g. '21 passive captures, last reason: post-commit') when both are present.

Command to suggest (cross-platform): show Windows path (.holistic\system\holistic.cmd handoff) on win32, Unix path (./.holistic/system/holistic handoff) otherwise. The server can inject this; alternatively the UI can display both variants. Use server injection: add a handoffCommand string to the continuity struct returned by the server.

## Inputs

- `server.js`
- `src/App.tsx`

## Expected Output

- `server.js`
- `src/App.tsx`

## Verification

npx tsc --noEmit && node -e "const {execSync}=require('child_process'); const r=JSON.parse(execSync('curl -s http://localhost:3000/api/projects/1/plan').toString()); if(!r.continuity.handoffCommand) process.exit(1); console.log('handoffCommand:',r.continuity.handoffCommand); process.exit(0)"
