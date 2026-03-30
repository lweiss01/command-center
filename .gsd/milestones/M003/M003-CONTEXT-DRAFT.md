---
depends_on: [M002]
draft: true
---

# M003: Workflow bootstrap and authoring — Context Draft

**Gathered:** 2026-03-27
**Status:** Draft — needs dedicated discussion before planning

## Seed Material from Current Discussion

M003 should turn Command Center from a detector of workflow gaps into a staged bootstrap and authoring assistant for the user’s standard workflow stack.

The user wants Command Center to:
- notify when workflow components are missing
- explain what is missing and why it matters
- offer to install/bootstrap/configure missing pieces when possible
- prefer repo-local bootstrap first, then machine-level setup second
- potentially reuse another repo as a known-good template rather than hand-rolling setup every time

The standard workflow stack currently named is:
- GSD
- GSD2
- Beads
- Holistic

## What This Milestone Likely Unlocks

- repo-local planning/bootstrap assistance after M002 can already tell the truth about readiness
- template-based setup reuse instead of repetitive manual wiring
- staged repair flows that stay inspectable and approval-driven

## Constraints Already Clear

- do not become hidden-state automation
- do not become generic PM software
- keep staged approval, especially for machine-level installs or broad repo mutation
- keep template origin and intended effects visible

## Open Questions for Dedicated Discussion

- What counts as a “template” in practice: another repo, a component library, a manifest, or all three?
- Which setup actions should always require explicit confirmation even if they look safe?
- How much repo-doc authoring belongs here versus later refinement milestones?
