---
estimated_steps: 39
estimated_files: 1
skills_used: []
---

# T02: Add Open Loops panel to App.tsx and browser-verify

Add TypeScript interfaces for the openLoops API shape, extend `ProjectPlan`, and render the Open Loops panel in the cockpit.

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

## Inputs

- `src/App.tsx`
- `server.js`

## Expected Output

- `src/App.tsx`

## Verification

npx tsc --noEmit && echo 'TypeScript OK'
