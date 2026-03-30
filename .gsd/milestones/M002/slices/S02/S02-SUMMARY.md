---
id: S02
parent: M002
milestone: M002
provides:
  - Correct checkpoint hygiene derivation from passiveCapture.lastCheckpointAt / lastAutoCheckpoint
  - checkpointCount and lastCheckpointReason in continuity struct for downstream slices
  - handoffCommand string for UI and future slices to reference
  - Nuanced stale-continuity blocker logic (S04 repo drill-down and S05 cross-repo prioritization can rely on blockers[] being truthful rather than over-aggressive)
requires:
  - slice: S01
    provides: computeContinuity contract and ContinuityState interface established in S01; S02 extended both
affects:
  - S04 — repo drill-down can rely on blockers[] being truthful (not over-aggressive stale blocks) when building next-step guidance
  - S05 — cross-repo prioritization inherits correct hygiene and freshness signals
key_files:
  - server.js
  - src/App.tsx
key_decisions:
  - Holistic checkpoint key-path is passiveCapture.lastCheckpointAt ?? lastAutoCheckpoint — top-level lastCheckpointAt/lastHandoffAt do not exist in state.json
  - handoffCommand is injected server-side (process.platform check) so the UI stays stateless
  - stale continuity + ok/stale hygiene is a soft reminder only — blockers[] stays empty; only stale + missing hygiene pushes a hard blocker
  - All three computeContinuity return paths must include handoffCommand/checkpointCount/lastCheckpointReason for consistent API shape
patterns_established:
  - Server injects platform-specific command strings into API responses; UI renders without platform logic
  - Hygiene callout visibility is conditional on checkpointHygiene value — 'stale'/'missing' shows full callout with command, 'ok' shows compact confirmation
observability_surfaces:
  - checkpointHygiene field in /api/projects/:id/plan continuity struct — 'ok'/'stale'/'missing'
  - hygieneNote with human-readable elapsed time string
  - checkpointCount and lastCheckpointReason from activeSession
  - handoffCommand platform-correct string
  - nextAction.blockers[] — empty when hygiene is ok or stale, populated when hygiene is missing and continuity is stale
drill_down_paths:
  - .gsd/milestones/M002/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S02/tasks/T02-SUMMARY.md
  - .gsd/milestones/M002/slices/S02/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T16:20:07.845Z
blocker_discovered: false
---

# S02: Continuity and checkpoint hygiene

**Fixed the checkpoint key-path bug, enriched the continuity struct with checkpointCount/lastCheckpointReason/resumeRecap/handoffCommand, nuanced the stale-blocker logic, and upgraded the App.tsx continuity panel to show an actionable hygiene callout instead of a footnote.**

## What Happened

S02 addressed three connected problems in the continuity pipeline and one UI presentation problem.

**T01 — checkpoint key-path bug and struct enrichment (server.js)**

`computeContinuity` was reading `holisticState.lastCheckpointAt ?? holisticState.lastHandoffAt` — neither key exists at the top level of Holistic's state.json. The real paths are `holisticState.passiveCapture?.lastCheckpointAt` (primary) and `holisticState.lastAutoCheckpoint` (fallback). This caused every repo with Holistic state to show `checkpointHygiene: 'stale'` with 'No explicit checkpoint timestamp found' even when a recent auto-checkpoint existed.

The fix resolved the key-path and also enriched the returned struct: `latestWork` now prefers `activeSession.resumeRecap[0]` over raw `currentGoal`, and `checkpointCount` + `lastCheckpointReason` are extracted from `activeSession` and included in the continuity object.

`computeNextAction` was also updated to split the stale-continuity branch: `stale + missing` hygiene pushes a hard blocker, but `stale + ok` or `stale + stale` hygiene is only a soft reminder (hygieneNote is populated, blockers[] stays empty). This prevents active repos with recent passive captures from getting a red-wall blocker.

**T02 — handoffCommand injection and UI callout upgrade (server.js + src/App.tsx)**

Server-side: `computeContinuity` now assembles and injects a `handoffCommand` string using a `process.platform === 'win32'` check, so the UI receives the platform-correct command without needing to know about platform differences. All three return branches of `computeContinuity` include the field for consistent API shape.

UI: The hygiene display in the continuity panel was a tiny `slate-500` footnote — easy to miss for something that needs to be actionable. The panel was refactored to show a visible callout box when `checkpointHygiene` is `'stale'` or `'missing'`, including the `hygieneNote` text and the `handoffCommand` string. When hygiene is `'ok'`, a compact confirmation line is shown instead. `checkpointCount` and `lastCheckpointReason` are surfaced as a secondary hygiene quality line.

**T03 — browser verification (verification only)**

End-to-end browser verification confirmed all panel assertions: hygiene badge correct, callout/confirmation rendering conditional on status, resumeRecap text in latestWork, checkpointCount/reason visible, blockers empty, no TypeScript errors, no console errors. No code changes were required.

**Final state verified:** TypeScript clean (`npx tsc --noEmit`, exit 0). API response at `http://localhost:3001/api/projects/1/plan` shows `checkpointHygiene:'ok'`, `hygieneNote:'Last checkpoint recorded 0 h ago.'`, `checkpointCount:24`, `lastCheckpointReason:'post-commit'`, `handoffCommand:'.holistic\\system\\holistic.cmd handoff'`, `blockers:[]`.

## Verification

1. `npx tsc --noEmit` — exit 0, no TypeScript errors.
2. API call to `http://localhost:3001/api/projects/1/plan` confirmed: checkpointHygiene:'ok', hygieneNote with timestamp, checkpointCount:24, lastCheckpointReason:'post-commit', handoffCommand:'.holistic\\system\\holistic.cmd handoff', nextAction.blockers:[]. All S02 fields present and correct.
3. T01 verification (from task summary): `OK` output with hygiene:ok, note, count:21, reason:post-commit, latestWork showing resumeRecap text, blockers empty. Exit 0.
4. T02 verification (from task summary): `npx tsc --noEmit` exit 0, curl confirmed handoffCommand present in continuity struct.
5. T03 browser verification (from task summary): all panel assertions passed — hygiene badge, conditional callout, resumeRecap latestWork, checkpointCount/reason, zero blockers, zero console errors.

## Requirements Advanced

- R003 — latestWork now prefers resumeRecap, checkpointCount/lastCheckpointReason are surfaced, and freshness is correctly derived from real Holistic state paths
- R012 — Visible hygiene callout with handoffCommand suggestion replaces the overlooked footnote; reminder is actionable and not naggy

## Requirements Validated

- R003 — API confirmed correct hygiene derivation, checkpointCount, lastCheckpointReason, and resumeRecap in latestWork. Browser-verified panel shows all fields.
- R012 — Visible callout box rendered in continuity panel when hygiene is stale/missing; compact confirmation shown when ok. handoffCommand string present in API response.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Server runs on port 3001 (not 3000 as in the task plan verification commands). A stale process from a prior session was holding port 3000. Verification adapted to 3001 accordingly. No functional deviation from plan scope.

## Known Limitations

None. All planned deliverables are present and verified.

## Follow-ups

None. S03 (workflow readiness detection) is next and depends on S01 only — it can proceed immediately.

## Files Created/Modified

- `server.js` — Fixed checkpoint key-path (passiveCapture.lastCheckpointAt / lastAutoCheckpoint), enriched continuity struct with checkpointCount/lastCheckpointReason/resumeRecap/handoffCommand, nuanced stale-continuity blocker logic in computeNextAction
- `src/App.tsx` — Replaced footnote hygiene note with conditional callout box (visible when stale/missing, compact confirmation when ok); extended ContinuityState interface for new fields; displays checkpointCount/lastCheckpointReason as secondary hygiene quality line
