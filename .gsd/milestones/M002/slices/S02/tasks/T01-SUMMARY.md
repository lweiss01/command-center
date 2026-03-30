---
id: T01
parent: S02
milestone: M002
provides: []
requires: []
affects: []
key_files: ["server.js"]
key_decisions: ["Holistic state checkpoint path is passiveCapture.lastCheckpointAt ?? lastAutoCheckpoint (top-level lastCheckpointAt/lastHandoffAt do not exist in state.json)", "stale+ok or stale+stale hygiene is a soft reminder, not a hard blocker in computeNextAction"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran the task plan verification command against the running server (port 3001). Output: OK with hygiene:ok, note showing 0.2h ago, count:21, reason:post-commit, latestWork showing resumeRecap text. nextAction.blockers confirmed empty. All three exit conditions passed (exit 0)."
completed_at: 2026-03-28T04:06:40.464Z
blocker_discovered: false
---

# T01: Fixed checkpoint key-path bug (passiveCapture.lastCheckpointAt / lastAutoCheckpoint), enriched continuity with checkpointCount/lastCheckpointReason/resumeRecap, and nuanced computeNextAction so stale+ok hygiene is no longer a hard blocker

> Fixed checkpoint key-path bug (passiveCapture.lastCheckpointAt / lastAutoCheckpoint), enriched continuity with checkpointCount/lastCheckpointReason/resumeRecap, and nuanced computeNextAction so stale+ok hygiene is no longer a hard blocker

## What Happened
---
id: T01
parent: S02
milestone: M002
key_files:
  - server.js
key_decisions:
  - Holistic state checkpoint path is passiveCapture.lastCheckpointAt ?? lastAutoCheckpoint (top-level lastCheckpointAt/lastHandoffAt do not exist in state.json)
  - stale+ok or stale+stale hygiene is a soft reminder, not a hard blocker in computeNextAction
duration: ""
verification_result: passed
completed_at: 2026-03-28T04:06:40.467Z
blocker_discovered: false
---

# T01: Fixed checkpoint key-path bug (passiveCapture.lastCheckpointAt / lastAutoCheckpoint), enriched continuity with checkpointCount/lastCheckpointReason/resumeRecap, and nuanced computeNextAction so stale+ok hygiene is no longer a hard blocker

**Fixed checkpoint key-path bug (passiveCapture.lastCheckpointAt / lastAutoCheckpoint), enriched continuity with checkpointCount/lastCheckpointReason/resumeRecap, and nuanced computeNextAction so stale+ok hygiene is no longer a hard blocker**

## What Happened

The existing computeContinuity read holisticState.lastCheckpointAt ?? holisticState.lastHandoffAt — neither key exists at the top level of Holistic's state.json. Real paths are holisticState.passiveCapture?.lastCheckpointAt (primary) and holisticState.lastAutoCheckpoint (fallback). This caused every repo with Holistic state to show checkpointHygiene: 'stale' with 'No explicit checkpoint timestamp found' even when a recent auto-checkpoint existed. Fixed the key-path resolution. Also enriched latestWork to prefer activeSession.resumeRecap[0] over raw currentGoal, added checkpointCount and lastCheckpointReason to the returned struct, and split the stale-continuity branch in computeNextAction so stale+missing hygiene is a hard blocker but stale+ok/stale hygiene is only a soft reminder (blockers[] empty).

## Verification

Ran the task plan verification command against the running server (port 3001). Output: OK with hygiene:ok, note showing 0.2h ago, count:21, reason:post-commit, latestWork showing resumeRecap text. nextAction.blockers confirmed empty. All three exit conditions passed (exit 0).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node -e "...plan verification command (port 3001)..."` | 0 | ✅ pass | 200ms |
| 2 | `curl http://localhost:3001/api/projects/1/plan | check nextAction.blockers` | 0 | ✅ pass | 100ms |


## Deviations

Server runs on port 3001 (not 3000 as in the task plan's verification command). A stale server process from a prior session was holding port 3000; adapted verification port accordingly.

## Known Issues

None.

## Files Created/Modified

- `server.js`


## Deviations
Server runs on port 3001 (not 3000 as in the task plan's verification command). A stale server process from a prior session was holding port 3000; adapted verification port accordingly.

## Known Issues
None.
