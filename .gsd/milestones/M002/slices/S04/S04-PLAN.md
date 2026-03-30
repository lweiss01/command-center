# S04: Repo drill-down for open loops

**Goal:** Add `computeOpenLoops()` to the backend and render an Open Loops panel in the cockpit that shows what's next, what's blocked, and what's still unresolved or deferred — so the repo view surfaces open questions rather than only listing imported entities.
**Demo:** After this: After this: a repo view shows what’s next, what’s blocked, and what’s still unresolved or under-defined instead of only imported entities.

## Tasks
- [x] **T01: Added computeOpenLoops() to server.js and wired openLoops into the plan route API response** — Add a `computeOpenLoops({ milestones, requirements, decisions })` function to server.js (after `computeReadiness`, before the route handlers) and call it in the plan route, adding `openLoops` to the JSON response.

The function signature and logic are fully specified in the slice research. Key implementation details:
- `nextMilestone`: first entry in milestones[] where `status !== 'done'` (milestones are already sorted by the DB query). Return the full milestone object so the UI can display key + title + status.
- `blockedMilestones`: filter milestones where `status === 'blocked'`, map to `{ key: m.externalKey, title: m.title, status: m.status }`.
- `unresolvedRequirements`: filter requirements where `status === 'active'` AND `validation !== 'validated'`, map to `{ key: r.externalKey, title: r.title, owner: r.primaryOwner }`. Note: `status` uses hyphenated values (`out-of-scope`) — these are already normalized by `normalizeRequirementStatus()`.
- `deferredItems`: filter requirements where `status === 'deferred'`, map to `{ key: r.externalKey, title: r.title }`.
- `revisableDecisions`: filter decisions where `d.revisable && d.revisable.toLowerCase().startsWith('yes')`, map to `{ key: d.externalKey, scope: d.scope, decision: d.decision }`. The `revisable` field is freeform text like 'Yes — if…'.
- `summary`: computed object with `{ unresolvedCount, pendingMilestoneCount, blockedCount, deferredCount }` where `pendingMilestoneCount = milestones.filter(m => m.status !== 'done').length`.

In the plan route (~line 2352): call `computeOpenLoops({ milestones, requirements, decisions })` after the existing four interpretation calls, then add `openLoops` to the `res.json({...})` response object.

Verify with node: start the server (if not already running on :3001), then run an inline fetch to assert the response shape.
  - Estimate: 30m
  - Files: server.js
  - Verify: node --input-type=module -e "const res = await fetch('http://localhost:3001/api/projects/1/plan'); const data = await res.json(); const ol = data.openLoops; console.assert(ol.nextMilestone !== null, 'nextMilestone null'); console.assert(ol.summary.unresolvedCount >= 1, 'unresolvedCount 0'); console.assert(ol.deferredItems.length >= 1, 'no deferred'); console.assert(ol.revisableDecisions.length >= 1, 'no revisable'); console.log('OK', JSON.stringify(ol.summary)); process.exit(0);"
- [x] **T02: Added OpenLoops TypeScript interfaces, extended ProjectPlan, and rendered the Open Loops panel in the cockpit with live data across all five sub-sections** — Add TypeScript interfaces for the openLoops API shape, extend `ProjectPlan`, and render the Open Loops panel in the cockpit.

**Interfaces to add** (insert with the other interpretation interfaces near the top of the interface block):
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
Extend `ProjectPlan` with `openLoops: OpenLoops`.

**Panel placement**: after the Next Action panel and before Import Controls/the imported entities sections. Find the closing `</div>` or section boundary after the Next Action panel and insert there.

**Panel content**:
- Heading: 'Open Loops' with sub-label 'What\'s next, blocked, and still unresolved.'
- A summary badge showing `unresolvedCount` unresolved + `deferredCount` deferred + `blockedCount` blocked
- **Next Milestone** sub-section: render `nextMilestone?.key` + `nextMilestone?.title` + status badge; if null, show 'All milestones complete'
- **Blocked** sub-section: only render if `blockedMilestones.length > 0`; list each blocked milestone
- **Unresolved Requirements** sub-section: render first 5 items with key + title + owner; if more than 5, show '+ N more' line
- **Deferred Items** sub-section: list all `deferredItems` (typically 3) with key + title
- **Revisable Decisions** sub-section: list `revisableDecisions` with scope + decision text
- Guard the entire panel with `projectPlan?.openLoops` existence check (same pattern as readiness panel)

Styling: follow the established cockpit panel pattern (same section wrapper, heading, badge classes as readiness/continuity panels).

After implementing: run `npx tsc --noEmit`, then browser-verify the running app.
  - Estimate: 45m
  - Files: src/App.tsx
  - Verify: npx tsc --noEmit && echo 'TypeScript OK'
