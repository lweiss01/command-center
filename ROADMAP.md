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
- **Active milestone:** none

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

## Next Milestone (recommended)

## M008 — Clear-state actionability + authoring ergonomics

**Status:** ⏳ Proposed (not yet planned)

### Why this next

Current local data has blocked next-action states across all discovered repos (`clear=0`), which limited clear-state assertion coverage. The next step should close that verification gap while continuing usability gains.

### Suggested slices

1. **S01 — Clear-state verification fixtures**
   - add deterministic fixture/setup path so Next Action clear-state can be asserted in browser tests
2. **S02 — Action flow polish**
   - extend command affordance and lightweight copy/run UX where appropriate
3. **S03 — Docs-first authoring entrypoint (optional)**
   - begin M003-style bootstrap assist for missing-plan repos if desired

## Open Questions

1. Should clear-state verification rely on fixtures, seeded DB state, or a deterministic mock route?
2. How far should command affordances go (copy-only vs click-to-run integrations)?
3. Which authoring assist scope should land first once cockpit/actionability gaps are closed?

## Current Recommendation

1. Plan and execute **M008/S01** first (clear-state verification coverage).
2. Then execute **M008/S02** (action flow polish).
3. Reassess whether to start docs-first authoring as M008/S03 or as a dedicated new milestone.
