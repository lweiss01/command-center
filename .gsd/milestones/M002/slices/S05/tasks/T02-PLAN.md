---
estimated_steps: 34
estimated_files: 1
skills_used: []
---

# T02: Portfolio state, card augmentation, and sort toggle in App.tsx

Add `PortfolioEntry` TypeScript interface, a `portfolioData` state (Map<number, PortfolioEntry>), lazy fetch of `/api/portfolio`, project card augmentation with phase/continuity/readiness badges, and a sort toggle (urgency vs name).

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

## Inputs

- `src/App.tsx`
- `server.js`

## Expected Output

- `src/App.tsx`

## Verification

npx tsc --noEmit && echo TS_OK
