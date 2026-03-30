# M001 — Research

**Date:** 2026-03-27

## Summary

M001 is a real import-first foundation, not just planning prose. The codebase already has the two critical halves wired together: `server.js` owns workspace discovery, artifact detection, the canonical SQLite schema, import provenance, and first-pass workflow interpretation; `src/App.tsx` consumes that model and renders a cockpit that can scan, import, and present milestones, requirements, decisions, continuity, workflow confidence, and a recommended next action. A production build passes via `npm run build`, which is the strongest automated proof surface currently present in the repo.

The main planning implication is that the next milestone should build outward from the existing `/api/projects/:id/plan` snapshot rather than adding new disconnected routes or a second interpretation layer. The natural extension point is the backend interpretation seam (`computeContinuity`, `computeWorkflowState`, `computeNextAction`) plus the frontend cockpit sections already reserved for those concepts. The main risk is concentration: most core behavior lives in one backend file and one frontend file, so slice ordering should retire risk by extending the existing seams incrementally instead of broadening import depth too early.

## Recommendation

Treat the imported canonical model plus the single repo snapshot endpoint as the foundation contract for follow-on work. Prove resume/readiness behavior first by extending conservative interpretation and failure visibility around what already exists, then deepen repo drill-down and portfolio comparison once those signals are trustworthy.

Specifically: keep repo-local docs and Holistic continuity as the durable evidence sources, keep interpretation explainable and visibly secondary, and avoid spending early slices on deeper slice/task import or heavy authoring flows. The schema already has room for slices and planning tasks, but M001 does not yet use them in the user loop; pushing into deeper import now would expand hidden-state risk faster than it improves the cockpit.

## Implementation Landscape

### Key Files

- `server.js` — single backend seam for the milestone foundation. Key areas:
  - schema + persistence tables for `projects`, `source_artifacts`, `import_runs`, `milestones`, `slices`, `planning_tasks`, `requirements`, `decisions`, and `evidence_links`
  - discovery/detection via `detectArtifacts()`, `derivePlanningStatus()`, `upsertProjectWithArtifacts()`, `scanWorkspaceRoot()`
  - interpretation via `computeContinuity()`, `computeWorkflowState()`, `computeNextAction()`
  - import/parsing via `parseGsdProjectMilestones()`, `importGsdProjectMilestones()`, `parseGsdRequirements()`, `importGsdRequirements()`, `parseGsdDecisions()`, `importGsdDecisions()`
  - integration contract via `GET /api/projects/:id/plan`, which already returns imported entities plus interpreted workflow/continuity/next-action state
- `src/App.tsx` — single frontend seam for the cockpit. Key areas:
  - project loading and selection via `loadProjects()` and `loadProjectPlan()`
  - import triggers via `handleImportMilestones()`, `handleImportRequirements()`, `handleImportDecisions()`
  - workspace discovery via `handleScanWorkspace()`
  - current UI surfaces for workflow state, continuity, next action, import warnings, imported milestones, imported requirements, imported decisions, and preserved legacy tasks
- `package.json` — current verification surface. There is a `build` script and `lint` script, but no test script or dedicated browser/UAT harness.

### Build Order

1. **Preserve the snapshot contract first** — treat `GET /api/projects/:id/plan` as the primary boundary and extend it rather than bypassing it. That keeps imported facts and interpreted conclusions assembled in one place.
2. **Strengthen continuity and readiness interpretation next** — the lowest-risk, highest-value expansion is inside `computeContinuity()`, `computeWorkflowState()`, and `computeNextAction()`, because the frontend already has dedicated sections for those concepts.
3. **Add failure visibility before deeper automation** — once interpretation grows, expose explicit missing/stale/blocking reasons in the same plan payload and cockpit UI before adding bootstrap or authoring actions.
4. **Only then deepen entity coverage** — slices/tasks import and richer provenance/evidence drill-down should come after the repo-resume loop is trustworthy, otherwise the product risks growing data depth faster than user value.

### Verification Approach

- Build proof: `npm run build`
- Backend runtime proof: `node server.js` and confirm the bridge starts on `http://localhost:3001`
- Frontend runtime proof: run the Vite app and load `http://127.0.0.1:3000`
- Integrated behavior proof:
  - scan a workspace and confirm repos are discovered with artifact counts and planning status
  - open a repo and confirm `/api/projects/:id/plan` renders workflow, continuity, next-action, milestones, requirements, and decisions without request failures
  - re-run milestone/requirement/decision imports and confirm import-run summaries and warning states update in the cockpit
- Diagnostic proof:
  - verify stale or missing Holistic state visibly changes continuity freshness and workflow confidence
  - verify missing `.gsd` artifacts return explicit import failures rather than silent empty state

## Constraints

- The codebase is intentionally docs-first and repo-first; internal canonical state must stay subordinate to repo-local artifacts.
- The current architecture concentrates most backend logic in `server.js` and most cockpit rendering in `src/App.tsx`, so changes will have high local coupling unless seams are extracted gradually.
- There is no established automated test suite in the repo today; practical proof currently depends on build success and live runtime checks.
- The parser/import layer is format-sensitive by design. Existing regex/table parsers assume current `.gsd` conventions and should be extended conservatively.

## Common Pitfalls

- **Deepening import before strengthening interpretation** — the schema already contains `slices` and `planning_tasks`, but importing more entities before the resume/readiness loop is sharper would increase data volume without materially improving the user’s next safe step.
- **Hiding interpretation inside opaque scoring** — `computeWorkflowState()` and `computeNextAction()` are currently simple and explainable. Replacing them with heavier weighted heuristics too early would undermine R001, R008, and R014.
- **Letting frontend state fork from backend truth** — the cockpit currently trusts the backend snapshot. Adding client-side derived workflow judgments would create duplicate logic and drift.
- **Treating evidence storage as validation proof** — `evidence_links` records provenance, but it is not yet a claimed-vs-proven model. That distinction should remain explicit until M004.

## Open Risks

- Workflow/readiness expansion could overreach into generic PM behavior if slices optimize for more imported surface area instead of better resume guidance.
- Parser rigidity may create noisy partial imports as `.gsd` formats evolve; warnings exist, but richer failure visibility may be needed before import depth grows.
- The current single-file backend/frontend concentration makes regression risk real if M002 lands as one broad refactor instead of narrow slices.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| React / Vite cockpit UI | `react-best-practices` | installed |
| Express backend | `aj-geddes/useful-ai-prompts@nodejs-express-server` | available |
| Express + TypeScript patterns | `mindrally/skills@express-typescript` | available |
| better-sqlite3 | none found | none found |

## Candidate Requirement Notes

These are advisory only and should not become binding without user approval:

- **Candidate requirement:** artifact-level provenance drill-down in the cockpit. The backend already stores `evidence_links`, but the UI does not yet expose line-level provenance or source excerpts. This would strengthen explainability if M004 needs visible proof ancestry.
- **Candidate requirement:** explicit readiness reasons in the plan payload. Current next-action and continuity logic is conservative, but repo/machine readiness for the standard workflow stack will need structured missing/stale/blocking reasons to satisfy R004 and R005 cleanly.

Requirements that look like table stakes for follow-on milestones: R001, R003, R004, R005, R006, R012, R014. Requirements that should remain deferred until the truth model is stronger: R013, R015, R016, R017. The main overbuild risk is anything that starts to resemble hidden orchestration or generic PM state before those table-stakes repo-resume surfaces are solid.
