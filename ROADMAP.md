# Command Center Roadmap

## Product Thesis

Command Center is a local-first planning cockpit for code repos.

It is designed around an existing personal workflow:

- discuss
- research
- plan
- implement
- validate

It should understand and advance planning state that already lives inside repos, especially through:

- GSD / GSD2 planning docs
- Holistic continuity docs
- Beads issue/task graphs
- lightweight repo-local roadmap artifacts

The goal is **not** to become a general-purpose autonomous agent operating system.
The goal is to provide a durable, consistent, cross-repo planning and continuity layer that:

- imports existing repo state
- normalizes it into a canonical model
- makes progress comparable across repos
- preserves context between sessions
- helps the user know what to do next

## Product Boundaries

### Command Center is

- a project cockpit
- a cross-repo planning dashboard
- a canonical importer/reviewer of repo planning artifacts
- a continuity surface for resuming work safely
- a consistency layer across repos

### Command Center is not

- a Mission Control clone
- a generic task manager for everyone
- a cloud PM platform
- an agent-swarm execution operating system
- a vault / spend-control / external actions hub

## Key Design Principles

1. **Docs first.** Repo docs remain the source of truth whenever possible.
2. **Understand existing plans first.** Bootstrap authoring matters, but imported repo state comes first.
3. **Cross-repo consistency matters.** "75% done" should mean roughly the same thing across repos.
4. **Local-first and durable.** Progress and context should survive interruptions.
5. **Review over magic.** Imported state should distinguish imported, reviewed, verified, stale, and conflicted.
6. **Leverage existing workflow tools instead of replacing them.** GSD/GSD2, Holistic, and Beads should feel native in Command Center.

## Workflow Model

Command Center should standardize repo planning state onto the following workflow phases:

1. **Discuss** — raw idea shaping, framing, tradeoffs, problem definition
2. **Research** — feasibility, constraints, unknowns, references, options
3. **Plan** — milestones, slices, tasks, requirements, decisions, sequencing
4. **Implement** — active execution against an approved plan
5. **Validate** — proving the work is complete, correct, and accepted

This phase model is intended to become the canonical basis for:

- project status
- milestone state
- percent complete
- cross-repo comparisons
- recommended next action

## Workflow Inputs Command Center Must Understand

### GSD / GSD2

Primary structured planning inputs:

- `PROJECT.md`
- `ROADMAP.md`
- `REQUIREMENTS.md`
- `DECISIONS.md`
- milestone / slice / task plan and summary docs
- validation artifacts

### Holistic

Continuity inputs:

- current plan
- project history
- regression watch
- handoff summaries
- latest work context / next-step memory

### Beads

Beads is part of the intended workflow and should be treated as a first-class planning input.

Relevant Beads strengths:

- persistent issue/task memory for agents
- dependency-aware task graph
- ready-task detection
- hierarchy for epics, tasks, and subtasks
- durable issue state across sessions
- structured, machine-friendly CLI output

Command Center should eventually understand Beads concepts such as:

- issues / epics / subtasks
- blockers and dependency edges
- claimed / ready / in-progress / closed states
- priority
- graph relationships
- task readiness as a planning signal

Command Center should not replace Beads. It should ingest and translate Beads into the same canonical planning view used for GSD and Holistic so that the user gets one comparable cross-repo dashboard.

## Reconstructed First Session Summary

This roadmap reconstructs the first Command Center work session from commit history because Holistic was only installed after that session.

### What was completed in the first session

1. Initialized the Command Center baseline
2. Added runtime project discovery API
3. Loaded discovered projects in the dashboard
4. Added canonical planning schema endpoints
5. Added milestone import from GSD project docs
6. Showed imported milestones in the project panel

### What was likely started but interrupted

- import of `.gsd/REQUIREMENTS.md` into the canonical requirements model

There is local, uncommitted backend work in `server.js` that strongly suggests the next unfinished slice is requirements import.

---

# Milestones

## M001 — Core planning model + import-first foundation

### Goal

Create a trustworthy local foundation that can discover repos, detect planning artifacts, import canonical planning entities, and render a useful project cockpit from repo-backed state instead of seed/demo data.

### Success Criteria

- workspace projects can be discovered automatically
- planning artifacts can be detected and classified
- canonical planning entities exist in a normalized local model
- milestone import works from existing repo docs
- requirements and decisions import paths are established
- project cockpit shows imported planning state, not only seed data
- import provenance and warnings are recorded

### M001 Audit

#### Done

- workspace discovery
  - backend scan route exists
  - discovered projects are loaded into the dashboard
- source artifact detection
  - GSD/GSD2 and roadmap-like docs are classified through artifact rules
- canonical planning schema
  - normalized tables exist for projects, source artifacts, import runs, milestones, slices, tasks, requirements, decisions, and evidence links
- project listing/dashboard integration
- canonical project plan snapshot endpoint
- milestone import from `.gsd/PROJECT.md`
  - parser, import flow, provenance, route, and UI rendering exist
- requirements import from `.gsd/REQUIREMENTS.md`
  - parser, import flow, provenance, route, and UI rendering exist
- decisions import from `.gsd/DECISIONS.md`
  - parser, import flow, provenance, route, and UI rendering exist
- unified import controls in the project cockpit
  - milestones, requirements, and decisions can be re-imported from one shared control surface
- import run / provenance foundation
- red debug page gutter/background issue removed and global shell background normalized

#### In Progress

- import UX polish
  - latest import state is visible, but still shared as one most-recent import rather than a richer per-artifact review surface
- broader cockpit coverage beyond milestones / requirements / decisions
  - slices, tasks, workflow phase, blockers, and recommended next actions are not yet surfaced

#### Not Yet Done

- slice/task import into canonical model
- import warnings / review UI
- stale-row cleanup when imported source entries are deleted from docs
- apples-to-apples progress normalization
- cross-repo comparable workflow-state calculation

### Slices

#### S01 — Workspace discovery
- scan configured roots
- detect likely projects
- persist project metadata
- show discovered repos in dashboard

**Status:** Done

#### S02 — Source artifact detection
- detect GSD/GSD2 planning docs
- detect roadmap-like docs
- classify source artifact types
- persist artifact inventory

**Status:** Done

#### S03 — Canonical planning schema
- model projects, milestones, slices, tasks, requirements, decisions
- record import runs and evidence links
- expose canonical project plan endpoint

**Status:** Done

#### S04 — Milestone import
- parse `.gsd/PROJECT.md`
- import milestones
- attach provenance
- render imported milestones in project cockpit

**Status:** Done

#### S05 — Requirements import
- parse `.gsd/REQUIREMENTS.md`
- import requirements into canonical model
- attach provenance
- render requirements in project cockpit

**Status:** Done

#### S06 — Decisions import
- parse `.gsd/DECISIONS.md`
- import decisions into canonical model
- render decisions in project cockpit

**Status:** Done

#### S07 — Import UX and validation
- add explicit import / re-import controls
- show import warnings and status
- validate imports against real repos

**Status:** In Progress

### Current Best Next Step

Close out the remaining **M001 / S07 — Import UX and validation** gaps:

- improve visibility of import warnings and review state
- decide whether latest import state should remain global or become per-artifact
- document / implement stale-row cleanup behavior for removed source entries
- then move into M002 planning and implementation

---

## M002 — Consistent project cockpit + continuity intelligence

### Goal

Turn imported planning data into a consistent, resumable, comparable project cockpit across repos.

### Why this milestone matters

The core value of Command Center is not only importing docs. It is making state legible and consistent across projects so the user can quickly answer:

- where is this repo in the workflow?
- how far along is it?
- what is blocked?
- what is next?
- what context should I read before resuming?

### Success Criteria

- workflow phase is normalized across repos
- progress semantics are documented and comparable
- project cockpit shows current stage, current milestone, blockers, and next action
- Holistic continuity information is visible in the cockpit
- Beads task/graph state can be translated into the same canonical planning view
- cross-repo dashboard can compare projects apples-to-apples
- imported vs reviewed vs verified state is visible

### Implementation Approach

M002 should be built in two layers:

1. **Semantic normalization layer**
   - define how imported repo signals map into a canonical workflow state
   - define how progress is measured consistently
2. **User-facing cockpit layer**
   - render normalized state, continuity context, blockers, and next actions in the UI

The normalization layer comes first conceptually, but early cockpit slices can render intermediate state while normalization rules are being formalized.
The key assumption is that workflow state is **iterative and repeating** within a repo: the app should identify the current active loop for the current milestone/slice/body of work, not assume a repo only passes through the workflow phases once.

### Detailed Slice Plan

#### S01 — Workflow-state contract

**Goal:** Define the canonical state model that all repos will map into.

This state model should be treated as a **repeatable workflow loop**, not a one-time repo lifecycle.
A single repo may move through Discuss → Research → Plan → Implement → Validate many times over its life as milestones, slices, discoveries, and validation outcomes reopen the loop.
Command Center should therefore represent the repo's **current dominant phase** for the active body of work, while allowing the cycle to restart any number of times.

**Deliverables**
- a documented Discuss / Research / Plan / Implement / Validate contract
- explicit wording that the workflow loop is iterative within a repo, not linear and one-way
- precedence rules when multiple signals conflict
- explicit mapping from imported artifacts to workflow phase candidates
- project-level phase output plus confidence level

**Likely inputs**
- GSD/GSD2 roadmap, requirements, decisions, validation docs
- Holistic current-plan / handoff state
- Beads ready / in-progress / blocked / closed task state

**Proof of completion**
- roadmap/state contract documented in repo
- backend can compute a preliminary workflow phase per project

#### S02 — Project cockpit v2

**Goal:** Make the project view answer "what's going on here right now?"

**Deliverables**
- current workflow phase banner
- current milestone summary
- active slice/task summary (when available)
- blockers panel
- next recommended action panel
- visible distinction between imported data and interpreted state

**Proof of completion**
- selected project shows a coherent status summary without reading raw docs

#### S03 — Holistic continuity integration

**Goal:** Make resuming work a first-class product surface.

**Deliverables**
- latest handoff summary in cockpit
- current-plan summary in cockpit
- regression watch visibility
- freshness/staleness indicator for continuity state
- resume-here / read-these-first guidance

**Proof of completion**
- after selecting a project with Holistic memory, the user can see what was last worked on and what to do next

#### S04 — Beads translation layer

**Goal:** Translate Beads state into the same canonical planning model.

**Deliverables**
- understand ready / claimed / in-progress / blocked / closed task states
- understand parent/child and dependency edges
- surface Beads readiness as a planning signal
- map Beads issue graph into comparable project-state summaries

**Proof of completion**
- a Beads-backed repo can be shown in the same cockpit/dashboard with meaningful comparable status

#### S05 — Progress normalization

**Goal:** Make 75% in one repo mean roughly the same as 75% in another.

**Deliverables**
- documented progress formula or rule-set
- separation of execution progress vs validation/proof confidence where useful
- standard milestone/project rollup semantics
- confidence penalties for stale, conflicting, or unreviewed state

**Proof of completion**
- progress values are derived, documented, and explainable across repos

#### S06 — Cross-repo dashboard

**Goal:** Provide apples-to-apples comparison across repos.

**Deliverables**
- portfolio view showing normalized workflow phase, progress, confidence, blockers, and freshness
- sorting/filtering by phase, blocked state, and next-action readiness
- "what should I work on next?" support

**Proof of completion**
- user can compare multiple repos without mentally translating each repo's private conventions

#### S07 — Review/confidence model

**Goal:** Show how trustworthy imported/interpreted state is.

**Deliverables**
- explicit labels such as imported / reviewed / verified / stale / conflicted
- UI surfaces for warning on low-confidence state
- clear distinction between imported facts and Command Center interpretation

**Proof of completion**
- the app avoids overstating certainty when repo state is partial or inconsistent

### Suggested Execution Order

Recommended order for implementation:

1. **S01 — Workflow-state contract**
2. **S03 — Holistic continuity integration**
3. **S04 — Beads translation layer**
4. **S02 — Project cockpit v2**
5. **S05 — Progress normalization**
6. **S06 — Cross-repo dashboard**
7. **S07 — Review/confidence model**

This order prioritizes correctness of interpretation before more polished cross-repo presentation.

### Status

**Planned**

---

## M003 — Docs-first planning authoring

### Goal

Help create and refine plans for repos while preserving repo docs as canonical.

### Success Criteria

- repos without good planning docs can be bootstrapped
- milestones/slices/tasks can be drafted in a consistent structure
- users can review changes before they are written to docs
- write-back preserves traceability

### Slices

#### S01 — Bootstrap missing plans
- generate starter roadmap structure for repos with weak or missing planning docs

#### S02 — Milestone authoring assist
- draft milestones in canonical structure

#### S03 — Slice and task authoring assist
- draft slices and tasks in consistent format

#### S04 — Requirement and decision authoring assist
- support drafting requirements and decisions

#### S05 — Review-before-write flow
- show diffs / previews before changing docs

#### S06 — Docs write-back
- write approved changes back into repo planning docs

**Status:** Planned

---

## M004 — Validation and proof model

### Goal

Make completion mean proven completion, not just task motion.

### Success Criteria

- validation state is visible for milestones and slices
- requirements have proof / validation surfaces
- project cockpit distinguishes planned, implemented, and validated

### Slices

- verification evidence surfaces
- requirement validation tracking
- milestone validation summaries
- claimed-vs-proven views
- completion rules tied to proof

**Status:** Planned

---

## M005 — Drift detection and repair

### Goal

Detect when plan/context state has gone stale or fallen out of sync.

### Success Criteria

- stale imports are visible
- missing artifacts are visible
- inconsistent planning states can be flagged
- continuity gaps can be detected and repaired

### Slices

- stale import detection
- missing-doc detection
- artifact mismatch detection
- unfinished handoff detection
- recommended repair actions

**Status:** Planned

---

## M006 — Portfolio planning and focus management

### Goal

Help choose the right repo and right milestone next without flattening everything into generic task soup.

### Success Criteria

- cross-repo portfolio dashboard exists
- prioritization signals are visible
- user can identify the best next project to resume

### Slices

- portfolio dashboard
- repo prioritization heuristics
- active work queue
- blocker/risk rollups
- best-next-project recommendations

**Status:** Planned

---

## M007 — Optional adapters and ecosystem support

### Goal

Extend artifact support and integrations only if they preserve the product’s simplicity.

### Slices

- better support for non-GSD repos
- Beads integration depth expansion
- additional planning artifact adapters
- lightweight agent-facing context export

**Status:** Planned

---

# Open Questions To Revisit Later

These do not block current work, but they should be answered as the roadmap evolves:

1. How should normalized percent-complete be calculated across repos?
2. Should Beads become part of the canonical progress calculation, or remain supplemental context at first?
3. What level of write-back into repo docs is acceptable in M003?
4. How much of Holistic data should be rendered directly vs summarized?
5. When should Command Center show confidence warnings vs hard blockers?

# Current Recommendation

Proceed in this order:

1. close the remaining **M001 / S07 — Import UX and validation** gaps
2. begin **M002 / S01 — Workflow-state contract**
3. integrate **M002 / S03 — Holistic continuity integration**
4. integrate **M002 / S04 — Beads translation layer**
5. then build out the richer **M002 cockpit + dashboard** surfaces

This keeps the product grounded in real repo state while moving toward comparable cross-repo status and continuity intelligence.
