# S01: Workflow interpretation contract

**Goal:** Define and ship a repeatable, explainable workflow interpretation contract in the backend — deepening computeWorkflowState, computeContinuity, and computeNextAction so they return structured phase, confidence, evidence items, and reasons instead of opaque scalar outputs — and update the cockpit to surface those structured signals visibly.
**Demo:** After this: After this: a selected repo shows an explainable workflow phase, confidence, and evidence trail instead of only imported entities.

## Tasks
- [x] **T01: Audited computeWorkflowState, computeContinuity, and computeNextAction — documented current shapes and target structured shapes for all three functions** — Read computeWorkflowState, computeContinuity, and computeNextAction in server.js. Document what each currently returns, what inputs it uses, and what structured output shape we want to replace it with. Identify which fields are already present in the plan payload and which are missing.
  - Estimate: 30m
  - Files: server.js
  - Verify: Task summary documents current return shapes and target structured shapes for computeWorkflowState, computeContinuity, computeNextAction.
- [x] **T02: Rewrote computeWorkflowState to return structured phase, numeric confidence, reasons[], and evidence[] — updated all App.tsx consumers** — Rewrite computeWorkflowState(inputs) to return { phase: string, confidence: number (0-1), reasons: string[], evidence: { label, value }[] }. Phase values: 'no-data' | 'import-only' | 'active' | 'stalled' | 'blocked'. Confidence is derived from: milestone presence, requirement coverage, import recency, continuity freshness. Reasons and evidence are the explicit signals that produced the phase and confidence — never empty if confidence < 1. Keep the function conservative and explainable — no weighted scoring magic.
  - Estimate: 1h
  - Files: server.js
  - Verify: node -e "import('./server.js')" starts without error. GET /api/projects/:id/plan returns workflowState with phase, confidence, reasons[], evidence[] fields.
- [x] **T03: Rewrote computeContinuity to return structured {status, freshAt, ageHours, latestWork, checkpointHygiene, hygieneNote} — updated all consumers in computeWorkflowState, computeNextAction, and App.tsx** — Rewrite computeContinuity(project) to return { status: 'fresh'|'stale'|'missing', freshAt: string|null, ageHours: number|null, latestWork: string|null, checkpointHygiene: 'ok'|'stale'|'missing', hygieneNote: string|null }. Read from Holistic state.json if present at {rootPath}/.holistic/state.json. If absent, status is 'missing'. If present, derive freshness from lastUpdated timestamp. Keep existing basic freshness behavior as the fallback.
  - Estimate: 1h
  - Files: server.js
  - Verify: GET /api/projects/:id/plan returns continuity with status, freshAt, ageHours, latestWork, checkpointHygiene fields.
- [x] **T04: Rewrote computeNextAction to return {action, rationale, blockers[]} with directive action text and explicit blocker list** — Rewrite computeNextAction(inputs) to return { action: string, rationale: string, blockers: string[] }. The action should be the single clearest next step given phase, continuity status, and readiness signals available. Blockers is the explicit list of things preventing normal work — empty array when path is clear. Action text should be directive and short (imperative sentence). Rationale explains why this action was chosen.
  - Estimate: 45m
  - Files: server.js
  - Verify: GET /api/projects/:id/plan returns nextAction with action, rationale, blockers[] fields.
- [x] **T05: Confirmed cockpit renders structured workflow phase, confidence, evidence, continuity, and next action panels with zero console errors** — Update src/App.tsx to render the new structured workflowState, continuity, and nextAction fields. Show: workflow phase label with appropriate color coding, confidence percentage or indicator, at least the first reason/evidence item, continuity status and age, next action as a directive callout, blockers list if non-empty. Keep the UI lean — this is signal display, not a full dashboard rebuild. Ensure no console errors on load for any discovered repo including repos with missing continuity.
  - Estimate: 1h
  - Files: src/App.tsx
  - Verify: Browser: cockpit for command-center repo shows workflow phase, confidence, at least one evidence/reason item, continuity status, next action, and zero console errors.
