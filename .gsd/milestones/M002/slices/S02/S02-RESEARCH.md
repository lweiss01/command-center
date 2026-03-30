# S02: Continuity and checkpoint hygiene — Research

**Date:** 2026-03-28

## Summary

S01 established the continuity struct (`status`, `freshAt`, `ageHours`, `latestWork`, `checkpointHygiene`, `hygieneNote`) and the cockpit panel that renders it. The panel works but it treats hygiene as a secondary detail: `hygieneNote` is rendered in tiny slate-500 text at the bottom of the panel, and no actionable command is surfaced to the user. S02 must make hygiene reminders prominent and actionable rather than footnote-level.

Two concrete bugs were also discovered during research. First, `computeContinuity` resolves `checkpointAt` as `holisticState.lastCheckpointAt ?? holisticState.lastHandoffAt`, but neither of these keys exists at the top level of `state.json`. The actual key is `holisticState.passiveCapture.lastCheckpointAt` (currently `null` when no explicit checkpoint was written) and `holisticState.lastAutoCheckpoint` (a top-level timestamp that Holistic writes after passive capture runs). The result is that every repo with a Holistic state file shows `checkpointHygiene: 'stale'` with the note "No explicit checkpoint timestamp found" even when an auto-checkpoint exists. Second, `computeNextAction` currently treats any non-fresh continuity status as a hard blocker, but a fresh state with a stale checkpoint is not the same risk level as truly missing continuity — the blocker is over-broad.

The slice delivers R003 (continuity freshness and memory surfaces) and R012 (checkpoint hygiene reminders). The work is well-understood: fix the key path, enrich the latestWork signal from the richer state fields, and update the UI panel to show a visible reminder callout (not footnote text) with a concrete `holistic handoff` command suggestion when hygiene is stale or missing.

## Recommendation

Three changes, in order:

1. **Fix `computeContinuity` checkpoint resolution** — read `holisticState.passiveCapture?.lastCheckpointAt ?? holisticState.lastAutoCheckpoint ?? holisticState.lastHandoffAt ?? null`. This surfaces the auto-checkpoint timestamp when an explicit checkpoint was not run.

2. **Enrich `latestWork`** — `resumeRecap[]` in `activeSession` is the highest-quality single summary (it is what Holistic writes as a recap sentence array). Prefer `resumeRecap[0]` over raw `currentGoal` or `latestStatus` when present. Also expose `checkpointCount` and `lastCheckpointReason` so the panel can show "21 passive captures, last reason: post-commit" as a hygiene quality signal.

3. **Upgrade the hygiene reminder in App.tsx** — replace the buried `hygieneNote` footnote with a visible callout box when `checkpointHygiene` is 'stale' or 'missing'. The callout should show the note text and a concrete suggested command: `.holistic/system/holistic handoff` (or the Windows `.cmd` equivalent). When hygiene is 'ok', show a compact confirmation line instead.

The `computeNextAction` blocker logic also needs a nuance fix: treat `continuity.status === 'missing'` as a hard blocker (no state file) but treat `status === 'stale'` only as a blocker when `checkpointHygiene` is also 'missing'. A stale-but-present continuity with recent auto-checkpoint is a reminder, not a full blocker.

## Implementation Landscape

### Key Files

- `server.js` — `computeContinuity()` (line ~932) needs the checkpoint key-path fix and enriched `latestWork`. `computeNextAction()` (line ~1022) needs the nuanced stale/hygiene blocker logic. No new functions needed.
- `src/App.tsx` — Continuity panel (line ~662–695) needs the hygiene callout upgrade. `ContinuityState` interface may need two new optional fields: `checkpointCount?: number` and `lastCheckpointReason?: string | null`.

### State.json structure (confirmed from live state file)

```
{
  version, projectName, createdAt, updatedAt,
  activeSession: {
    updatedAt, currentGoal, latestStatus, checkpointCount, lastCheckpointReason,
    resumeRecap: string[]   // ← best single-line summary
  },
  lastHandoff: null | {...},
  passiveCapture: {
    lastCheckpointAt: null | ISO string   // ← primary checkpoint timestamp
  },
  lastAutoCheckpoint: ISO string   // ← fallback — Holistic writes this after passive runs
}
```

**Checkpoint resolution order (fixed):**
`holisticState.passiveCapture?.lastCheckpointAt ?? holisticState.lastAutoCheckpoint ?? holisticState.lastHandoffAt ?? null`

**latestWork resolution order (enriched):**
`activeSession.resumeRecap?.[0] ?? activeSession.currentGoal ?? activeSession.latestStatus ?? holisticState.lastSummary ?? null`

### Build Order

1. Fix `computeContinuity` in `server.js` — checkpoint key path + latestWork enrichment + expose `checkpointCount`/`lastCheckpointReason`. This is the root cause of the hygiene signal being wrong.
2. Fix `computeNextAction` blocker nuance — stale-only is a soft reminder, not a hard blocker.
3. Update `ContinuityState` interface in `App.tsx` and the hygiene panel to show the callout.
4. Browser-verify the cockpit shows correct hygiene status and callout for a repo with an auto-checkpoint but no explicit checkpoint.

### Verification Approach

- `npx tsc --noEmit` → 0 errors
- `GET /api/projects/1/plan` — confirm `continuity.checkpointHygiene` reflects `lastAutoCheckpoint` age correctly (should be 'ok' for command-center itself, which has a recent auto-checkpoint)
- Browser: Continuity panel shows hygiene callout prominently (not footnote) when stale; shows a suggested command string; 'ok' hygiene shows compact confirmation line instead
- `nextAction.blockers` should be empty for a repo with fresh continuity and ok/stale checkpoint (stale-only is no longer a hard blocker)

## Common Pitfalls

- **Windows path in command suggestion** — the handoff command differs by OS. Render the command as a code block with the appropriate path for the platform. Since this is a local web app the server can detect `process.platform === 'win32'` and return the right command string, or the UI can display both.
- **null vs missing distinction** — `passiveCapture.lastCheckpointAt: null` means Holistic is present but no explicit checkpoint was run. `lastAutoCheckpoint` being present means passive capture ran. Don't conflate the two — they have different hygiene implications.
- **resumeRecap may be an empty array** — fall back to `currentGoal` if `resumeRecap[0]` is undefined.
- **Don't block on stale+ok** — a repo that has been worked on recently but without an explicit handoff is still actionable. The blocker should only fire when continuity is entirely missing or when status is stale AND hygiene is missing (no auto-checkpoint, no explicit checkpoint).
