# S05: Cross-repo prioritization view

**Goal:** Add a cross-repo portfolio view: a new `/api/portfolio` endpoint that runs all interpretation functions across all projects and ranks them by urgency, and a card-grid upgrade in App.tsx that shows phase, continuity, and readiness signals per card with an urgency-based sort.
**Demo:** After this: After this: the user can compare repos by freshness, readiness, unresolved work, and urgency without manually reading each repo first.

## Tasks
- [x] **T01: Added computeUrgencyScore pure function and GET /api/portfolio endpoint to server.js; endpoint returns all projects sorted by urgency score descending with phase, continuity, and readiness signals per entry** — Add a pure `computeUrgencyScore({ continuity, readiness, openLoops, workflowState })` function and a `GET /api/portfolio` route to server.js. The route runs all interpretation functions across all projects, memoizes the two tool probes (holistic + gsd) at request time rather than once-per-project, sorts entries by urgencyScore descending, and returns the portfolio array.

### Steps

1. Add optional `toolOverrides?: { holisticStatus: 'present' | 'missing'; gsdStatus: 'present' | 'missing' }` parameter to `computeReadiness(project, toolOverrides?)`. When toolOverrides is provided, use those statuses for the 'holistic-tool' and 'gsd-tool' components instead of calling execFileSync. This makes the portfolio route able to probe once and reuse across all projects.

2. Add `computeUrgencyScore({ continuity, readiness, openLoops, workflowState })` as a pure function. Use additive fixed increments (consistent with the Knowledge Register scoring philosophy):
   - +0.40 if `continuity.status === 'fresh'` (actively worked)
   - +0.25 if `openLoops.summary.unresolvedCount > 0` (unresolved requirements)
   - +0.20 if `(workflowState.phase === 'stalled' || workflowState.phase === 'no-data') && continuity.status !== 'missing'` (abandoned mid-flight)
   - +0.15 if `readiness.gaps.length > 0` (stack needs fixing)
   - Return a 0–1 float (capped at 1.0, summed without normalization).

3. Add `GET /api/portfolio` route after the existing `/api/projects/:id/plan` route:
   a. Probe tool availability once: call `toolStatus('holistic.cmd'/'holistic')` and `toolStatus('gsd.cmd'/'gsd')` at the top of the handler, before the project loop. Store results as `holisticToolStatus` and `gsdToolStatus`.
   b. Fetch all projects via `listProjects.all().map(serializeProjectRow)`.
   c. For each project: run `listMilestonesByProjectId`, `listRequirementsByProjectId`, `listDecisionsByProjectId`, `listImportRunsByProjectId`, build `latestImportRunsByArtifact`, then call `computeContinuity`, `computeReadiness(project, { holisticStatus: holisticToolStatus, gsdStatus: gsdToolStatus })`, `computeWorkflowState`, `computNextAction`, `computeOpenLoops`, `computeUrgencyScore`.
   d. Assemble a `PortfolioEntry` object per project:
      - `project`: serializeProjectRow result
      - `workflowPhase`: workflowState.phase
      - `workflowConfidence`: workflowState.confidence
      - `continuityStatus`: continuity.status
      - `continuityAgeHours`: continuity.ageHours
      - `checkpointHygiene`: continuity.checkpointHygiene
      - `overallReadiness`: readiness.overallReadiness
      - `readinessGaps`: readiness.gaps
      - `unresolvedCount`: openLoops.summary.unresolvedCount
      - `pendingMilestoneCount`: openLoops.summary.pendingMilestoneCount
      - `blockedCount`: openLoops.summary.blockedCount
      - `nextActionLabel`: first non-empty line of nextAction.action
      - `urgencyScore`: result of computeUrgencyScore
   e. Sort entries by `urgencyScore` descending.
   f. Return `res.json(entries)` wrapped in try/catch with 500 on error.

4. Note: the `toolStatus` helper is defined inside `computeReadiness` currently. Extract it or inline the probes at the portfolio route level — do not call the inner `toolStatus` from outside. The cleanest approach is to duplicate the two-line probe at the route level (same pattern: execFileSync with timeout 2000, catch → 'missing').
  - Estimate: 45m
  - Files: server.js
  - Verify: curl -s http://localhost:3001/api/portfolio > check.json && node -e "const d=require('fs').readFileSync('check.json','utf8'); const p=JSON.parse(d); console.log('Count:', p.length); let prevScore=2; let sorted=true; p.forEach(e => { if(e.urgencyScore>prevScore) sorted=false; prevScore=e.urgencyScore; console.log(e.project.name, '| urgency:', e.urgencyScore, '| phase:', e.workflowPhase, '| continuity:', e.continuityStatus); }); console.log('Sorted desc:', sorted); require('fs').unlinkSync('check.json');" && echo OK
- [x] **T02: Added PortfolioEntry interface, lazy /api/portfolio fetch, phase/continuity/gaps badges on project cards, skeleton loading state, and urgency/name sort toggle** — Add `PortfolioEntry` TypeScript interface, a `portfolioData` state (Map<number, PortfolioEntry>), lazy fetch of `/api/portfolio`, project card augmentation with phase/continuity/readiness badges, and a sort toggle (urgency vs name).

### Steps

1. Add `PortfolioEntry` interface after the existing `ProjectPlan` interface:
```typescript
interface PortfolioEntry {
  project: Project;
  workflowPhase: string;
  workflowConfidence: number;
  continuityStatus: 'fresh' | 'stale' | 'missing';
  continuityAgeHours: number | null;
  checkpointHygiene: 'ok' | 'stale' | 'missing';
  overallReadiness: 'ready' | 'partial' | 'missing';
  readinessGaps: string[];
  unresolvedCount: number;
  pendingMilestoneCount: number;
  blockedCount: number;
  nextActionLabel: string;
  urgencyScore: number;
}
```

2. Add state in the App component:
   - `const [portfolioData, setPortfolioData] = useState<Map<number, PortfolioEntry>>(new Map())`
   - `const [portfolioLoading, setPortfolioLoading] = useState(false)`
   - `const [projectSortMode, setProjectSortMode] = useState<'urgency' | 'name'>('urgency')`

3. Add a `useEffect` that fires after projects are loaded (depend on `projects`). When `projects.length > 0`, fetch `/api/portfolio`, convert the array to a `Map<number, PortfolioEntry>` keyed by `entry.project.id`, and call `setPortfolioData`. Wrap in try/catch (silent failure — cards degrade gracefully without badges).

4. Update `filteredProjects` useMemo to also apply the sort:
   - After filtering, sort the result array: if `projectSortMode === 'urgency'`, sort by `portfolioData.get(p.id)?.urgencyScore ?? -1` descending; if `'name'`, sort alphabetically by `p.name`. Return the sorted array.

5. Add a sort toggle control above the project grid (near the search bar area). A small button or toggle: "Sort: Urgency" / "Sort: Name" that calls `setProjectSortMode(prev => prev === 'urgency' ? 'name' : 'urgency')`. Style consistent with existing controls (small uppercase text-xs button or pill).

6. Augment the project card rendering. After the existing top-right badges (typeLabel + planningStatus), add portfolio signal badges when `portfolioData.has(project.id)`:
   a. **Phase badge** — uses `getWorkflowPhaseClassName(entry.workflowPhase as WorkflowState['phase'])`, label: phase value (e.g. 'active', 'stalled')
   b. **Continuity badge** — uses `getContinuityStatusClassName(entry.continuityStatus)`, label: e.g. 'fresh 2h' (if ageHours < 24) or 'stale' or 'missing'. Format: if fresh and ageHours !== null, show `fresh ${Math.round(entry.continuityAgeHours)}h`; otherwise just the status word.
   c. **Gaps indicator** — if `entry.readinessGaps.length > 0 || entry.unresolvedCount > 0`, show a small bottom-of-card indicator line: e.g. "2 gaps · 13 unresolved" in `text-slate-500`. Only render if at least one signal is non-zero.

7. Show a skeleton badge (e.g. a dimmed gray pill with '···') in the top-right badge area while `portfolioLoading` is true, so the card layout doesn't shift when data arrives.

8. Run `npx tsc --noEmit` to verify TypeScript compiles clean.
  - Estimate: 45m
  - Files: src/App.tsx
  - Verify: npx tsc --noEmit && echo TS_OK
