# S06: Trust and anti-hidden-state surfaces — Research

**Requirements owned:** R001 (truthful cockpit), R005 (missing-component surface), R008 (low-hidden-state), R014 (anti-bloat boundary)
**Supporting:** R002 (cross-repo view), R011 (discussion/research visibility)

---

## Summary

This is targeted work on existing UI code. No new backend functions needed, no new API fields — the server already exposes all the data S06 needs. The work is entirely in `src/App.tsx` and possibly one small backend label addition. The slice has two concerns:

1. **Epistemic labeling** — the UI does not clearly distinguish *imported facts* (data read from repo docs) from *interpreted conclusions* (what the server computed from them). Users see "Phase: active" with no reminder that this is a system interpretation, not a ground truth. Same for confidence, continuity status, and urgency scores. This is the hidden-state problem R008 names.

2. **Anti-bloat / truthfulness boundary** — prevent the cockpit from expanding into a PM-tool-feel. Currently the "Imported Milestones / Requirements / Decisions" sections at the bottom of the detail view present raw imported data without provenance context (when imported, from which artifact). A small provenance note per section preserves the "secondary display" contract from D002.

No new routes. No new database queries. No new interpretation functions. This is precision UI/label work.

---

## Implementation Landscape

### What the server returns today (all exploitable for S06)

From `/api/projects/:id/plan`:
- `milestones[].origin` — always `'imported'`, exists in the row
- `milestones[].confidence` — already rendered as "Confidence 100%" pill in the UI
- `latestImportRunsByArtifact.milestones.completedAt` — timestamp of last milestone import
- `requirements[].origin`, `decisions[].origin` — same `'imported'` field, same pattern
- `latestImportRunsByArtifact.requirements.completedAt`, `.decisions.completedAt` — timestamps
- `workflowState.evidence[]` — explicit evidence trail with `{ label, value }` pairs; already rendered
- `workflowState.reasons[]` — already rendered
- `workflowState.confidence` — number 0-1, already rendered
- `continuity.status` — `'fresh' | 'stale' | 'missing'`, already rendered
- `readiness.overallReadiness` — `'ready' | 'partial' | 'missing'`, already rendered
- `openLoops.summary.*` — already rendered

The server-side data model is complete. Nothing missing for S06's needs.

### What the UI is missing today

**In the interpretation panels (Workflow State, Readiness, Continuity, Next Action, Open Loops):**
- No consistent visual marker that distinguishes "this is an interpretation" from "this is a raw imported fact." A user seeing "Phase: active" at 85% confidence cannot tell at a glance whether that is ground truth or a computed inference.
- The "Evidence" sub-block in Workflow State goes partway toward explaining the interpretation, but it's buried and not labeled as "how this was computed."

**In the imported-data sections (Milestones, Requirements, Decisions list panels):**
- The `origin` badge already shows "imported" — that's good. The `confidence` badge is already shown — that's good. What's missing: *when* the data was last imported and *from which artifact*. Without this, the user cannot tell if they're looking at fresh repo state or week-old stale data.
- `latestImportRunsByArtifact` is already in `projectPlan` — it just isn't surfaced near the raw data panels. Each section header could note "Last imported X days ago from `.gsd/REQUIREMENTS.md`."

**In the portfolio card grid:**
- Portfolio badges (phase, continuity) show computed values with no visual distinction from ground-truth properties. The planning status badge is "ground truth" (scanned from disk); the phase and continuity badges are interpretations. A subtle typographic or color distinction would honor R008 without heavy UI surgery.

### Natural seams for task decomposition

**T01 — Provenance labels on interpretation panels** (server.js light-touch + App.tsx)
- Add a `dataSource` field to interpretation-level sections in the plan response that names the source artifact or method (e.g., `"Derived from milestones, requirements, decisions, and Holistic state"` for workflowState, `"Derived from .holistic/state.json"` for continuity).
- Alternatively (lighter): just add a static sub-label to each panel in App.tsx: "Interpreted from imported artifacts" under Workflow State header, "Derived from .holistic/state.json" under Continuity header, etc. This requires zero server changes and is immediately legible.
- **Recommended: static sub-labels in App.tsx** — the patterns are already consistent (each panel has a gray mono sub-label). Extending these with "how was this derived" text is one-liner per panel. Zero risk, zero server change.

**T02 — Import provenance near raw data panels + portfolio badge labeling**
- Add "Last synced: X days ago from `.gsd/REQUIREMENTS.md`" note to each imported-data section header using `latestImportRunsByArtifact` timestamps already in `projectPlan`.
- In the portfolio card, visually separate "ground truth" badges (planning status) from "interpretation" badges (phase, continuity). A simple approach: add a tiny label "Interpreted" or an `~` tilde prefix to the phase pill text to signal approximation.

---

## Verification Plan

```
npx tsc --noEmit   # zero errors
```

Browser assertions:
- `text_visible 'Interpreted from'` (or equivalent derivation label)  
- `text_visible 'Last synced'` in the requirements/milestones/decisions section headers  
- `no_console_errors`

---

## Risks and Constraints

- **Anti-bloat guard (R014):** The labeling should feel lightweight and informational, not a PM-tool checklist. Two-word sub-labels ("Derived from …") are the ceiling — no explanation tooltips, modals, or info popups.
- **Existing CSS class pattern:** All panels use the same `text-slate-500 font-mono text-xs uppercase tracking-[0.2em] mt-2` sub-label style. New derivation notes should use this same class, not a new pattern.
- **No new TypeScript interfaces needed:** The data is already in `projectPlan`. The changes are render-only additions.
- **Portfolio card space is tight:** The card already has planning status + phase + continuity badges + gaps line. A text change on the phase badge is safer than adding a new badge row.
- **importRun.artifactType** needs mapping to a readable path string. The mapping is simple: `'gsd_project'` → `.gsd/PROJECT.md`, `'gsd_requirements'` → `.gsd/REQUIREMENTS.md`, `'gsd_decisions'` → `.gsd/DECISIONS.md`. This is a small pure helper in App.tsx, not a server change.

---

## What NOT to do

- No new backend interpretation functions — all data is present
- No tooltips, info icons, or explainer modals — violates R014 anti-bloat
- No color overhaul — reuse existing CSS class patterns
- No new API routes or database queries
- Do not add more raw imported entity sections; the three existing ones (milestones, requirements, decisions) are the right boundary

---

## Recommended Task Decomposition

| Task | Scope | Files |
|------|-------|-------|
| T01 | Derivation sub-labels on all interpretation panels (Workflow State, Readiness, Continuity, Next Action, Open Loops) | `src/App.tsx` only |
| T02 | Import provenance timestamps on raw-data section headers + portfolio card epistemic marker | `src/App.tsx` only |

Both tasks are pure App.tsx. T01 is prerequisite to T02 only in the sense that reviewing T01's label approach avoids inconsistency — but they touch different parts of the file and can be done sequentially without dependency issues.
