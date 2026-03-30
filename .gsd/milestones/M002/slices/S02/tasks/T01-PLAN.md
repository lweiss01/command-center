---
estimated_steps: 3
estimated_files: 1
skills_used: []
---

# T01: Fix computeContinuity checkpoint resolution and enrich latestWork/hygiene signal in server.js

The checkpoint resolution in computeContinuity reads holisticState.lastCheckpointAt and holisticState.lastHandoffAt — neither of which exists at the top level of Holistic's state.json. The real path is holisticState.passiveCapture?.lastCheckpointAt (primary) and holisticState.lastAutoCheckpoint (fallback). This causes every repo with Holistic state to show checkpointHygiene: 'stale' with 'No explicit checkpoint timestamp found' even when a recent auto-checkpoint exists.

Also fix: latestWork should prefer activeSession.resumeRecap[0] over raw currentGoal when present. Return checkpointCount and lastCheckpointReason from activeSession in the continuity struct so the UI and future slices can use them.

Fix computeNextAction: currently treats any stale continuity as a hard blocker. Change it so stale+missing hygiene is a blocker but stale+ok/stale hygiene is not (just a soft reminder — the path is still clear).

## Inputs

- `server.js`

## Expected Output

- `server.js`

## Verification

node -e "const {execSync}=require('child_process'); const r=JSON.parse(execSync('curl -s http://localhost:3000/api/projects/1/plan').toString()); const c=r.continuity; if(c.checkpointHygiene==='stale' && c.hygieneNote&&c.hygieneNote.includes('No explicit')) process.exit(1); if(!c.checkpointCount) process.exit(2); console.log('OK',JSON.stringify({hygiene:c.checkpointHygiene,note:c.hygieneNote,count:c.checkpointCount,reason:c.lastCheckpointReason,latestWork:c.latestWork?.slice(0,60)})); process.exit(0)"

## Observability Impact

GET /api/projects/1/plan continuity.checkpointHygiene now reflects the auto-checkpoint timestamp age. continuity.checkpointCount and continuity.lastCheckpointReason are new fields in the response — directly inspectable via curl. computeNextAction.blockers[] is now empty for repos with fresh/stale continuity and non-missing hygiene.
