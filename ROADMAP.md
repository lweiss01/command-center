# Command Center Roadmap

## Product Thesis

Command Center is a local-first planning cockpit for code repos.

It is designed around an iterative workflow loop:

- discuss
- research
- plan
- implement
- validate

The product's job is to ingest repo-native planning state (GSD/GSD2, Holistic, and related artifacts), normalize it, and make cross-repo progress and next actions legible.

## Current State (truthful snapshot)

- **M001:** complete
- **M002:** complete
- **M007:** complete
- **M008:** active (planned)
- **Active milestone:** M008

> Milestone IDs are durable and may be non-contiguous (for example M001, M002, M007, M008).

The app now includes:

- workspace discovery and artifact detection
- canonical import flows for milestones / requirements / decisions
- workflow, continuity, readiness, next-action, and open-loop cockpit surfaces
- explicit interpreted/provenance labeling on trust-sensitive UI panels
- cross-repo urgency/prioritization surfaces
- one-click Windows launcher + stop flows
- launcher diagnostics (`cc:doctor`) and troubleshooting documentation
- package-driven footer version display (`L.W. Hub v<package.json version>`)

## Milestone Register

## M001 — Core planning model + import-first foundation

**Status:** ✅ Complete

### Delivered

- project discovery and artifact inventory
- canonical planning schema and plan snapshot API
- imports for:
  - `.gsd/PROJECT.md`
  - `.gsd/REQUIREMENTS.md`
  - `.gsd/DECISIONS.md`
- import run/provenance tracking and stale-row cleanup foundations

## M002 — Resume-first cockpit intelligence

**Status:** ✅ Complete

### Delivered

- workflow interpretation contract with explainable evidence
- continuity and checkpoint hygiene surfaces
- readiness detection for standard stack components
- open-loop drill-down (what's next, blocked, unresolved, deferred)
- cross-repo prioritization view
- trust/anti-hidden-state labeling across interpreted panels
- one-click local launch UX (launcher + desktop shortcut flow)

## M007 — Launcher hardening + cockpit iteration

**Status:** ✅ Complete

### Delivered

- launcher doctor command (`npm run cc:doctor`) with PASS/WARN/FAIL output + remediation hints
- hardened start/stop command flows and dual desktop shortcuts
- troubleshooting matrix in README (symptom → command → inspection path)
- improved Next Action actionability:
  - stronger blocker emphasis
  - suggested command affordance
- package-driven footer version wiring (`vite define` + UI rendering)

## Next Milestone (active)

## M008 — Premium UX Redesign and Onboarding Clarity

**Status:** ▶ Active (planned)

### Why this milestone

Current UI communicates a lot of signal, but key surfaces still require too much interpretation effort for first-time users. This milestone formalizes a premium redesign focused on:

- explicit signal semantics (no ambiguous status pills)
- clear action hierarchy (no deceptive/dead-end primary actions)
- in-app onboarding discoverability (guide/help always reachable)
- polished, professional visual and interaction consistency

### Planned slices

1. **S01 — UX Baseline Audit and Signal Taxonomy**
   - produce prioritized UI defect map and signal taxonomy with acceptance criteria
2. **S02 — Project Card Redesign for Semantic Clarity**
   - replace ambiguous pills with labeled, scannable signals
3. **S03 — Action Hierarchy and In-App Onboarding Surface**
   - align header CTA hierarchy and onboarding/help discoverability
4. **S04 — Visual Polish, Accessibility, and Interaction Consistency**
   - unify focus/motion/typography/spacing for a professional final pass

## Open Questions

1. How dense can card-level signal labeling be before readability regresses?
2. Which action model should replace/implement the current New Project affordance?
3. What minimum UI quality gates should be enforced for future contributions (focus, semantics, motion)?

## Current Recommendation

1. Execute **M008/S01** first to lock redesign contract and acceptance criteria.
2. Land **S02** next to solve card-signal comprehension.
3. Complete **S03** and **S04** to finish onboarding + polish with accessibility safeguards.
