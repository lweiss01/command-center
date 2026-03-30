# S05 Research: Cross-repo prioritization view

**Slice:** S05 — Cross-repo prioritization view
**Depends on:** S02, S03, S04
**Requirement primary owner:** R002

---

## Summary

This is targeted research. The patterns, contracts, and signals needed for S05 all exist in the codebase already. The slice requires: (a) a new backend endpoint that runs all interpretation functions across all projects and returns a ranked portfolio summary, and (b) a UI upgrade to the project card grid that shows the signals needed to prioritize attention without clicking into each repo. No new libraries, no unfamiliar APIs. The work is mechanical application of established patterns to a new aggregation scope.

---

## Requirement Coverage

**R002 — Cross-repo prioritization view** is the primary owner. The requirement asks the user to see across repos which ones are current, stale, blocked, unresolved, or most deserving of time next — without manually re-loading context for each one. R002 also explicitly requires honest comparisons: avoid fake precision.

**R001, R008** are supported: the portfolio view must remain explainable (imported facts vs interpreted conclusions) and minimize hidden state.

---

## Implementation Landscape

### Existing signals available per project

All four interpretation functions exist and run per-project in `GET /api/projects/:id/plan`. For S05 we need to run them across all projects:

| Signal | Source | Value for comparison |
|---|---|---|
| `workflowState.phase` | computeWorkflowState | 'active' / 'stalled' / 'no-data' / 'blocked' / 'import-only' |
| `workflowState.confidence` | computeWorkflowState | 0–1 float |
| `continuity.status` | computeContinuity | 'fresh' / 'stale' / 'missing' |
| `continuity.ageHours` | computeContinuity | number or null |
| `continuity.checkpointHygiene` | computeContinuity | 'ok' / 'stale' / 'missing' |
| `readiness.overallReadiness` | computeReadiness | 'ready' / 'partial' / 'missing' |
| `readiness.gaps` | computeReadiness | string[] |
| `openLoops.summary` | computeOpenLoops | { unresolvedCount, pendingMilestoneCount, blockedCount, deferredCount } |
| `nextAction.action` | computeNextAction | first-line action string |

### Live data snapshot (7 projects, checked during research)

| Repo | Phase | Confidence | Continuity | Hygiene | Readiness | Unresolved | Pending |
|---|---|---|---|---|---|---|---|
| command-center | active | 1.0 | fresh | ok | partial | 13 | 5 |
| holistic | active | 0.6 | missing | missing | partial | 14 | 3 |
| paydirt | active | 0.65 | stale | ok | partial | 0 | 5 |
| newsthread | no-data | 0.15 | stale | ok | partial | 0 | 0 |
| filetrx | no-data | 0.15 | stale | missing | partial | 0 | 0 |
| pdf2epub | (partial, not checked) | | | | | | |
| paydirt-backend | no-data | 0 | missing | missing | missing | 0 | 0 |

This is exactly the kind of diversity the view needs to handle — repos at very different stages with different attention signals.

---

## Design: New backend endpoint

### `GET /api/portfolio`

Runs all interpretation functions across all projects and returns a ranked list of portfolio entries. Each entry is a lightweight summary — no milestones/requirements/decisions arrays, no raw imported entities. The response should be fast enough to load alongside the project list.

**Per-project computation:**
1. Fetch all projects via existing `listProjects` prepared statement
2. For each project, run `computeContinuity`, `computeReadiness`, plus lightweight versions of artifact counts from DB queries
3. Run `computeWorkflowState` and `computeOpenLoops` with the artifact data
4. Compute an `urgencyScore` (0–1) — explainable, additive, conservative — to rank by attention priority

**urgencyScore design** (additive fixed-increment, consistent with Knowledge Register philosophy):
- `+0.40` if continuity is fresh (repo is actively being worked on)
- `+0.25` if there are unresolved requirements (unresolvedCount > 0)
- `+0.20` if phase is 'stalled' or 'no-data' with a recent continuity (abandoned mid-flight is urgent)
- `+0.15` if readiness has gaps (workflow stack needs fixing)
- Descending sort by urgencyScore → repos needing most attention appear first

Alternative: sort by `continuity.ageHours ASC` (most recently active first). This is simpler but may not surface repos that are stalled-and-important. The scoring approach is better for R002's goal.

**Portfolio entry shape:**
```typescript
interface PortfolioEntry {
  project: Project;               // from serializeProjectRow
  workflowPhase: string;          // workflowState.phase
  workflowConfidence: number;     // workflowState.confidence
  continuityStatus: string;       // 'fresh' | 'stale' | 'missing'
  continuityAgeHours: number | null;
  checkpointHygiene: string;      // 'ok' | 'stale' | 'missing'
  overallReadiness: string;       // 'ready' | 'partial' | 'missing'
  readinessGaps: string[];
  unresolvedCount: number;
  pendingMilestoneCount: number;
  blockedCount: number;
  nextActionLabel: string;        // short first line of nextAction.action
  urgencyScore: number;
}
```

**Endpoint skeleton:**
```js
app.get('/api/portfolio', (_req, res) => {
  const projects = listProjects.all().map(serializeProjectRow);
  const entries = projects.map(project => {
    // ... DB queries for this project's milestones/requirements/decisions
    const continuity = computeContinuity(project);
    const readiness = computeReadiness(project);
    const workflowState = computeWorkflowState({ milestones, requirements, decisions, continuity, readiness, latestImportRunsByArtifact });
    const nextAction = computeNextAction({ milestones, requirements, decisions, workflowState, continuity, readiness });
    const openLoops = computeOpenLoops({ milestones, requirements, decisions });
    const urgencyScore = computeUrgencyScore({ continuity, readiness, openLoops, workflowState });
    return { project, workflowPhase: workflowState.phase, ... };
  });
  entries.sort((a, b) => b.urgencyScore - a.urgencyScore);
  return res.json(entries);
});
```

**Performance note:** This runs per-project synchronously on a single request. With 7 projects and 2 tool probes per project, the worst case is ~14 × 2s tool timeouts = 28s. The `execFileSync` calls in `computeReadiness` are the bottleneck. The existing code uses `timeout: 2000` per call. For a portfolio endpoint that may have 10+ repos, this becomes a real latency issue.

**Resolution:** The portfolio endpoint should skip the machine-tool probe (the `execFileSync` calls for `holistic --version` and `gsd --version`) and instead use a cached or project-level readiness result. Two options:
1. Accept the latency and document it (simplest, works for small workspaces — 7 repos × 2 calls × 0.01s typical = ~0.14s, tool probes are fast when installed)
2. Call `computeReadiness` but memoize tool availability at request time (check holistic/gsd once per portfolio request, reuse across projects)

The memo approach is correct here: tool availability is machine-level, not per-repo. Two probes total regardless of repo count.

---

## Design: UI changes

### Project card augmentation

The existing project card shows: icon, type label, planning status badge, name, rootPath, artifact count, git/local. For cross-repo prioritization the card needs to show at minimum:
- **Continuity freshness** — the #1 "where did I leave off" signal
- **Workflow phase** — active / stalled / no-data / blocked
- **Readiness** — partial gaps warning
- **Urgency rank** — implicit via sort order, not a raw number (users don't want to see "urgency: 0.63")

**Approach options:**

**Option A — Enrich the existing project card grid** with 2-3 inline signal badges (freshness, phase, readiness) and sort the card grid by urgencyScore instead of name. This is the minimal change: no new views, no new routes in the UI.

**Option B — Add a separate "Portfolio" or "Overview" view** alongside the card grid, showing a table/list sorted by urgency. Keeps the original card grid unmodified.

**Option C — Enrich cards AND add a toggle for "sort by urgency" vs "sort by name"** — best of both but more surface area.

**Recommendation: Option A** — enrich the card grid and sort by urgency by default (with a toggle to restore name sort). The cards already have room for 2-3 additional signal badges. This avoids adding new views/routes while directly delivering R002. The portfolio endpoint backs the card data.

### What to show on the card

Current: type, planning status, artifact count, git/local.
Add: continuity status badge, workflow phase badge, readiness status (if gaps). Remove/replace: "artifact count" (less useful than live signals) — keep it but demote to secondary.

The card should be scannable at a glance:
- Top-right badges: type, planning status (existing) → add phase, continuity
- Bottom: artifact count / git → add "N unresolved" if > 0, readiness gap count if > 0

### Loading strategy

**Option A (lazy, per-project):** Load portfolio data lazily — fetch `/api/portfolio` separately after the project list loads. Show skeleton badges while loading, replace with real data on arrival. This avoids blocking the project list on interpretation.

**Option B (eager, single endpoint):** Replace `/api/projects` with `/api/portfolio` and include per-project signals inline. Simpler but slower to initial paint.

**Recommendation: Option A (lazy)** — load project list immediately from `/api/projects`, then fire a single `/api/portfolio` request, merge the results, re-render the cards. No user-visible delay for the project list.

---

## Task Decomposition Recommendation

**T01 — computeUrgencyScore + `/api/portfolio` endpoint (server.js)**
- Add `computeUrgencyScore({ continuity, readiness, openLoops, workflowState })` pure function
- Add `GET /api/portfolio` route using memoized tool probes (compute holistic/gsd availability once, inject into all `computeReadiness` calls for this request)
- Verify with live curl: portfolio returns 7 entries, entries sorted by urgencyScore desc, entry shape matches contract

**T02 — Portfolio state + card augmentation (src/App.tsx)**
- Add `PortfolioEntry` TypeScript interface
- Add `portfolioData` state (Map<projectId, PortfolioEntry> or array)
- Fetch `/api/portfolio` after project list loads, merge into card render
- Augment project card to show: phase badge, continuity badge, readiness gap indicator, N unresolved (when > 0)
- Sort card grid by urgencyScore by default, add name-sort toggle
- Verify: TypeScript clean, cards show live signals, sort toggle works, no console errors

---

## Key Constraints and Risks

1. **computeReadiness tool probes are synchronous and per-project** — memoize tool availability at the portfolio request level to avoid N×2 tool probes. This is the only performance risk.

2. **urgencyScore must be honest** — avoid weighting signals in ways that make stale repos always appear urgent. A repo with `continuity: missing` and `openLoops.unresolvedCount: 0` is a blank slate, not necessarily high urgency. Design the scoring to surface repos where *active work is stalled* over repos that simply haven't been started.

3. **No fake precision** — urgencyScore should drive sort order, not be displayed as a raw number. The card badges (fresh/stale/missing, phase) are the honest signals; the score is just the ranking mechanism.

4. **Card layout must remain readable** — adding 3+ badges to an already-badged card risks clutter. Keep additions concise: 1 continuity badge (colored dot or word), 1 phase badge, 1 gaps indicator. Demote artifact count.

5. **R014 anti-bloat** — the portfolio view must not creep toward a full dashboard with charts, progress bars, or scores. Signals on cards + urgency sort is the scope limit.

---

## Files Involved

| File | Change | Size estimate |
|---|---|---|
| `server.js` | Add `computeUrgencyScore()` + `GET /api/portfolio` | +60 lines |
| `src/App.tsx` | Add `PortfolioEntry` interface, portfolio state/fetch, card augmentation, sort toggle | +80 lines |

No new dependencies. No schema changes.

---

## Verification Plan

**T01:**
```
curl http://localhost:3001/api/portfolio > check.json && node -e "const d=require('fs').readFileSync('check.json','utf8'); const p=JSON.parse(d); console.log('Count:', p.length); p.forEach(e => console.log(e.project.name, '| urgency:', e.urgencyScore, '| phase:', e.workflowPhase, '| continuity:', e.continuityStatus))"
```
Expected: 7 entries, sorted descending by urgencyScore.

**T02:**
- `npx tsc --noEmit` → exit 0
- Browser: phase + continuity badges visible on project cards
- Browser: `command-center` (fresh, active) appears before `paydirt-backend` (missing, no-data) in card grid
- Browser: sort toggle changes order
- `no_console_errors`
