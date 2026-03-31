# S01: computeRepoHealth — health score and repair queue functions

**Goal:** Write computeRepoHealth and computeRepairQueue as pure functions in server.js, consuming already-computed signals. Test both against real repos before wiring into routes.
**Demo:** After this: After this: computeRepoHealth and computeRepairQueue exist as pure functions and produce correct output for both a healthy repo and a broken one.

## Tasks
- [x] **T01: Wrote computeRepoHealth — 5-contributor health score with named breakdown** — Write computeRepoHealth({ continuity, readiness, workflowState, proofSummary, latestImportRunsByArtifact }) in server.js.

Health contributors (additive, each named):
- continuity_status: +0.25 if fresh, +0.10 if stale, +0 if missing
- checkpoint_hygiene: +0.15 if ok, +0.05 if stale, +0 if missing
- readiness: +0.20 if ready, +0.10 if partial, +0 if missing
- import_recency: +0.20 if any import within 7 days, +0.10 if within 30 days, +0 if older/never
- proof_coverage: +0.20 if proofSummary.proven > 0, proportional up to +0.20 (proven/total * 0.20)

Total max = 1.0. Cap at 1.0.

Grade:
- A: score >= 0.80
- B: score >= 0.60
- C: score >= 0.35
- D: score < 0.35

breakdown: array of { signal: string, label: string, contribution: number, maxContribution: number, status: 'ok'|'warn'|'danger'|'missing', note: string }

Return: { score, grade, breakdown }
  - Estimate: 30m
  - Files: server.js
  - Verify: node inline test: call with signals from command-center (expected grade A or B) and paydirt-backend (expected grade C or D). Print score, grade, breakdown.
- [x] **T02: Wrote computeRepairQueue — 8-priority repair list with severity and target panel** — Write computeRepairQueue({ continuity, readiness, workflowState, proofSummary, latestImportRunsByArtifact, bootstrapPlan }) in server.js.

Priority logic — each check produces zero or one repair item:
1. (critical) continuity missing: { priority:1, severity:'critical', action:'Initialize continuity', rationale:'No Holistic state found — resuming blind risks duplicating work.', targetPanel:'continuity' }
2. (critical) readiness missing: { priority:2, severity:'critical', action:'Bootstrap workflow stack', rationale:'Required components missing — cockpit recommendations are unreliable.', targetPanel:'bootstrap' }
3. (high) stale continuity + missing hygiene: { priority:3, severity:'high', action:'Run handoff to record session context', rationale:'Continuity exists but no checkpoint recorded.', targetPanel:'continuity' }
4. (high) readiness partial with required gaps: { priority:4, severity:'high', action:'Apply repo-local bootstrap steps', rationale:'N required components missing.', targetPanel:'bootstrap' }
5. (medium) no imports ever: { priority:5, severity:'medium', action:'Import planning artifacts', rationale:'No milestones, requirements, or decisions imported yet.', targetPanel:'import' }
6. (medium) imports older than 14 days: { priority:6, severity:'medium', action:'Re-import planning artifacts', rationale:'Imports are N days old — cockpit interpretation may be stale.', targetPanel:'import' }
7. (medium) zero proven milestones but milestones exist: { priority:7, severity:'medium', action:'Run Import Summaries', rationale:'Milestones are claimed-only — run Import Summaries after completing work.', targetPanel:'proof' }
8. (low) stale continuity (but hygiene ok): { priority:8, severity:'low', action:'Run a handoff before switching context', rationale:'Continuity is stale — a fresh handoff will improve resume quality.', targetPanel:'continuity' }

Return array sorted by priority ascending (lowest number = fix this first). Empty array if no repairs needed.
  - Estimate: 30m
  - Files: server.js
  - Verify: node inline test: call with paydirt-backend signals — expect at least priority-1 or priority-5 item at top. Call with command-center signals — expect empty or only low-severity items.
- [x] **T03: Both functions verified against real repo data — correct grades and repair queue ordering** — Start the backend, fetch real plan data for command-center (id=1) and paydirt-backend (id=6), call both functions with the real signals, print the output, and assert the expected values:

command-center:
- score >= 0.60 (grade B or A)
- repair queue empty or only low-severity

paydirt-backend:
- score < 0.60 (grade C or D)
- repair queue has at least one item, top item is critical or high severity

No server changes in this task — pure verification only.
  - Estimate: 15m
  - Files: server.js
  - Verify: node script: fetch /api/projects/:id/plan for both repos, call functions, assert expected grades and repair queue shapes.
