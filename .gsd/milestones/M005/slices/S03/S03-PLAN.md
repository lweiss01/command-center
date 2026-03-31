# S03: Health panel in repo detail

**Goal:** Add healthScore, healthGrade, healthBreakdown, and repairQueue to the plan response. Add a Health panel to the repo detail view showing score, grade, contributor breakdown with severity labels, and staleness signals.
**Demo:** After this: After this: opening any repo shows a Health panel that summarizes its overall state in one place — no more hunting across five panels to understand what is wrong.

## Tasks
- [x] **T01: repoHealth and repairQueue added to plan response** — In the GET /api/projects/:id/plan route:
1. Call computeRepoHealth({ continuity, readiness, proofSummary, latestImportRunsByArtifact }) after the existing proofSummary computation
2. Call computeRepairQueue({ continuity, readiness, proofSummary, latestImportRunsByArtifact, milestones }) for the repair queue
3. Add to res.json: repoHealth: { score, grade, breakdown }, repairQueue

Also add repoHealth to the WorkflowState evidence entry that already mentions proof — no, keep them separate. repoHealth lives at the top level of the plan response, separate from workflowState.
  - Estimate: 20m
  - Files: server.js
  - Verify: GET /api/projects/1/plan includes repoHealth.score, repoHealth.grade, repoHealth.breakdown[], repairQueue[]. GET /api/projects/6/plan shows grade D and repairQueue with critical item.
- [x] **T02: Health panel with A-D grade, contributor breakdown bars, and staleness signals** — 1. Add types to App.tsx:
   - HealthBreakdownItem: { signal: string; label: string; contribution: number; maxContribution: number; status: 'ok'|'warn'|'danger'|'missing'; note: string }
   - RepoHealth: { score: number; grade: 'A'|'B'|'C'|'D'; breakdown: HealthBreakdownItem[] }
   - RepairItem: { priority: number; severity: 'critical'|'high'|'medium'|'low'; action: string; rationale: string; targetPanel: string }
   - Add repoHealth: RepoHealth | null and repairQueue: RepairItem[] to ProjectPlan

2. Add repoHealth state: const [repoHealth, setRepoHealth] = useState<RepoHealth|null>(null)
   Populate it from projectPlan.repoHealth after plan load (no extra fetch needed)

3. Add Health section to cockpit between Proof and Bootstrap Plan:
   - Section title='Health' sub='Overall repo operating health'
   - Header row: health score (as %) + grade badge (colored by healthGradeColor)
   - Breakdown list: for each contributor, show:
     • label (e.g. 'Continuity', 'Readiness')
     • a small status dot (ok=green, warn=amber, danger=red, missing=muted)
     • contribution bar (thin horizontal bar, contribution/maxContribution fill)
     • note text
   - Staleness callout: if any contributor status is 'danger' or 'missing', show a muted summary line
     e.g. '2 signals need attention'

4. No repair queue UI in this slice — that is S04.
  - Estimate: 45m
  - Files: src/App.tsx
  - Verify: Build clean. Health section renders between Proof and Bootstrap Plan. command-center shows A badge with all-green dots. paydirt-backend shows D with red/missing dots.
- [x] **T03: Browser verification passed for both healthy and degraded repos** — Start dev server + backend. Select command-center, assert Health section visible with grade A. Select paydirt-backend, assert Health section shows grade D. No console errors.
  - Estimate: 15m
  - Files: src/App.tsx, server.js
  - Verify: browser_assert: Health section visible, grade A for command-center, grade D for paydirt-backend, no console errors.
