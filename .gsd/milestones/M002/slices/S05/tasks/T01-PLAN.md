---
estimated_steps: 30
estimated_files: 1
skills_used: []
---

# T01: computeUrgencyScore + GET /api/portfolio endpoint

Add a pure `computeUrgencyScore({ continuity, readiness, openLoops, workflowState })` function and a `GET /api/portfolio` route to server.js. The route runs all interpretation functions across all projects, memoizes the two tool probes (holistic + gsd) at request time rather than once-per-project, sorts entries by urgencyScore descending, and returns the portfolio array.

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

## Inputs

- `server.js`

## Expected Output

- `server.js`

## Verification

curl -s http://localhost:3001/api/portfolio > check.json && node -e "const d=require('fs').readFileSync('check.json','utf8'); const p=JSON.parse(d); console.log('Count:', p.length); let prevScore=2; let sorted=true; p.forEach(e => { if(e.urgencyScore>prevScore) sorted=false; prevScore=e.urgencyScore; console.log(e.project.name, '| urgency:', e.urgencyScore, '| phase:', e.workflowPhase, '| continuity:', e.continuityStatus); }); console.log('Sorted desc:', sorted); require('fs').unlinkSync('check.json');" && echo OK

## Observability Impact

New /api/portfolio endpoint — exposes urgencyScore, workflowPhase, continuityStatus, checkpointHygiene, overallReadiness, readinessGaps, unresolvedCount per project. A future agent can curl the endpoint to audit all-project urgency ranking without loading each project individually.
