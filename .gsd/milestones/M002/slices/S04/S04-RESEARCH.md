# S04 Research: Repo drill-down for open loops

## Summary

Straightforward slice. All the raw material is already in the plan API response and the DB. S04 needs a new `computeOpenLoops()` backend function (analogous to `computeReadiness`) that distills the imported milestones, requirements, and decisions into a curated "what's next / what's blocked / what's still up in the air" struct, then a new UI panel to render it. No new parsing, no new DB tables, no new external dependencies. Pattern mirrors S03 exactly: T01 (backend) + T02 (UI + browser verification).

## Requirements This Slice Owns or Supports

- **R006** (primary): "A repo view must show where things are, what's next up, and what is still up in the air instead of only listing imported planning entities." — directly served by the open loops panel.
- **R011** (primary): "Command Center must preserve and surface discussion/research context… 'What's still up in the air' is part of the product." — the deferredItems and revisableDecisions sections serve this.
- **R003** (supporting): continuity struct already provides `latestWork`; open loops can surface it as resume context alongside the loop count.

## Implementation Landscape

### Current plan route response shape

`GET /api/projects/:id/plan` returns:
```
{ project, milestones, slices, tasks, requirements, decisions, importRuns,
  latestImportRun, latestImportRunsByArtifact, workflowState, continuity, readiness, nextAction }
```

All four interpretation functions (`computeWorkflowState`, `computeContinuity`, `computeReadiness`, `computeNextAction`) are defined as sync functions in `server.js` before the route. `computeOpenLoops` should be added in the same location, called in the same route handler.

### DB state (project 1, live)

- **20 requirements**: 14 active/mapped, 1 validated, 3 deferred, 3 out-of-scope
- **6 milestones**: M001 done, M002-M006 planned (no blocked entries currently)
- **Decisions**: imported with external_key, scope, decision, choice, rationale, revisable columns — most `revisable = 'Yes'`
- `slices` and `planning_tasks` tables are present but empty for this project (no slice/task parsers built yet)

This means open loops must work entirely from milestones, requirements, and decisions. That's fine — those three sources contain the entire currently-importable planning contract.

### What "open loops" means concretely

Three buckets map to R006's language:

1. **What's next** — first `planned` milestone in sort order. This is the clearest answer to "where do I go next."
2. **What's blocked** — milestones with `status = 'blocked'`. Currently none, but the schema supports it.
3. **What's up in the air** — two distinct sub-signals:
   - Active requirements that are still unvalidated (`status='active'` and `validation='mapped'`) — these are capability commitments not yet proven. Count = 12 for this project.
   - Deferred requirements (`status='deferred'`) — explicitly kicked down the road. Count = 3. Per R011, these are the "discussion uncertainty" items the product must keep visible.
   - Revisable decisions (`revisable` starts with 'Yes') — architectural choices that could still change.

### Avoiding duplication with existing sections

The existing "Imported Milestones," "Imported Requirements," and "Imported Decisions" sections show the full lists. The open loops panel should be a **distilled attention surface**, not a second copy. Key distinction: open loops shows counts + the highest-priority items, not every entity. A user should be able to scan it in seconds.

Suggested display:
- `nextMilestone`: one card (key + title + status)
- `blockedMilestones[]`: compact list (usually empty)
- `unresolvedRequirements[]`: first 5 with key + title + owner; remainder as count
- `deferredItems[]`: all deferred requirements (small set, always worth showing)
- `revisableDecisions[]`: only where revisable contains 'Yes'
- `summary`: counts for the panel header badge

## Proposed API Shape

```js
function computeOpenLoops({ milestones, requirements, decisions }) {
  // nextMilestone: first non-done milestone in sort order
  const nextMilestone = milestones.find(m => m.status !== 'done') ?? null;

  // blockedMilestones
  const blockedMilestones = milestones.filter(m => m.status === 'blocked')
    .map(m => ({ key: m.externalKey, title: m.title, status: m.status }));

  // unresolvedRequirements: active + not yet validated
  const unresolvedRequirements = requirements
    .filter(r => r.status === 'active' && r.validation !== 'validated')
    .map(r => ({ key: r.externalKey, title: r.title, owner: r.primaryOwner }));

  // deferredItems: deferred requirements (explicitly deferred = "still up in the air")
  const deferredItems = requirements
    .filter(r => r.status === 'deferred')
    .map(r => ({ key: r.externalKey, title: r.title }));

  // revisableDecisions: decisions that could still change
  const revisableDecisions = decisions
    .filter(d => d.revisable && d.revisable.toLowerCase().startsWith('yes'))
    .map(d => ({ key: d.externalKey, scope: d.scope, decision: d.decision }));

  return {
    nextMilestone,
    blockedMilestones,
    unresolvedRequirements,
    deferredItems,
    revisableDecisions,
    summary: {
      unresolvedCount: unresolvedRequirements.length,
      pendingMilestoneCount: milestones.filter(m => m.status !== 'done').length,
      blockedCount: blockedMilestones.length,
      deferredCount: deferredItems.length,
    }
  };
}
```

## TypeScript Interface (App.tsx)

```ts
interface OpenLoopItem {
  key: string | null;
  title?: string;
  status?: string;
  owner?: string | null;
  scope?: string | null;
  decision?: string;
}

interface OpenLoopsSummary {
  unresolvedCount: number;
  pendingMilestoneCount: number;
  blockedCount: number;
  deferredCount: number;
}

interface OpenLoops {
  nextMilestone: OpenLoopItem | null;
  blockedMilestones: OpenLoopItem[];
  unresolvedRequirements: OpenLoopItem[];
  deferredItems: OpenLoopItem[];
  revisableDecisions: OpenLoopItem[];
  summary: OpenLoopsSummary;
}
```

Add `openLoops: OpenLoops` to `ProjectPlan`.

## UI Panel Placement

Insert the Open Loops panel **after** the Next Action section and **before** Import Controls. The cockpit panel order becomes:

1. Workflow State
2. Workflow Readiness
3. Continuity
4. Next Action
5. **Open Loops** ← new
6. Import Controls
7. Imported Milestones / Requirements / Decisions

The panel heading should be "Open Loops" with a sub-label like "What's next, blocked, and still unresolved."

## Task Decomposition

**T01 — computeOpenLoops in server.js + plan route**
- Add `computeOpenLoops({ milestones, requirements, decisions })` function
- Call it in the plan route handler; pass `{ milestones, requirements, decisions }`
- Add `openLoops` to the JSON response
- Verify: `node --input-type=module` script hitting `http://localhost:3001/api/projects/1/plan`, assert `openLoops.summary.unresolvedCount >= 1`, `openLoops.nextMilestone` present, array shapes correct
- Files: `server.js`

**T02 — Open Loops panel in App.tsx + browser verification**
- Add `OpenLoopItem`, `OpenLoopsSummary`, `OpenLoops` interfaces
- Extend `ProjectPlan` with `openLoops: OpenLoops`
- Render panel with four sub-sections: Next Milestone, Blocked (conditional), Unresolved Requirements (with cap at 5 + remainder count), Deferred Items, Revisable Decisions
- `npx tsc --noEmit` exit 0
- Browser: assert panel title visible, nextMilestone card visible, unresolvedCount > 0 visible, no console errors
- Files: `src/App.tsx`

## Verification Commands

```bash
# T01 API verification
node --input-type=module -e "
const res = await fetch('http://localhost:3001/api/projects/1/plan');
const data = await res.json();
const ol = data.openLoops;
console.log('nextMilestone:', ol.nextMilestone?.key);
console.log('summary:', JSON.stringify(ol.summary));
console.log('unresolvedReqs:', ol.unresolvedRequirements.length);
console.log('deferred:', ol.deferredItems.length);
console.log('revisable decisions:', ol.revisableDecisions.length);
"

# T02 type check
npx tsc --noEmit
```

## Constraints and Gotchas

- `slices` and `planning_tasks` tables are empty for the live project — open loops must work from milestones/requirements/decisions only. Do not query those tables for S04.
- `computeOpenLoops` receives the already-serialized camelCase objects (the same arrays passed to `computeWorkflowState` and `computeNextAction`), not raw DB rows — field names are `externalKey`, `status`, `validation`, `primaryOwner`, `revisable`, etc.
- `decisions.revisable` is a freeform text field ("Yes — if…" format). Use `.toLowerCase().startsWith('yes')` for reliable filtering.
- `requirements.status` uses `out-of-scope` (hyphenated). The active/deferred/validated/out-of-scope values come from `normalizeRequirementStatus()` — they are already lowercased.
- The existing `computeNextAction` already mentions "partial readiness" gaps in blockers[]. Open loops should NOT duplicate those blocker strings — it owns capability-level unresolved items, not stack readiness gaps.
- Port is 3001 (not 3000) — confirmed in S02 summary and server.js `const PORT = 3001`.
- Windows: cwd-relative temp files if needed; no `/tmp/`.

## No New Libraries Needed

React, TypeScript, Tailwind — all already in use. No additional packages.
