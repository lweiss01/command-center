# Project

## What This Is

Command Center is a local-first, docs-first cockpit for understanding and advancing real repo workflow state.

It discovers projects across a workspace, detects planning and continuity artifacts already living in those repos, imports them into a canonical local model, and helps answer the practical questions that matter after interruptions: where things are, what happened last, what is missing, what is stale, what is still unresolved, and what should happen next.

It exists as a deliberate reaction against heavier orchestration tools that felt too complex, too bloated, and too buggy for this workflow. The product should stay small, sharp, truthful, and grounded in repo-local artifacts instead of becoming generic PM software.

## Core Value

Open Command Center and quickly understand which repos deserve attention, what state they are actually in, and how to resume work safely without rebuilding context from scratch.

## Current State

M001 foundation is complete. M002/S01–S05 are complete:
- workspace discovery scans roots and persists detected repos
- source artifact detection recognizes repo-local planning docs
- a canonical SQLite planning schema exists for projects, artifacts, import runs, milestones, slices, tasks, requirements, decisions, and evidence links
- canonical import flows exist for `.gsd/PROJECT.md`, `.gsd/REQUIREMENTS.md`, and `.gsd/DECISIONS.md`
- **computeWorkflowState** returns `{ phase, confidence, reasons[], evidence[] }` — five phase values, additive fixed-increment confidence, explicit evidence and reasons
- **computeContinuity** returns `{ status, freshAt, ageHours, latestWork, checkpointHygiene, hygieneNote, checkpointCount, lastCheckpointReason, handoffCommand }` — sourced from Holistic state.json; checkpoint key-path fixed to `passiveCapture.lastCheckpointAt ?? lastAutoCheckpoint`; `latestWork` prefers `activeSession.resumeRecap[0]`; `handoffCommand` is platform-injected server-side
- **computeNextAction** returns `{ action, rationale, blockers[] }` — `stale + missing` hygiene is a hard blocker; `stale + ok/stale` hygiene is only a soft reminder (blockers[] empty)
- cockpit continuity panel shows a visible hygiene callout (stale/missing) or compact confirmation (ok) with the handoff command string; checkpoint count and last reason displayed as secondary quality line
- **computeReadiness** returns `{ overallReadiness, components[], gaps[] }` — 10-component standard stack audit (GSD dir+docs, Holistic dir+tool, GSD tool, Beads dir); machine-tool probes use execFileSync with 2s timeout; `overallReadiness === 'missing'` forces phase to 'blocked'; gaps wired into workflowState evidence, reasons, and nextAction blockers
- cockpit Workflow Readiness panel shows overall status badge, per-component ✓/✗ list with notes, and a Gaps section when required components are absent
- **computeOpenLoops** returns `{ nextMilestone, blockedMilestones, unresolvedRequirements, deferredItems, revisableDecisions, summary }` — nextMilestone is the first non-done milestone; unresolvedRequirements filters active+unvalidated (capped at 5 in UI with overflow); revisableDecisions uses freeform 'yes'-prefix filter on the revisable field
- cockpit Open Loops panel renders all five sub-sections with live data; summary badges show unresolvedCount + deferredCount + blockedCount; unresolved requirements capped at 5 with '+ N more' overflow
- **computeUrgencyScore** pure function ranks projects by urgency using additive fixed increments: +0.40 fresh continuity, +0.25 unresolved requirements, +0.20 stalled/no-data with non-missing continuity, +0.15 readiness gaps; capped at 1.0
- **GET /api/portfolio** endpoint probes tool availability once, runs the full five-function interpretation pipeline per project, assembles PortfolioEntry objects (phase, continuity, readiness, unresolvedCount, urgencyScore, etc.), and returns them sorted descending by urgencyScore
- App.tsx card grid augmented with phase + continuity badges per card, skeleton loading pills, gap indicator line (gaps · unresolved), and a sort toggle (urgency / name)
- zero console errors; TypeScript compiles clean

## Architecture / Key Patterns

- React + TypeScript + Vite frontend
- Express + better-sqlite3 backend bridge
- repo-local planning docs remain the durable source of truth whenever possible
- Command Center maintains a canonical imported/interpreted model, but should not hide truth inside opaque internal-only state
- workflow interpretation is conservative and explainable; imported facts and interpreted conclusions should remain visibly distinct
- continuity is sourced from repo-local Holistic artifacts and should influence confidence and resume guidance
- workflow readiness audits both repo-local docs and callable workflow tools for the standard stack: GSD dir+docs, Holistic dir+tool, GSD tool, and Beads dir; gaps surface in workflowState, nextAction blockers, and the cockpit Readiness panel

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] M001: Core planning model + import-first foundation — Trustworthy discovery, import, provenance, and cockpit foundation audited against real code.
- [ ] M002: Resume-first cockpit + workflow readiness — Truthful repo state, continuity hygiene, readiness detection, and cross-repo prioritization.
- [ ] M003: Workflow bootstrap and authoring — Stage and apply repo-local workflow docs, templates, and setup flows.
- [ ] M004: Validation and proof model — Distinguish imported claims from verified completion and requirement proof.
- [ ] M005: Drift repair and portfolio prioritization — Detect stale or inconsistent repo state and help choose what deserves attention next.
- [ ] M006: Sharp ecosystem expansion — Add deeper integrations only where they preserve the anti-bloat constraint.
